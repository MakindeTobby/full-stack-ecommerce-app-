// lib/auth/profile.ts
import { db } from "@/db/server";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export function isProfileComplete(userRow: {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  created_at: Date | null;
}) {
  // Adjust requirements here
  return !!userRow?.name; // require name for now
}

export async function fetchUserById(userId: string) {
  const r = await db.select().from(users).where(eq(users.id, userId));
  return r[0] ?? null;
}
