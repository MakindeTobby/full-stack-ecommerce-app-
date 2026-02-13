import Link from "next/link";
import AppShell from "@/components/layout/AppShell";

export default function Home() {
  return (
    <AppShell>
      <div className="qb-page">
        <section className="qb-card p-8 md:p-12">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
            Storefront
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
            Build your premium gift and accessory catalogue.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-gray-600 md:text-base">
            Your backend flows are already in place. This pass aligns layout,
            spacing, and page structure so further beautification is faster and
            predictable.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Browse Products
            </Link>
            <Link
              href="/cart"
              className="rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-medium"
            >
              Open Cart
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="qb-card">
            <div className="text-sm font-medium">Products</div>
            <p className="mt-2 text-sm text-gray-600">
              Listing and detail pages now share a consistent shell.
            </p>
          </div>
          <div className="qb-card">
            <div className="text-sm font-medium">Cart & Checkout</div>
            <p className="mt-2 text-sm text-gray-600">
              Core shopping flow uses unified spacing and card patterns.
            </p>
          </div>
          <div className="qb-card">
            <div className="text-sm font-medium">Orders</div>
            <p className="mt-2 text-sm text-gray-600">
              Order history and detail views now align visually with store UI.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
