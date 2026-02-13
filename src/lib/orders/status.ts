export const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function normalizeOrderStatus(
  value: string | null | undefined,
): OrderStatus {
  const s = String(value ?? "")
    .trim()
    .toLowerCase();
  return ORDER_STATUSES.includes(s as OrderStatus)
    ? (s as OrderStatus)
    : "pending";
}

export function getAllowedNextStatuses(current: OrderStatus): OrderStatus[] {
  return TRANSITIONS[current] ?? [];
}

export function canTransitionOrderStatus(
  current: OrderStatus,
  next: OrderStatus,
): boolean {
  if (current === next) return true;
  return getAllowedNextStatuses(current).includes(next);
}
