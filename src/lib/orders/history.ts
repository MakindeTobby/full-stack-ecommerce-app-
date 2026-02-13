import { order_status_history } from "@/db/schema";

type HistoryInsertTx = {
  insert: (table: typeof order_status_history) => {
    values: (value: {
      order_id: string;
      from_status?: string | null;
      to_status: string;
      actor?: string | null;
      changed_by_user_id?: string | null;
      note?: string | null;
    }) => Promise<unknown>;
  };
};

export async function insertOrderStatusHistory(
  tx: HistoryInsertTx,
  input: {
    orderId: string;
    fromStatus?: string | null;
    toStatus: string;
    actor?: "system" | "admin" | "payment" | "customer";
    changedByUserId?: string | null;
    note?: string | null;
  },
) {
  await tx.insert(order_status_history).values({
    order_id: input.orderId,
    from_status: input.fromStatus ?? null,
    to_status: input.toStatus,
    actor: input.actor ?? "system",
    changed_by_user_id: input.changedByUserId ?? null,
    note: input.note ?? null,
  });
}
