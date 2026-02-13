// app/auth/postSignIn/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";

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
      <div className="qb-page mx-auto max-w-md">
        <Card className="p-5 text-center">
          <h1 className="text-lg font-semibold">Finalizing sign-in</h1>
          <p className="mt-1 text-sm text-gray-600">
            We are preparing your account and cart.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
