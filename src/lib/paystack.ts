const PAYSTACK_BASE = "https://api.paystack.co";
const SECRET = process.env.PAYSTACK_SECRET_KEY;

export type PaystackChannel =
  | "card"
  | "bank"
  | "mobile_money"
  | "ussd"
  | "qr"
  | "bank_transfer";

type PaystackResponse<T> = {
  status: boolean;
  message: string;
  data: T;
};

async function paystackFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<PaystackResponse<T>> {
  if (!SECRET) throw new Error("PAYSTACK_SECRET_KEY is not set");

  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${SECRET}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const json = (await res.json()) as PaystackResponse<T>;
  if (!res.ok || !json.status) {
    throw new Error(json.message || `Paystack request failed (${res.status})`);
  }
  return json;
}

export type InitializeTxInput = {
  email: string;
  amount: number; // in smallest currency unit (kobo/pesewas)
  reference: string;
  currency?: string;
  channels?: PaystackChannel[];
  callback_url?: string;
  metadata?: Record<string, unknown>;
};

export type InitializeTxResult = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export async function initializeTransaction(input: InitializeTxInput) {
  return paystackFetch<InitializeTxResult>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type VerifyTxResult = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  customer: { email: string };
  channel: string;
  paid_at: string | null;
  metadata: Record<string, unknown> | null;
};

export async function verifyTransaction(reference: string) {
  return paystackFetch<VerifyTxResult>(
    `/transaction/verify/${encodeURIComponent(reference)}`
  );
}

export type TransferRecipientInput = {
  type: "mobile_money" | "ghipss" | "nuban";
  name: string;
  account_number: string;
  bank_code: string;
  currency?: string;
};

export async function createTransferRecipient(input: TransferRecipientInput) {
  return paystackFetch<{ recipient_code: string }>("/transferrecipient", {
    method: "POST",
    body: JSON.stringify({ currency: "GHS", ...input }),
  });
}

export async function initiateTransfer(input: {
  source?: string;
  amount: number;
  recipient: string;
  reason?: string;
  reference: string;
}) {
  return paystackFetch<{ transfer_code: string; status: string }>("/transfer", {
    method: "POST",
    body: JSON.stringify({ source: "balance", ...input }),
  });
}

export function toMinorUnit(amount: number): number {
  return Math.round(amount * 100);
}

export function fromMinorUnit(amount: number): number {
  return amount / 100;
}

export const MOBILE_MONEY_BANK_CODES: Record<string, string> = {
  mtn_momo: "MTN",
  telecel_cash: "VOD",
};
