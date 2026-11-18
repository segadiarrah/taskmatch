/** Public entry points are allowlisted: never redirect to an arbitrary URL. */
export const PUBLIC_INTENTS = ["mission", "work", "agent", "project", "executor"] as const;
export const MARKETPLACE_INTENTS = ["project", "work", "executor"] as const;
export type PublicIntent = typeof PUBLIC_INTENTS[number];

export function parsePublicIntent(value: string | null | undefined): PublicIntent | null {
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
