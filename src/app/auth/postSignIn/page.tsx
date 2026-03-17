// app/auth/postSignIn/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AppShell from "@/components/layout/AppShell";

export default function PostSignInPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const r = await fetch("/api/auth/postSignIn", { cache: "no-store" });
        const json = await r.json();
        if (!cancelled) router.replace(json?.redirectTo ?? "/");
      } catch {
        if (!cancelled) router.replace("/");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <AppShell>
      <div className="mx-auto my-8 w-full max-w-xl px-4 sm:px-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600">
            Finalizing
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Preparing your account
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Syncing profile, cart, and redirect destination.
          </p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-violet-600" />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
