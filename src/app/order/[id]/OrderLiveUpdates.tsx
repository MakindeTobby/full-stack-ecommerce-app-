"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

type Snapshot = {
  status: string | null;
  payment_status: string | null;
  updated_at: string | null;
  latest_history_at: string | null;
};

export default function OrderLiveUpdates({ orderId }: { orderId: string }) {
  const router = useRouter();
  const last = useRef<string>("");
  const initialized = useRef(false);

  useEffect(() => {
    const url = `/api/orders/${encodeURIComponent(orderId)}/stream`;
    const es = new EventSource(url, { withCredentials: true });

    const onSnapshot = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as Snapshot;
        const fp = JSON.stringify(data);
        if (!initialized.current) {
          initialized.current = true;
          last.current = fp;
          return;
        }
        if (fp !== last.current) {
          last.current = fp;
          toast.success("Order updated");
          router.refresh();
        }
      } catch {
        // ignore malformed payload
      }
    };

    es.addEventListener("snapshot", onSnapshot as EventListener);
    es.onerror = () => {
      // EventSource auto-reconnect handles transient failures.
    };

    return () => {
      es.removeEventListener("snapshot", onSnapshot as EventListener);
      es.close();
    };
  }, [orderId, router]);

  return null;
}
