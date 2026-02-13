import { sendMailDevOrProd } from "@/lib/mail";
import {
  buildBrandEmailHtml,
  buildBrandEmailText,
} from "@/lib/notifications/templates";

type OrderMailInput = {
  to: string;
  orderId: string;
  totalAmount: string | number;
  currency: string | null | undefined;
  baseUrl?: string | null;
};

export async function sendOrderCreatedEmail(input: OrderMailInput) {
  const orderUrl = buildOrderUrl(input.baseUrl, input.orderId);
  const total = `${input.currency ?? "NGN"} ${Number(input.totalAmount ?? 0).toFixed(2)}`;
  const model = {
    title: "Order received",
    intro: "We have received your order and will start processing shortly.",
    sections: [
      { label: "Order ID", value: input.orderId },
      { label: "Total", value: total },
      { label: "Status", value: "pending" },
    ],
    cta: { label: "View order details", href: orderUrl },
    outro: "Thank you for shopping with Queen Beulah.",
  };

  return sendMailDevOrProd({
    to: input.to,
    subject: `Order received (#${input.orderId})`,
    text: buildBrandEmailText(model),
    html: buildBrandEmailHtml(model),
  });
}

export async function sendPaymentConfirmedEmail(input: OrderMailInput) {
  const orderUrl = buildOrderUrl(input.baseUrl, input.orderId);
  const total = `${input.currency ?? "NGN"} ${Number(input.totalAmount ?? 0).toFixed(2)}`;
  const model = {
    title: "Payment confirmed",
    intro: "Your payment was successful. We are now preparing your order.",
    sections: [
      { label: "Order ID", value: input.orderId },
      { label: "Amount paid", value: total },
      { label: "Status", value: "processing" },
    ],
    cta: { label: "Track order", href: orderUrl },
    outro: "You will get another update when your order ships.",
  };

  return sendMailDevOrProd({
    to: input.to,
    subject: `Payment confirmed (#${input.orderId})`,
    text: buildBrandEmailText(model),
    html: buildBrandEmailHtml(model),
  });
}

export async function sendOrderStatusChangedEmail(
  input: OrderMailInput & {
    fromStatus: string | null | undefined;
    toStatus: string | null | undefined;
    shippingProvider?: string | null;
    shippingTracking?: string | null;
    note?: string | null;
  },
) {
  const orderUrl = buildOrderUrl(input.baseUrl, input.orderId);
  const total = `${input.currency ?? "NGN"} ${Number(input.totalAmount ?? 0).toFixed(2)}`;
  const fromStatus = String(input.fromStatus ?? "pending");
  const toStatus = String(input.toStatus ?? "pending");

  const sections = [
    { label: "Order ID", value: input.orderId },
    { label: "Previous status", value: fromStatus },
    { label: "Current status", value: toStatus },
    { label: "Total", value: total },
  ];
  if (input.shippingProvider && input.shippingTracking) {
    sections.push({
      label: "Tracking",
      value: `${input.shippingProvider} | ${input.shippingTracking}`,
    });
  }
  if (input.note) {
    sections.push({ label: "Note", value: input.note });
  }

  const model = {
    title: "Order status updated",
    intro: "There is a new update on your order.",
    sections,
    cta: { label: "View order details", href: orderUrl },
    outro: "Thanks for shopping with Queen Beulah.",
  };

  return sendMailDevOrProd({
    to: input.to,
    subject: `Order update (#${input.orderId})`,
    text: buildBrandEmailText(model),
    html: buildBrandEmailHtml(model),
  });
}

function buildOrderUrl(baseUrl: string | null | undefined, orderId: string) {
  const base = String(
    baseUrl ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  ).replace(/\/$/, "");
  return `${base}/order/${encodeURIComponent(orderId)}`;
}
