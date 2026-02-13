import { desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { order_status_history, orders } from "@/db/schema";
import { db } from "@/db/server";

type Snapshot = {
  status: string | null;
  payment_status: string | null;
  updated_at: string | null;
  latest_history_at: string | null;
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const orderId = String(id ?? "").trim();
  if (!orderId) {
    return new Response(
      JSON.stringify({ ok: false, error: "Missing order id" }),
      {
        status: 400,
        headers: { "content-type": "application/json" },
      },
    );
  }

  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id ?? null;
  const sessionRole = session?.user?.role ?? "customer";
  if (!sessionUserId) {
    return new Response(
      JSON.stringify({ ok: false, error: "Not authenticated" }),
      {
        status: 401,
        headers: { "content-type": "application/json" },
      },
    );
  }

  const orderRow = await db
    .select({ id: orders.id, user_id: orders.user_id })
    .from(orders)
    .where(eq(orders.id, orderId))
    .then((rows) => rows[0] ?? null);
  if (!orderRow) {
    return new Response(
      JSON.stringify({ ok: false, error: "Order not found" }),
      {
        status: 404,
        headers: { "content-type": "application/json" },
      },
    );
  }

  const isOwner = String(orderRow.user_id ?? "") === String(sessionUserId);
  const isAdmin = sessionRole === "admin";
  if (!isOwner && !isAdmin) {
    return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const push = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      let lastFingerprint = "";

      const tick = async () => {
        try {
          const snapshot = await readSnapshot(orderId);
          const fingerprint = JSON.stringify(snapshot);
          if (fingerprint !== lastFingerprint) {
            lastFingerprint = fingerprint;
            push("snapshot", snapshot);
          } else {
            push("heartbeat", { t: Date.now() });
          }
        } catch {
          push("error", { error: "snapshot_failed" });
        }
      };

      void tick();
      timer = setInterval(() => {
        void tick();
      }, 5000);

      req.signal.addEventListener("abort", () => {
        if (timer) clearInterval(timer);
        controller.close();
      });
    },
    cancel() {
      if (timer) clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}

async function readSnapshot(orderId: string): Promise<Snapshot> {
  const orderRow = await db
    .select({
      status: orders.status,
      payment_status: orders.payment_status,
      updated_at: orders.updated_at,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .then((rows) => rows[0] ?? null);

  const historyRow = await db
    .select({ created_at: order_status_history.created_at })
    .from(order_status_history)
    .where(eq(order_status_history.order_id, orderId))
    .orderBy(desc(order_status_history.created_at))
    .then((rows) => rows[0] ?? null);

  return {
    status: orderRow?.status ?? null,
    payment_status: orderRow?.payment_status ?? null,
    updated_at: orderRow?.updated_at ? String(orderRow.updated_at) : null,
    latest_history_at: historyRow?.created_at
      ? String(historyRow.created_at)
      : null,
  };
}
