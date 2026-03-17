"use client";

import Link from "next/link";
import { useState } from "react";
import AppShell from "@/components/layout/AppShell";

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
      <div className="mx-auto my-8 w-full max-w-xl px-4 sm:px-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600">
            Magic Link
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Email Sign-In</h1>
          <p className="mt-1 text-sm text-slate-600">
            Enter your email and we will send a secure one-time sign-in link.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="auth-email"
                className="text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="h-11 w-full rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-70"
            >
              {status === "sending" ? "Sending link..." : "Send Magic Link"}
            </button>
          </form>

          {status === "sent" && message ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}

          {status === "error" && message ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {message}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
            <Link href="/signin" className="text-slate-600 hover:text-violet-700">
              Back to sign in
            </Link>
            <Link href="/products" className="text-slate-600 hover:text-violet-700">
              Continue as guest
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
