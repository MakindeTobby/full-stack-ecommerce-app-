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
      <div className="qb-page">
        <PageHeader title="Your Cart" subtitle="Review items before checkout." />
        <div className="qb-card">
          <CartClient initialCart={cart} />
        </div>
      </div>
    </AppShell>
  );
}
