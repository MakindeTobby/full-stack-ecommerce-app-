"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function SimulatePaymentButton({
  orderId,
  paymentStatus,
}: {
  orderId: string;
  paymentStatus: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (paymentStatus === "paid") {
    return (
      <button
        type="button"
        disabled
        className="rounded bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800"
      >
        Payment completed
      </button>
    );
  }

  async function handlePaystackPay() {
    setLoading(true);
    toast.loading("Initializing Paystack...", { id: "paystack-init" });
    try {
      const res = await fetch("/api/payments/paystack/initialize", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? "Failed to initialize payment");
      }

      if (json?.alreadyPaid) {
        toast.success("Payment already completed", { id: "paystack-init" });
        router.refresh();
        return;
      }

      const authorizationUrl = json?.authorizationUrl as string | undefined;
      if (!authorizationUrl) {
        throw new Error("Missing Paystack authorization URL");
      }

      window.location.assign(authorizationUrl);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Payment failed", {
        id: "paystack-init",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handlePaystackPay}
      disabled={loading}
      className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      {loading ? "Processing..." : "Pay now with Paystack"}
    </button>
  );
}
