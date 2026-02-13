// app/auth/magic/page.tsx
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";

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
      <div className="qb-page mx-auto max-w-md">
        <Card className="space-y-3 p-5 text-center">
          {status === "working" && (
            <>
              <h1 className="text-lg font-semibold">Signing you in</h1>
              <p className="text-sm text-gray-600">
                Please wait while we verify your magic link.
              </p>
            </>
          )}

          {status === "invalid" && (
            <>
              <h1 className="text-lg font-semibold">Invalid link</h1>
              <p className="text-sm text-gray-600">
                This sign-in link is missing required details.
              </p>
              <Link
                href="/auth/request"
                className="text-sm font-medium underline"
              >
                Request a new magic link
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <h1 className="text-lg font-semibold">Sign-in failed</h1>
              <p className="text-sm text-gray-600">
                This magic link may be expired or already used.
              </p>
              <Link
                href="/signin?magicError=1"
                className="text-sm font-medium underline"
              >
                Return to sign in
              </Link>
            </>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function MagicLandingFallback() {
  return (
    <AppShell>
      <div className="qb-page mx-auto max-w-md">
        <Card className="space-y-3 p-5 text-center">
          <h1 className="text-lg font-semibold">Signing you in</h1>
          <p className="text-sm text-gray-600">
            Please wait while we verify your magic link.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
