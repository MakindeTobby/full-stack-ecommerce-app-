import Link from "next/link";
import AuthHeader from "@/components/AuthHeader";
import MiniCart from "@/components/MiniCart";
import SearchBox from "@/components/search/SearchBox";
import BottomNav from "@/components/layout/BottomNav";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

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

          <div className="hidden lg:flex flex-1 justify-center px-6">
            <SearchBox
              variant="header"
              placeholder="Search products..."
              className="max-w-lg"
            />
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/search"
              className="inline-flex h-9 items-center rounded-full border border-black/10 bg-white px-3 text-xs font-medium text-gray-700 transition hover:bg-gray-50 lg:hidden"
            >
              Search
            </Link>
            <MiniCart />
            <AuthHeader />
          </div>
        </div>
      </header>

      <main className="qb-main">
        <div className="qb-container">{children}</div>
      </main>

      <PwaInstallPrompt />
      <BottomNav />
    </div>
  );
}
