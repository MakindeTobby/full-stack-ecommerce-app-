import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/page-header";

export default function OfflinePage() {
  return (
    <AppShell>
      <div className="qb-page">
        <PageHeader
          title="You're offline"
          subtitle="Browse cached pages or reconnect to continue shopping."
        />
        <div className="qb-card space-y-3">
          <p className="text-sm text-gray-600">
            It looks like your device is offline. We saved a few pages for quick
            access. Try again once you’re back online.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Home
            </Link>
            <Link
              href="/products"
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Shop
            </Link>
            <Link
              href="/search"
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Search
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
