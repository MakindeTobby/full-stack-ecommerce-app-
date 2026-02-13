// app/account/setup/page.tsx
import React from "react";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { NextAuthOptions } from "next-auth";
import ProfileSetupForm from "./ProfileSetupForm";

export default async function SetupPage() {
  // Server component: ensure signed in
  const session: Session | null = await getServerSession(
    authOptions as NextAuthOptions
  );

  if (!session?.user?.id) {
    redirect("/signin");
  }

  // If name exists already - redirect away
  if (session.user?.name) {
    redirect("/");
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Complete your profile</h1>
      {/* Server Actions approach: form posts to server action in same file */}
      <ProfileSetupForm userId={session?.user.id} />
    </div>
  );
}
