import Link from "next/link";
import {
  getAdminAnalyticsSnapshot,
  getAdminRevenueSeries,
  parseAnalyticsRange,
} from "@/lib/db/queries/analytics";

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = (await searchParams) ?? {};
  const rangeRaw = Array.isArray(sp.range) ? sp.range[0] : sp.range;
  const range = parseAnalyticsRange(rangeRaw);
  const [analytics, series] = await Promise.all([
    getAdminAnalyticsSnapshot(range),
    getAdminRevenueSeries(range),
  ]);
  const currency = "NGN";
  const rangeOptions: Array<{ key: string; label: string }> = [
    { key: "7d", label: "7D" },
    { key: "30d", label: "30D" },
    { key: "90d", label: "90D" },
    { key: "mtd", label: "MTD" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="space-y-6">
      <section className="admin-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="admin-title">Analytics Overview</h2>
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1">
            {rangeOptions.map((opt) => (
              <Link
                key={opt.key}
                href={`/admin?range=${opt.key}`}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                  analytics.window.key === opt.key
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>
        <p className="admin-subtitle">
          Core commerce performance for revenue, orders, funnel, and products (
          {analytics.window.label}).
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a
            href={`/api/admin/analytics/export?kind=orders&range=${analytics.window.key}`}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Export orders CSV
          </a>
          <a
            href={`/api/admin/analytics/export?kind=revenue&range=${analytics.window.key}`}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Export revenue CSV
          </a>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="Products"
          value={String(analytics.counts.products)}
        />
        <MetricCard label="Orders" value={String(analytics.counts.orders)} />
        <MetricCard label="Users" value={String(analytics.counts.users)} />
        <MetricCard
          label="Categories"
          value={String(analytics.counts.categories)}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Paid Revenue (Today)"
          value={formatMoney(analytics.revenue.todayPaid, currency)}
        />
        <MetricCard
          label="Paid Revenue (7d)"
          value={formatMoney(analytics.revenue.last7dPaid, currency)}
        />
        <MetricCard
          label="Paid Revenue (30d)"
          value={formatMoney(analytics.revenue.last30dPaid, currency)}
        />
        <MetricCard
          label="Paid Revenue (MTD)"
          value={formatMoney(analytics.revenue.mtdPaid, currency)}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label={`Paid Revenue (${analytics.window.label})`}
          value={formatMoney(analytics.revenue.periodPaid, currency)}
        />
        <MetricCard
          label="Paid Orders (7d)"
          value={String(analytics.ordersKpi.paid7d)}
        />
        <MetricCard
          label="Paid Orders (30d)"
          value={String(analytics.ordersKpi.paid30d)}
        />
        <MetricCard
          label="AOV (30d)"
          value={formatMoney(analytics.ordersKpi.aov30d, currency)}
        />
        <MetricCard
          label={`Paid Orders (${analytics.window.label})`}
          value={String(analytics.ordersKpi.paidPeriod)}
        />
        <MetricCard
          label={`AOV (${analytics.window.label})`}
          value={formatMoney(analytics.ordersKpi.aovPeriod, currency)}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="admin-panel">
          <h3 className="text-lg font-semibold">
            Funnel ({analytics.window.label})
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <MiniStat
              label="Carts Created"
              value={String(analytics.funnel.cartsCreated)}
            />
            <MiniStat
              label="Orders Created"
              value={String(analytics.funnel.ordersCreated)}
            />
            <MiniStat
              label="Paid Orders"
              value={String(analytics.funnel.paidOrders)}
            />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <MiniStat
              label="Cart -> Order"
              value={`${analytics.funnel.cartToOrderRate.toFixed(1)}%`}
            />
            <MiniStat
              label="Order -> Paid"
              value={`${analytics.funnel.orderToPaidRate.toFixed(1)}%`}
            />
          </div>
        </div>

        <div className="admin-panel">
          <h3 className="text-lg font-semibold">Order Distribution</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <DistList title="Status" rows={analytics.distributions.status} />
            <DistList title="Payment" rows={analytics.distributions.payment} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <TrendChartCard
          title={`Revenue Trend (${analytics.window.label})`}
          currency={currency}
          points={series.points}
        />
        <div className="admin-panel">
          <h3 className="text-lg font-semibold">Distribution Snapshot</h3>
          <div className="mt-4 grid gap-4">
            <StackedBarList
              title="Order Status"
              rows={analytics.distributions.status}
            />
            <StackedBarList
              title="Payment Status"
              rows={analytics.distributions.payment}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <TopProductsTable
          title={`Top Products by Revenue (${analytics.window.label})`}
          currency={currency}
          rows={analytics.topProducts.byRevenue}
        />
        <TopProductsTable
          title={`Top Products by Units (${analytics.window.label})`}
          currency={currency}
          rows={analytics.topProducts.byUnits}
        />
      </section>

      <section className="admin-panel">
        <h3 className="text-lg font-semibold">Quick actions</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Create product
          </Link>
          <Link
            href="/admin/products"
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Manage products
          </Link>
          <Link
            href="/admin/orders"
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Review orders
          </Link>
          <Link
            href="/admin/coupons/new"
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Create coupon
          </Link>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-panel">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function DistList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ key: string; count: number }>;
}) {
  return (
    <div className="rounded border border-slate-200 p-3">
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <div className="mt-2 space-y-1 text-sm">
        {rows.map((r) => (
          <div
            key={`${title}-${r.key}`}
            className="flex items-center justify-between"
          >
            <span className="capitalize text-slate-600">{r.key}</span>
            <span className="font-medium text-slate-900">{r.count}</span>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="text-slate-500">No data yet.</div>
        )}
      </div>
    </div>
  );
}

function TopProductsTable({
  title,
  currency,
  rows,
}: {
  title: string;
  currency: string;
  rows: Array<{
    productId: string;
    name: string;
    units: number;
    revenue: number;
  }>;
}) {
  return (
    <div className="admin-panel overflow-hidden p-0">
      <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900">
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 text-left">Product</th>
              <th className="px-4 py-2 text-right">Units</th>
              <th className="px-4 py-2 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.productId} className="border-t border-slate-100">
                <td className="px-4 py-2 text-slate-800">{r.name}</td>
                <td className="px-4 py-2 text-right text-slate-700">
                  {r.units}
                </td>
                <td className="px-4 py-2 text-right font-medium text-slate-900">
                  {formatMoney(r.revenue, currency)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  className="px-4 py-6 text-center text-slate-500"
                  colSpan={3}
                >
                  No product sales data in this window.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatMoney(value: number, currency: string) {
  return `${currency} ${Number(value ?? 0).toFixed(2)}`;
}

function TrendChartCard({
  title,
  currency,
  points,
}: {
  title: string;
  currency: string;
  points: Array<{
    bucket: string;
    ordersCount: number;
    paidOrders: number;
    paidRevenue: number;
  }>;
}) {
  const maxValue = points.reduce((m, p) => Math.max(m, p.paidRevenue), 0);
  const latest = points.length > 0 ? points[points.length - 1] : null;
  const totalRevenue = points.reduce((sum, p) => sum + p.paidRevenue, 0);
  return (
    <div className="admin-panel">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="text-right text-xs text-slate-500">
          <div>Total: {formatMoney(totalRevenue, currency)}</div>
          <div>
            Latest: {latest ? formatMoney(latest.paidRevenue, currency) : "N/A"}
          </div>
        </div>
      </div>
      <div className="mt-4">
        {points.length === 0 ? (
          <div className="rounded border border-slate-200 p-6 text-sm text-slate-500">
            No trend data in this window.
          </div>
        ) : (
          <div className="flex h-44 items-end gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-2">
            {points.map((p) => {
              const percent =
                maxValue > 0
                  ? Math.max(4, (p.paidRevenue / maxValue) * 100)
                  : 4;
              return (
                <div key={p.bucket} className="group relative h-full flex-1">
                  <div
                    className="w-full rounded-t bg-slate-800/85 transition hover:bg-slate-900"
                    style={{ height: `${percent}%` }}
                    title={`${p.bucket} - ${formatMoney(p.paidRevenue, currency)}`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
      {points.length > 0 && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>{points[0]?.bucket}</span>
          <span>{points[points.length - 1]?.bucket}</span>
        </div>
      )}
    </div>
  );
}

function StackedBarList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ key: string; count: number }>;
}) {
  const total = rows.reduce((sum, r) => sum + Number(r.count ?? 0), 0);
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <div className="mt-2 space-y-2">
        {rows.length === 0 && (
          <div className="text-sm text-slate-500">No data.</div>
        )}
        {rows.map((r) => {
          const pct = total > 0 ? (r.count / total) * 100 : 0;
          return (
            <div key={`${title}-${r.key}`} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="capitalize">{r.key}</span>
                <span>
                  {r.count} ({pct.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded bg-slate-100">
                <div
                  className="h-full rounded bg-slate-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
