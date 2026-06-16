// Shared order status labels/helpers used by both the admin panel and the
// customer account page. One source of truth for the Turkish status names.

import type { OrderStatus, FulfillmentStatus, OrderLineItem } from "./api";

export const PAYMENT_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refunded",
];
export const FULFILLMENT_STATUSES: FulfillmentStatus[] = [
  "processing",
  "packed",
  "shipped",
  "delivered",
  "returned",
];

export const paymentLabel: Record<OrderStatus, string> = {
  pending: "Ödeme Bekliyor",
  paid: "Ödendi",
  failed: "Başarısız",
  cancelled: "İptal",
  refunded: "İade",
};

export const fulfillmentLabel: Record<FulfillmentStatus, string> = {
  processing: "Hazırlanıyor",
  packed: "Paketlendi",
  shipped: "Kargoda",
  delivered: "Teslim edildi",
  returned: "İade edildi",
};

// Tailwind dot colour per fulfillment stage.
export const fulfillmentDot: Record<FulfillmentStatus, string> = {
  processing: "bg-yellow-500",
  packed: "bg-amber-500",
  shipped: "bg-blue-500",
  delivered: "bg-green-500",
  returned: "bg-foreground/40",
};

export const liraFromCents = (cents: number) => cents / 100;

export const itemsSummary = (items: OrderLineItem[] = []) => {
  if (!items.length) return "—";
  const first = `${items[0].quantity}× ${items[0].name}`;
  return items.length > 1 ? `${first} +${items.length - 1}` : first;
};
