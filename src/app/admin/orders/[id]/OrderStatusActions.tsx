"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { OrderStatus } from "@/lib/orders/status";

type Props = {
  orderId: string;
  currentStatus: OrderStatus;
  allowedNext: OrderStatus[];
  shippingProvider: string | null;
  shippingTracking: string | null;
};

export default function OrderStatusActions({
  orderId,
  currentStatus,
  allowedNext,
  shippingProvider,
  shippingTracking,
}: Props) {
  const router = useRouter();
  const [targetStatus, setTargetStatus] = useState<OrderStatus | "">(
    allowedNext[0] ?? "",
  );
  const [provider, setProvider] = useState(shippingProvider ?? "");
  const [tracking, setTracking] = useState(shippingTracking ?? "");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const noActionsLeft = allowedNext.length === 0;
  const requiresShipping = targetStatus === "shipped";
  const canSubmit = useMemo(() => {
    if (!targetStatus) return false;
    if (!requiresShipping) return true;
    return provider.trim().length > 0 && tracking.trim().length > 0;
  }, [provider, tracking, requiresShipping, targetStatus]);

  async function submit() {
    if (!targetStatus) return;
    if (!canSubmit) {
      toast.error("Shipping provider and tracking are required");
      return;
    }

    setLoading(true);
    toast.loading("Updating order status...", { id: "order-status-update" });
    try {
      const res = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderId)}/status`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            status: targetStatus,
            shipping_provider: provider.trim() || null,
            shipping_tracking: tracking.trim() || null,
            note: note.trim() || null,
          }),
        },
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error ?? "Failed to update order status");
      }

      toast.success("Order status updated", { id: "order-status-update" });
      router.refresh();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update order status",
        { id: "order-status-update" },
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-slate-200 p-3">
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Fulfillment Action
        </div>
        <div className="mt-1 text-sm text-slate-700">
          Current status: <span className="font-medium">{currentStatus}</span>
        </div>
      </div>

      {noActionsLeft ? (
        <p className="text-sm text-slate-500">
          No further transitions are available for this order.
        </p>
      ) : (
        <>
          <div className="space-y-1">
            <label
              htmlFor="next-status"
              className="text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              Next status
            </label>
            <select
              id="next-status"
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as OrderStatus)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select status</option>
              {allowedNext.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <input
              type="text"
              placeholder="Shipping provider (required for shipped)"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Tracking number (required for shipped)"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Optional internal note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={loading || !canSubmit}
            className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update order status"}
          </button>
        </>
      )}
    </div>
  );
}
