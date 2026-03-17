"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Suspense, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";

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
      <div className="mx-auto my-8 grid w-full max-w-xl gap-6 px-4 sm:px-6  lg:gap-8">


        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 mt-10">
          <h2 className="text-xl font-semibold text-slate-900">Sign In</h2>
          <p className="mt-1 text-sm text-slate-600">
            Choose your preferred sign-in method.
          </p>

          {showError ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {showError}
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            <button
              onClick={() =>
                signIn("google", {
                  callbackUrl,
                })
              }
              disabled={finalizing}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Continue with Google
            </button>

            <Link
              href="/auth/request"
              className="flex h-11 w-full items-center justify-center rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Continue with Email Magic Link
            </Link>
          </div>

          <div className="mt-4 text-xs text-slate-500">
            By signing in, you agree to our Terms and Privacy Policy.
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <Link
              href="/products"
              className="text-sm font-medium text-slate-700 underline-offset-2 hover:text-violet-700 hover:underline"
            >
              Continue as guest
            </Link>
          </div>

          {finalizing ? (
            <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-700">
              Finalizing your session...
            </div>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}

function SignInFallback() {
  return (
    <AppShell>
      <div className="mx-auto my-8 w-full max-w-3xl px-4 sm:px-6">
        <div className="h-56 animate-pulse rounded-3xl bg-slate-200" />
      </div>
    </AppShell>
  );
}
