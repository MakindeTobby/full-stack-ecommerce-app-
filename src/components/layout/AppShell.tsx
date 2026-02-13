import Link from "next/link";
import AuthHeader from "@/components/AuthHeader";
import MiniCart from "@/components/MiniCart";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="qb-shell">
      <header className="qb-header">
        <div className="qb-container flex items-center justify-between gap-4 py-3">
          <Link href="/" className="text-base font-semibold tracking-tight">
            Queen Beulah
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-sm text-gray-700">
            <Link href="/" className="hover:text-black">
              Home
            </Link>
            <Link href="/products" className="hover:text-black">
              Shop
            </Link>
            <Link href="/cart" className="hover:text-black">
              Cart
            </Link>
            <Link href="/orders" className="hover:text-black">
              Orders
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <MiniCart />
            <AuthHeader />
          </div>
        </div>
      </header>

      <main className="qb-main">
        <div className="qb-container">{children}</div>
      </main>
    </div>
  );
}
