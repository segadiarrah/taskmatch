import { analyticsAllowed } from "@/lib/analytics-consent";

/** Public entry points are allowlisted: never redirect to an arbitrary URL. */
export const PUBLIC_INTENTS = ["mission", "work", "agent", "project", "executor"] as const;
export const MARKETPLACE_INTENTS = ["project", "work", "executor"] as const;
export type PublicIntent = typeof PUBLIC_INTENTS[number];

export function parsePublicIntent(value: string | null | undefined): PublicIntent | null {
  if (value === "delegation") return "agent";
  return PUBLIC_INTENTS.find(intent => intent === value) ?? null;
}

export function intentDestination(intent: PublicIntent): string {
  return {
    mission: "/human-tasks?view=request",
    work: "/human-tasks?view=work",
    agent: "/human-tasks?view=agents",
    project: "/client/jobs/new",
    executor: "/developer/agents/new",
  }[intent];
}

export function authIntentHref(page: "login" | "register", intent: PublicIntent | null): string {
  return `/${page}${intent ? `?intent=${intent}` : ""}`;
}

export function registrationRole(intent: PublicIntent | null): "client" | "agent_developer" {
  return intent === "executor" ? "agent_developer" : "client";
}

export function postAuthDestination(role: string, intent: PublicIntent | null): string {
  const dashboard = role === "admin" ? "/admin" : role === "agent_developer" ? "/developer" : "/client";
  if (intent === "project" && role !== "client") return dashboard;
  if (intent === "executor" && role !== "agent_developer") return dashboard;
  return intent ? intentDestination(intent) : dashboard;
}

const CAMPAIGN_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "referral"] as const;
type CampaignField = typeof CAMPAIGN_FIELDS[number];
export type CampaignTags = Partial<Record<CampaignField, string>>;
const CAMPAIGN_VALUE = new RegExp("^[\\p{L}\\p{N} ._-]+$", "u");
const CAMPAIGN_STORAGE = "taskmatch_signup_campaign";
const INTENT_STORAGE = "taskmatch_signup_intent";
let firstCampaign: CampaignTags | undefined;
let lastIntent: PublicIntent | null = null;

export function campaignFromQuery(params: URLSearchParams): CampaignTags {
  const result: CampaignTags = {};
  for (const field of CAMPAIGN_FIELDS) {
    const raw = params.get(field) ?? (field === "referral" ? params.get("ref") : null);
    const value = raw?.trim();
    if (value && value.length <= 100 && CAMPAIGN_VALUE.test(value)) result[field] = value;
  }
  return result;
}

export function captureCampaign(): CampaignTags {
  if (typeof window === "undefined") return {};
  if (!analyticsAllowed()) {
    firstCampaign = undefined;
    try { window.sessionStorage.removeItem(CAMPAIGN_STORAGE); } catch { /* Storage may be blocked. */ }
    return {};
  }
  if (firstCampaign) return firstCampaign;
  let query = window.location.search;
  try {
    const saved = window.sessionStorage.getItem(CAMPAIGN_STORAGE);
    if (saved) query = saved;
  } catch { /* Fall back to memory when storage is blocked. */ }
  const tags = campaignFromQuery(new URLSearchParams(query));
  // An untagged landing can still be followed by a tagged share link in this tab.
  if (Object.keys(tags).length) {
    firstCampaign = tags;
    try {
      window.sessionStorage.setItem(CAMPAIGN_STORAGE, new URLSearchParams(tags).toString());
    } catch { /* Memory still covers client navigation. */ }
  }
  return tags;
}

export function rememberIntent(intent: PublicIntent): void {
  lastIntent = intent;
  try { window.sessionStorage.setItem(INTENT_STORAGE, intent); } catch { /* Memory fallback. */ }
}

export function rememberedIntent(): PublicIntent | null {
  if (typeof window === "undefined") return null;
  try { return parsePublicIntent(window.sessionStorage.getItem(INTENT_STORAGE)) ?? lastIntent; }
  catch { return lastIntent; }
}

export function clearRegistrationContext(): void {
  firstCampaign = undefined;
  lastIntent = null;
  try {
    window.sessionStorage.removeItem(CAMPAIGN_STORAGE);
    window.sessionStorage.removeItem(INTENT_STORAGE);
  } catch { /* Storage can be unavailable in private browsing. */ }
}
