export interface BillingConfig {
  enabled: boolean;
  mode: "live" | "test" | "unconfigured";
  currencies: string[];
  connect_enabled: boolean;
}

export interface CheckoutSession {
  checkout_url: string | null;
  session_id: string | null;
  status: string;
  amount_minor: number;
  currency: string;
}

export interface FundingStatus {
  billing_mode: "stripe" | "legacy_manual";
  status: string;
  amount_minor: number;
  currency: string;
  refunded_minor: number;
  receipt_url: string | null;
  checkout_url: string | null;
  can_checkout: boolean;
  can_cancel: boolean;
  payouts: { id: string; provider: string; status: string; amount_minor: number; currency: string; recipient_name: string; error: string | null }[];
  error: string | null;
}

export interface ConnectStatus {
  account_id: string | null;
  country: string | null;
  details_submitted: boolean;
  transfers_enabled: boolean;
  payouts_enabled: boolean;
  requirements: string[];
  enabled: boolean;
  mode: "live" | "test" | "unconfigured";
}

/** Restrict hosted payment, account and receipt links to Stripe HTTPS origins. */
export function stripeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return null;
    if (url.hostname !== "stripe.com" && !url.hostname.endsWith(".stripe.com")) return null;
    return url.href;
  } catch {
    return null;
  }
}

/** USD, EUR and GBP use two decimal minor units in the billing API. */
export function formatMinor(amount: number, currency: string, locale?: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount / 100);
}

const statuses = new Set(["unpaid", "creating", "checkout_pending", "paid", "cancelled", "expired", "refund_pending", "refunded", "partially_refunded", "reversed", "disputed", "requires_review", "legacy_manual", "pending", "authorized", "releasable", "blocked", "failed", "processing", "transferred", "platform_revenue"]);
export function billingStatusKey(status: string): string {
  return `billing.status.${statuses.has(status) ? status : "unknown"}`;
}

export function paymentProviderKey(provider: string): string {
  return `connect.${provider === "stripe_connect" ? "stripe_connect" : provider === "platform" ? "platform" : "manual"}`;
}

export function payoutStatusKey(status: string): string {
  return billingStatusKey(status === "paid" ? "transferred" : status);
}

export function isPendingPayout(status: string): boolean {
  return status === "pending" || status === "releasable" || status === "processing";
}
