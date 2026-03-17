// app/auth/magic/page.tsx
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";

type Status = "working" | "invalid" | "error";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function MagicLanding() {
  return (
    <Suspense fallback={<MagicLandingFallback />}>
      <MagicLandingContent />
    </Suspense>
  );
}

function MagicLandingContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("working");

  const email = params.get("email");
  const token = params.get("token");

  const hasParams = useMemo(() => Boolean(email && token), [email, token]);

  useEffect(() => {
    if (!hasParams) {
      setStatus("invalid");
      return;
    }

    let cancelled = false;

    (async () => {
      const res = await signIn("magic", {
        email,
        token,
        redirect: false,
      });

      if (cancelled) return;

      if (res?.error) {
        setStatus("error");
        return;
      }

      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const r = await fetch("/api/auth/postSignIn", { cache: "no-store" });
          const json = await r.json();
          if (json?.redirectTo) {
            router.replace(json.redirectTo);
            return;
          }
        } catch {
          // Retry below.
        }
        await wait(250);
      }

      router.replace("/");
    })();

    return () => {
      cancelled = true;
    };
  }, [email, token, hasParams, router]);

  return (
    <AppShell>
      <div className="mx-auto my-8 w-full max-w-xl px-4 sm:px-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          {status === "working" ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-600">
                Authenticating
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                Signing you in
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Please wait while we verify your magic link.
              </p>
            </>
          ) : null}

          {status === "invalid" ? (
            <>
              <h1 className="text-2xl font-semibold text-slate-900">Invalid link</h1>
              <p className="mt-1 text-sm text-slate-600">
                This sign-in link is missing required details.
              </p>
              <Link
                href="/auth/request"
                className="mt-4 inline-flex rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Request a new magic link
              </Link>
            </>
          ) : null}

          {status === "error" ? (
            <>
              <h1 className="text-2xl font-semibold text-slate-900">Sign-in failed</h1>
              <p className="mt-1 text-sm text-slate-600">
                This magic link may be expired or already used.
              </p>
              <Link
                href="/signin?magicError=1"
                className="mt-4 inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Return to sign in
              </Link>
            </>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}

function MagicLandingFallback() {
  return (
    <AppShell>
      <div className="mx-auto my-8 w-full max-w-xl px-4 sm:px-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Signing you in</h1>
          <p className="mt-1 text-sm text-slate-600">
            Please wait while we verify your magic link.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
