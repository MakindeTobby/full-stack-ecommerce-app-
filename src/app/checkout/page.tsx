// app/checkout/page.tsx
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { cookies } from "next/headers";
import { getCartSummary } from "@/lib/db/queries/cart";
import { db } from "@/db/server";
import { addresses } from "@/db/schema";
import { eq } from "drizzle-orm";
import CheckoutClient from "./components/CheckoutClient";
import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/page-header";

export default async function CheckoutPage() {
  const session: Session | null = await getServerSession(authOptions as any);
  if (!session?.user?.id) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:px-6 sm:py-6">
          <section className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 md:p-6">
            <PageHeader title="Checkout" subtitle="Secure your order and complete payment." />
          </section>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            You must be signed in to place an order.{" "}
            <a className="font-semibold text-amber-900 underline" href="/signin">
                Sign in
            </a>{" "}
            or create an account.
          </div>
        </div>
      </AppShell>
    );
  }

  const userId = session.user.id as string;
  const cookieStore = await cookies();
  const qb = cookieStore.get("qb_session")?.value ?? null;

  // server: get cart snapshot + addresses
  const cart = await getCartSummary({ userId, sessionToken: qb });
  const userAddresses = await db
    .select()
    .from(addresses)
    .where(eq(addresses.user_id, userId));

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:px-6 sm:py-6">
        <section className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 md:p-6">
          <PageHeader title="Checkout" subtitle="Confirm shipping details and payment method." />
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <CheckoutClient
                initialCart={cart}
                initialAddresses={userAddresses}
                userId={userId}
              />
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:sticky md:top-24">
              <h3 className="text-base font-semibold text-slate-900">Order summary</h3>
              {cart ? (
                <>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <div>Items</div>
                      <div className="font-medium text-slate-900">{cart.itemCount}</div>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
                      <div>Total</div>
                      <div>NGN {Number(cart.subTotal ?? 0).toFixed(2)}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-3 text-sm text-slate-500">Cart is empty</div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
