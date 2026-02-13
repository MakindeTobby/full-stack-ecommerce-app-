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
    // typed parameters - token is JWT, user is optional (only present on first sign-in)
    async jwt({
      token,
      user,
    }: {
      token: JWT;
      user?: NextAuthUser | undefined;
    }): Promise<JWT> {
      if (user) {
        try {
          // find existing user by email
          const found = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email?.toString() ?? ""))
            .then((r) => r[0]);
          if (found) {
            console.log(found, " user found");
          } else {
            console.log(" user not found");
          }

          let dbUser: { id: string; role?: string } | undefined;
          if (!found) {
            const inserted = await db
              .insert(users)
              .values({
                email: user.email?.toString() ?? "",
                name: user.name ?? null,
                role: "customer",
              })
              .returning({ id: users.id, role: users.role });

            // inserted[0].id should be a UUID string
            dbUser = {
              id: String(inserted[0].id),
              role: inserted[0].role as string,
            };
          } else {
            dbUser = { id: String(found.id), role: found.role ?? undefined };
            if (!found.name && user.name) {
              await db
                .update(users)
                .set({ name: user.name })
                .where(eq(users.id, found.id));
            }
          }

          // attach DB fields to JWT (store string UUID)
          (token as JWT & { id?: string }).id = dbUser.id;
          (token as JWT & { role?: string }).role = dbUser.role ?? "customer";
        } catch (e) {
          console.error("NextAuth upsert user error:", e);
        }
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
