// app/cart/page.tsx
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { cookies } from "next/headers";
import { getCartSummary } from "@/lib/db/queries/cart";
import CartClient from "./components/CartClient";
import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/page-header";

export default async function CartPage() {
  const session: Session | null = await getServerSession(authOptions as any);
  const userId = session?.user?.id ?? null;
  const cookieStore = await cookies();
  const qb = cookieStore.get("qb_session")?.value ?? null;

  const cart = await getCartSummary({ userId, sessionToken: qb });

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:px-6 sm:py-6">
        <section className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 md:p-6">
          <PageHeader
            title="Your Cart"
            subtitle="Review items, apply coupon, and continue to checkout."
          />
        </section>
        <div>
          <CartClient initialCart={cart} />
        </div>
      </div>
    </AppShell>
  );
}
