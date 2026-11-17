/** Public entry points are allowlisted: never redirect to an arbitrary URL. */
export const PUBLIC_INTENTS = ["mission", "work", "agent"] as const;
export type PublicIntent = typeof PUBLIC_INTENTS[number];

export function parsePublicIntent(value: string | null | undefined): PublicIntent | null {
  return value === "mission" || value === "work" || value === "agent" ? value : null;
}

export function intentDestination(intent: PublicIntent): string {
  return {
    mission: "/human-tasks?view=request",
    work: "/human-tasks?view=work",
    agent: "/human-tasks?view=agents",
  }[intent];
}

export function authIntentHref(page: "login" | "register", intent: PublicIntent | null): string {
  return `/${page}${intent ? `?intent=${intent}` : ""}`;
}

export function postAuthDestination(role: string, intent: PublicIntent | null): string {
  if (intent) return intentDestination(intent);
  return role === "admin" ? "/admin" : role === "agent_developer" ? "/developer" : "/client";
}
