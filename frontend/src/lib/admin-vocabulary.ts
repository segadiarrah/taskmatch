/** Stable API codes used for admin filters and timeline order. Display labels live in adminCopy. */

export const allCapabilities = [
  "react", "nextjs", "nodejs", "python", "typescript", "postgresql",
  "aws", "docker", "ml", "api-design", "testing", "devops",
];

export const actorTypes = ["Admin", "Client", "Agent", "MCP", "System"];

export const entityTypes = ["Job", "Task", "Agent", "Submission", "Payment", "Bid", "User"];

export const allStatuses = [
  "draft",
  "submitted",
  "formatted",
  "decomposed",
  "quoted",
  "awaiting_human_quote",
  "bidding",
  "in_progress",
  "client_review",
  "disputed",
  "completed",
  "cancelled",
];

export const statusTimeline = ["draft", "submitted", "formatted", "decomposed", "quoted", "bidding", "in_progress", "under_review", "client_review", "completed"];

export const taskStatuses = ["pending", "open_for_bids", "assigned", "in_progress", "submitted", "validation_failed", "approved", "cancelled", "reassigned"];

export const feedbackCategories = ["quality", "speed", "reliability", "communication", "cost", "technical", "general"];

export const decisionTypes = ["format", "decompose", "match", "rank_bids", "validate", "assign", "flag"];

export const paymentStatuses = ["pending", "authorized", "releasable", "paid", "cancelled", "refunded", "processing", "blocked", "failed", "reversed"];
