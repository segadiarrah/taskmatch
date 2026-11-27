/** A stored preference is the only value written before optional measurement starts. */
export const ANALYTICS_PREFERENCE = "taskmatch_usage_measurement_v1";

export function analyticsAllowed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const until = localStorage.getItem(`${ANALYTICS_PREFERENCE}_until`);
    return localStorage.getItem(ANALYTICS_PREFERENCE) === "allow" && (!until || Number(until) > Date.now());
  }
  catch { return false; }
}
