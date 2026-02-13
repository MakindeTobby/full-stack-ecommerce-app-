"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Suspense, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

function isSafeCallbackUrl(value: string | null): value is string {
  if (!value) return false;
  return value.startsWith("/") && !value.startsWith("//");
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const [finalizing, setFinalizing] = useState(false);

  const error = params.get("error");
  const magicErr = params.get("magicError");

  const callbackFromParams = useMemo(() => {
    const candidate = params.get("callbackUrl");
    return isSafeCallbackUrl(candidate) ? candidate : null;
  }, [params]);

  const callbackUrl = callbackFromParams ?? "/auth/postSignIn";

  useEffect(() => {
    if (status !== "authenticated" || !session?.user || finalizing) return;

    let cancelled = false;
    setFinalizing(true);

    (async () => {
      try {
        const res = await fetch("/api/auth/postSignIn", { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;

        if (callbackFromParams) {
          router.replace(callbackFromParams);
          return;
        }

        router.replace(json?.redirectTo ?? "/");
      } catch {
        if (!cancelled) router.replace("/");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, session, finalizing, callbackFromParams, router]);

  const getErrorMessage = () => {
    if (magicErr) return "Magic link expired or invalid.";
    if (error === "OAuthSignin") return "Failed to sign in with Google.";
    if (error === "OAuthAccountNotLinked") {
      return "This email is already linked to another sign-in method.";
    }
    if (error === "AccessDenied") return "Access denied. Please try again.";
    if (error) return "Sign-in failed. Please try again.";
    return null;
  };

  const showError = getErrorMessage();

  return (
    <AppShell>
      <div className="qb-page mx-auto max-w-md">
        <PageHeader
          title="Sign In"
          subtitle="Access your orders, saved details, and checkout history."
        />

        <Card className="space-y-5 p-5">
          {showError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {showError}
            </div>
          )}

          <Button
            onClick={() =>
              signIn("google", {
                callbackUrl,
              })
            }
            variant="secondary"
            className="w-full"
            disabled={finalizing}
          >
            Continue with Google
          </Button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-black/10" />
            <span className="text-xs uppercase tracking-wide text-gray-400">
              or
            </span>
            <div className="h-px flex-1 bg-black/10" />
          </div>

          <Link
            href="/auth/request"
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-black/85"
          >
            Continue with Email Magic Link
          </Link>

          <p className="text-center text-xs text-gray-500">
            By signing in, you agree to our Terms and Privacy Policy.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}

function SignInFallback() {
  return (
    <AppShell>
      <div className="qb-page mx-auto max-w-md">
        <PageHeader
          title="Sign In"
          subtitle="Access your orders, saved details, and checkout history."
        />
        <Card className="space-y-5 p-5">
          <div className="h-10 animate-pulse rounded-md bg-slate-200" />
          <div className="h-10 animate-pulse rounded-md bg-slate-200" />
        </Card>
      </div>
    </AppShell>
  );
}
