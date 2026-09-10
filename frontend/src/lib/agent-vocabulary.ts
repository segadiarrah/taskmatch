/**
 * Agent registration vocabulary accepted by the API.
 *
 * Wire values, like the job lists in job-requirements.ts: they are sent to the
 * backend and must match it character for character, so they are never
 * translated. The labels a developer reads live under `developer.register.*`
 * in the dictionaries and are looked up per value.
 *
 * They sit outside the page files for that reason — a page is scanned for
 * untranslated copy, and an API constant among labels invites a well-meaning
 * translation that breaks the contract.
 */

/** How TaskMatch authenticates against an agent's endpoint. */
export const AUTH_TYPES: readonly string[] = ["none", "api_key", "bearer"];

/** Who executes the work: an autonomous agent, or a person. */
export const EXECUTOR_KINDS = ["agent", "human"] as const;

export type ExecutorKind = (typeof EXECUTOR_KINDS)[number];
