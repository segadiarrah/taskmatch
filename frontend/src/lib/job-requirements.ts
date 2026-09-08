/**
 * Requirement vocabulary accepted by the jobs API.
 *
 * These are wire values, not display copy: the strings travel to the backend
 * and must match it exactly, so they are never translated. What the user reads
 * is looked up per value under `client.new.reqType.*` and `client.new.priority.*`
 * in the dictionaries.
 *
 * They live here rather than in the page for that reason — a page file is
 * scanned for untranslated copy, and an API constant sitting among labels
 * invites someone to "fix" it into French.
 */

export const REQUIREMENT_TYPES = [
  "skill",
  "experience",
  "certification",
  "tool",
  "language",
  "other",
] as const;

export type RequirementType = (typeof REQUIREMENT_TYPES)[number];

export const PRIORITIES = ["low", "medium", "high", "critical"] as const;

export type Priority = (typeof PRIORITIES)[number];

/**
 * Ordered job lifecycle, as the backend reports it. Used to place a job on its
 * progress bar, so the order matters as much as the spelling. Wire values, like
 * the lists above — the labels shown to a client live in the dictionaries.
 */
export const JOB_LIFECYCLE: readonly string[] = [
  "draft",
  "pending",
  "active",
  "in_progress",
  "client_review",
  "completed",
];

/**
 * Stages of the execution plan, in order.
 *
 * Only the keys live here. What each stage is called is UI copy and sits under
 * `client.plan.stage.*` in the dictionaries — but the backend may return its own
 * stage list with its own labels, in which case those win, so the lookup passes
 * the server's label as the fallback.
 */
export const DEFAULT_PLAN_STAGE_KEYS: readonly string[] = [
  "format",
  "decompose",
  "match",
  "assign",
  "validate",
  "pay",
];
