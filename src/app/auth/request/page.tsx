"use client";

import Link from "next/link";
import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";

type SendState = "idle" | "sending" | "sent" | "error";

export default function RequestMagicLink() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SendState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setStatus("error");
      setMessage("Enter a valid email address.");
      return;
    }

    setStatus("sending");
    setMessage(null);

    try {
      const res = await fetch("/api/auth/magic/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setMessage(data?.error ?? "Failed to send magic link.");
        return;
      }

      setStatus("sent");
      setMessage("Magic link sent. Check your inbox and spam folder.");
    } catch {
      setStatus("error");
      setMessage("Network error while sending magic link.");
    }
  }

  return (
    <AppShell>
      <div className="qb-page mx-auto max-w-md">
        <PageHeader
          title="Email Sign-In"
          subtitle="Enter your email and we will send a secure one-time sign-in link."
        />

        <Card className="space-y-4 p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="auth-email"
                className="text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <Input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={status === "sending"}
            >
              {status === "sending" ? "Sending link..." : "Send Magic Link"}
            </Button>
          </form>

          {status === "sent" && message && (
            <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {message}
            </p>
          )}

          {status === "error" && message && (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {message}
            </p>
          )}

          <p className="text-xs text-gray-500">
            Already have an active session?{" "}
            <Link href="/signin" className="underline">
              Go back to sign in
            </Link>
            .
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
