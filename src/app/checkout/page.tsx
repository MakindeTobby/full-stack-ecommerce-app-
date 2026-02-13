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
    // require sign-in for checkout
    // you can render a nicer call-to-action here
    return (
      <AppShell>
        <div className="qb-page">
          <PageHeader title="Checkout" />
          <div className="qb-card bg-yellow-50">
            <p className="mb-3">
              You must be signed in to place an order.{" "}
              <a className="text-blue-600" href="/signin">
                Sign in
              </a>{" "}
              or create an account.
            </p>
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
      <div className="qb-page">
        <PageHeader title="Checkout" />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="qb-card">
              <CheckoutClient
                initialCart={cart}
                initialAddresses={userAddresses}
                userId={userId}
              />
            </div>
          </div>

          <aside className="space-y-4">
            <div className="qb-card">
              <h3 className="font-medium">Order summary</h3>
              {cart ? (
                <>
                  <div className="mt-3">
                    <div className="flex justify-between">
                      <div>Items</div>
                      <div>{cart.itemCount}</div>
                    </div>
                    <div className="mt-2 flex justify-between font-semibold">
                      <div>Total</div>
                      <div>${cart.subTotal}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-3 text-sm text-gray-500">Cart is empty</div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
