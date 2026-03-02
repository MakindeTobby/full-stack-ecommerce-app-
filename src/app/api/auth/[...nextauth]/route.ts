// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import type { User as NextAuthUser } from "next-auth";
import type { Session } from "next-auth";

import { db } from "@/db/server";
import { users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { verification_tokens } from "@/db/schema";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

async function ensureUserByEmail(email: string, name?: string | null) {
  const normalizedEmail = email.trim().toLowerCase();
  const displayName = name?.trim() || null;

  const existing = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (existing) {
    if (!existing.name && displayName) {
      await db
        .update(users)
        .set({ name: displayName })
        .where(eq(users.id, existing.id));
    }
    return { id: String(existing.id), role: existing.role ?? "customer" };
  }

  const inserted = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      name: displayName,
      role: "customer",
    })
    .returning({ id: users.id, role: users.role });

  return {
    id: String(inserted[0].id),
    role: inserted[0].role ?? "customer",
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "magic",
      name: "Magic Link",
      credentials: {
        email: { label: "Email", type: "email" },
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const token = credentials?.token;
        if (!email || !token) return null;

        // find token row (use `and()` to combine predicates)
        const rows = await db
          .select()
          .from(verification_tokens)
          .where(
            and(
              eq(verification_tokens.identifier, email),
              eq(verification_tokens.token, token)
            )
          );

        const vt = rows[0];
        if (!vt) return null;

        // check expiry
        if (new Date(vt.expires) < new Date()) {
          await db
            .delete(verification_tokens)
            .where(eq(verification_tokens.id, vt.id));
          return null;
        }

        // consume token (delete it)
        await db
          .delete(verification_tokens)
          .where(eq(verification_tokens.id, vt.id));

        // find or create user in our users table
        let found = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .then((r) => r[0]);

        if (!found) {
          const inserted = await db
            .insert(users)
            .values({
              email,
              name: null,
              role: "customer",
            })
            .returning({
              id: users.id,
              email: users.email,
              name: users.name,
              role: users.role,
              created_at: users.created_at,
            });

          // inserted[0] will now include role and created_at
          found = inserted[0];
        }

        // Return minimal user object expected by NextAuth
        // IMPORTANT: id must be a string (UUID), so ensure found.id is string
        return {
          id: String(found.id),
          name: found.name ?? null,
          email: found.email,
        } as unknown as NextAuthUser;
      },
    }),

    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },

  callbacks: {
    async signIn({ user }): Promise<boolean> {
      const email = user?.email?.toString().trim();
      if (!email) return false;

      // Enforce DB persistence before considering auth successful.
      await ensureUserByEmail(email, user?.name ?? null);
      return true;
    },

    // typed parameters - token is JWT, user is optional (only present on first sign-in)
    async jwt({
      token,
      user,
    }: {
      token: JWT;
      user?: NextAuthUser | undefined;
    }): Promise<JWT> {
      if (user?.email) {
        const dbUser = await ensureUserByEmail(
          user.email.toString(),
          user.name ?? null,
        );
        (token as JWT & { id?: string }).id = dbUser.id;
        (token as JWT & { role?: string }).role = dbUser.role;
        return token;
      }

      // Fallback for existing sessions where JWT has email but no id/role.
      if (!token.id && token.email) {
        const dbUser = await ensureUserByEmail(token.email.toString());
        (token as JWT & { id?: string }).id = dbUser.id;
        (token as JWT & { role?: string }).role = dbUser.role;
      }
      return token;
    },

    // session callback: attach id & role from token to session.user
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT & { id?: string; role?: string };
    }): Promise<Session> {
      if (token && session.user) {
        // token.id is string UUID per augmentation above
        session.user.id = token.id as string;
        session.user.role = token.role ?? session.user.role ?? "customer";
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
