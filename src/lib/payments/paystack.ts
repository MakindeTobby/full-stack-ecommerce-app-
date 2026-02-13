import { createHmac, timingSafeEqual } from "node:crypto";

const PAYSTACK_API_BASE = "https://api.paystack.co";

type PaystackInitializeArgs = {
  email: string;
  amountKobo: number;
  currency: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
};

type PaystackInitializeData = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

type PaystackVerifyData = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  metadata?: Record<string, unknown>;
};

type PaystackEnvelope<T> = {
  status: boolean;
  message: string;
  data: T;
};

export async function initializePaystackTransaction(
  args: PaystackInitializeArgs,
): Promise<PaystackInitializeData> {
  const payload = {
    email: args.email,
    amount: args.amountKobo,
    currency: args.currency,
    callback_url: args.callbackUrl,
    metadata: args.metadata,
  };

  const json = await paystackRequest<PaystackInitializeData>(
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  return json.data;
}

export async function verifyPaystackTransaction(
  reference: string,
): Promise<PaystackVerifyData> {
  const json = await paystackRequest<PaystackVerifyData>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
    { method: "GET" },
  );
  return json.data;
}

export function getPaystackPublicKey(): string {
  return process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "";
}

export function getAppBaseUrl(req: Request): string {
  const fromEnv = process.env.NEXTAUTH_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export function verifyPaystackWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!signature) return false;
  const secret =
    process.env.PAYSTACK_WEBHOOK_SECRET ?? process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return false;

  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signature, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function paystackRequest<T>(
  path: string,
  init: RequestInit,
): Promise<PaystackEnvelope<T>> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    throw new Error("Missing PAYSTACK_SECRET_KEY");
  }

  const res = await fetch(`${PAYSTACK_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const json = (await res
    .json()
    .catch(() => null)) as PaystackEnvelope<T> | null;

  if (!res.ok || !json?.status) {
    const message = json?.message ?? "Paystack request failed";
    throw new Error(message);
  }

  return json;
}
