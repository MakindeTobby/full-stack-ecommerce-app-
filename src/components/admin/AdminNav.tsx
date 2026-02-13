// components/admin/AdminNav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNav() {
  const path = usePathname();
  const isActive = (p: string) => path?.startsWith(p);
  const itemClass = (active: boolean) =>
    `block rounded-lg px-3 py-2 text-sm font-medium transition ${
      active
        ? "bg-slate-900 text-white"
        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <nav className="space-y-1 lg:sticky lg:top-24">
      <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Management
      </div>
      <Link className={itemClass(isActive("/admin") ?? false)} href="/admin">
        Dashboard
      </Link>
      <Link
        className={itemClass(isActive("/admin/products") ?? false)}
        href="/admin/products"
      >
        Products
      </Link>
      <Link
        className={itemClass(isActive("/admin/categories") ?? false)}
        href="/admin/categories"
      >
        Categories
      </Link>
      <Link
        className={itemClass(isActive("/admin/orders") ?? false)}
        href="/admin/orders"
      >
        Orders
      </Link>
      <Link
        className={itemClass(
          isActive("/admin/promotions/flash-sales") ?? false,
        )}
        href="/admin/promotions/flash-sales"
      >
        Promotions
      </Link>
      <Link
        className={itemClass(isActive("/admin/campaigns") ?? false)}
        href="/admin/campaigns"
      >
        Campaigns
      </Link>
      <Link
        className={itemClass(isActive("/admin/coupons") ?? false)}
        href="/admin/coupons"
      >
        Coupons
      </Link>
      <Link
        className={itemClass(isActive("/admin/reviews") ?? false)}
        href="/admin/reviews"
      >
        Reviews
      </Link>
      <Link
        className="mt-2 block rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
        href="/"
      >
        Back to Store
      </Link>
    </nav>
  );
}
