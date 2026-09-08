const en = {
  /* ------------------------------------------------------------------------ */
  /*  Navigation                                                              */
  /* ------------------------------------------------------------------------ */
  /* ------------------------------------------------------------------------ */
  /*  Hero                                                                    */
  /* ------------------------------------------------------------------------ */
  /* ------------------------------------------------------------------------ */
  /*  How It Works                                                            */
  /* ------------------------------------------------------------------------ */
  /* ------------------------------------------------------------------------ */
  /*  For Clients                                                             */
  /* ------------------------------------------------------------------------ */
  /* ------------------------------------------------------------------------ */
  /*  For Developers                                                          */
  /* ------------------------------------------------------------------------ */
  /* ------------------------------------------------------------------------ */
  /*  Pricing                                                                 */
  /* ------------------------------------------------------------------------ */
  /* ------------------------------------------------------------------------ */
  /*  Why TaskMatch                                                           */
  /* ------------------------------------------------------------------------ */
  /* ------------------------------------------------------------------------ */
  /*  Mission Control                                                         */
  /* ------------------------------------------------------------------------ */
  /* ------------------------------------------------------------------------ */
  /*  FAQ                                                                     */
  /* ------------------------------------------------------------------------ */
  /* ------------------------------------------------------------------------ */
  /*  CTA & Footer                                                            */
  /* ------------------------------------------------------------------------ */
  /* ------------------------------------------------------------------------ */
  /*  Auth                                                                    */
  /* ------------------------------------------------------------------------ */
  /* ------------------------------------------------------------------------ */
  /*  Dashboard                                                               */
  /* ------------------------------------------------------------------------ */
  client: {
    welcome: "Welcome back, {name}",
    welcomeFallbackName: "there",
    overview: "Here is an overview of your projects and tasks.",
    createJob: "Create New Job",
    tryAgain: "Try Again",
    loadFailed: "Failed to load dashboard data",
    kpi: {
      myJobs: "My Jobs",
      activeTasks: "Active Tasks",
      pendingReviews: "Pending Reviews",
      totalSpent: "Total Spent",
    },
    new: {
      breadcrumb: "My Jobs",
      title: "Create New Job",
      subtitle:
        "Describe your complex task in detail and attach any specs, data, or documents \u2014 the platform ingests everything and routes each part to the best-qualified agent or human expert.",
      details: { title: "Job Details", subtitle: "Provide the basic information about your project." },
      jobTitle: "Title",
      jobTitlePlaceholder: "e.g., Build a REST API for e-commerce platform",
      description: "Detailed description",
      descriptionPlaceholder:
        "Describe your complex task in full: the outcome you need, the context and background, deliverables, technical requirements, constraints, and success criteria. The more detail you provide, the better the platform can decompose the work and route each part to the right agent or human expert.",
      descriptionHelp:
        "Write as much as you need \u2014 this is not a one-line prompt. Attach supporting documents below and the platform will ingest them alongside your description.",
      attachments: "Attachments",
      optional: "(optional)",
      dropFiles: "Drop files here or",
      browse: "browse",
      acceptedFiles:
        "Specs, briefs, data, designs \u2014 PDF, Word, TXT, Markdown, CSV, JSON and more. The platform extracts the text and ingests it into your brief.",
      removeFile: "Remove {name}",
      budget: { title: "Budget & Timeline", subtitle: "Set your budget range and project deadline." },
      minBudget: "Min Budget",
      maxBudget: "Max Budget",
      currency: "Currency",
      deadline: "Deadline",
      deadlineHelp: "Optional. Leave blank if there is no hard deadline.",
      autoSelect: "Auto-select agents",
      autoSelectHelp: "Let TaskMatch automatically assign the best-matched agents to your tasks.",
      requirements: { title: "Requirements", subtitle: "Add specific requirements for this job. These help filter and match agents." },
      removeRequirement: "Remove requirement {number}",
      addRequirementLabel: "Add a requirement",
      requirementPlaceholder: "e.g., Python 3.10+",
      addRequirement: "Add Requirement",
      cancel: "Cancel",
      submit: "Create Job",
      phase: { creating: "Creating\u2026", uploading: "Uploading documents\u2026", planning: "Planning\u2026" },
      reqType: {
        skill: "Skill",
        experience: "Experience",
        certification: "Certification",
        tool: "Tool",
        language: "Language",
        other: "Other",
      },
      priority: { low: "Low", medium: "Medium", high: "High", critical: "Critical" },
    },
    detail: {
      notFound: "Job not found",
      backToJobs: "Back to Jobs",
      breadcrumbDashboard: "Dashboard",
      breadcrumbJobs: "Jobs",
      created: "Created",
      progress: "Job Progress",
      description: "Description",
      summaryTitle: "AI-Structured Summary",
      summarySubtitle: "Auto-generated structured breakdown of your job requirements",
      deliverablesTitle: "Final Deliverables",
      deliverablesSubtitle: "Approved submissions from agents",
      qualityScore: "Quality Score:",
      artifact: "Artifact",
      submitted: "Submitted",
      reviewTitle: "Review Required",
      reviewBody: "This job is awaiting your review. Approve the results or request revisions.",
      reviewNotesLabel: "Revision Notes (optional for approve, required for revision)",
      reviewNotesPlaceholder: "Provide feedback or revision instructions\u2026",
      approve: "Approve Result",
      requestRevision: "Request Revision",
      budget: "Budget",
      range: "Range",
      used: "Used",
      currency: "Currency",
      payment: "Payment",
      status: "Status",
      totalPaid: "Total Paid",
      details: "Details",
      deadline: "Deadline",
      noDeadline: "No deadline",
      autoSelect: "Auto-select",
      yes: "Yes",
      no: "No",
      lastUpdated: "Last Updated",
    },
    plan: {
      stage: {
        format: { label: "Format brief", desc: "Structuring your request" },
        decompose: { label: "Decompose", desc: "Breaking it into tasks" },
        match: { label: "Match agents", desc: "Finding the best AI agents" },
        assign: { label: "Assign", desc: "Pairing agents to tasks" },
        validate: { label: "Validate", desc: "Quality-checking the work" },
        pay: { label: "Pay", desc: "Releasing payment on approval" },
      },
      title: "Execution plan",
      ready: "Ready",
      notSubmitted:
        "Submit this job to generate its execution plan. We will structure your brief, break it into tasks, and match each one to an executor.",
      submitCta: "Submit job to generate plan",
      loading: "Loading your execution plan\u2026",
      planningTitle: "We are planning your request\u2026",
      planningBody:
        "Our orchestration layer is structuring your brief, breaking it into tasks, and matching executors.",
      planningHint: "This usually takes under a minute. This panel updates automatically.",
      subtitle:
        "Here\u2019s exactly how your request will be delivered \u2014 the tasks it became, who executes each one, and what you pay.",
      escrowReleasedTitle: "Work accepted \u2014 escrow released",
      escrowHeldTitle: "Work delivered \u2014 held in escrow for your review",
      escrowReleasedBody: "{net} released to the executor. Job completed.",
      escrowHeldBody:
        "{gross} held in escrow ({net} to the executor after the {fee} platform fee). Review the results below, then release.",
      requestChanges: "Request changes",
      releasing: "Releasing\u2026",
      acceptAndRelease: "Accept & release payment",
      completed: "Completed",
      disputePrompt:
        "What did the deliverable miss? Your payment stays held in escrow while the executor revises.",
      disputePlaceholder:
        "e.g. Section 2 doesn\u2019t cover the EU market as requested; tone is too informal.",
      cancel: "Cancel",
      submitting: "Submitting\u2026",
      submitDispute: "Submit dispute & request revision",
      briefTitle: "How we understood your brief",
      objective: "Objective",
      deliverables: "Deliverables",
      successCriteria: "Success criteria",
      constraints: "Constraints",
      briefEmpty: "A structured summary of your brief will appear here.",
      breakdown: {
        one: "How it breaks down \u2014 {count} task & matched agents",
        other: "How it breaks down \u2014 {count} tasks & matched agents",
      },
      noTasks: "No tasks were generated for this job.",
      priority: "Priority",
      revised: "Revised",
      revisionCount: "\u00d7{count}",
      matchedAgents: "Matched agents",
      matching: "Matching agents to this task\u2026",
      bestMatch: "Best match",
      delivered: "Delivered",
    },
    jobs: {
      title: "My Jobs",
      subtitle: "Manage all your job postings and track their progress.",
      create: "Create Job",
      createFirst: "Create Your First Job",
      retry: "Retry",
      found: { one: "{count} job found", other: "{count} jobs found" },
      emptyTitle: "No jobs found",
      emptyFiltered: "No jobs match the current filter. Try changing the status filter.",
      emptyAll: "You have not created any jobs yet. Post your first job to get started.",
      allStatuses: "All Statuses",
      status: {
        draft: "Draft",
        pending: "Pending",
        active: "Active",
        in_progress: "In Progress",
        client_review: "Client Review",
        completed: "Completed",
        cancelled: "Cancelled",
      },
      column: {
        title: "Title",
        status: "Status",
        budget: "Budget",
        tasks: "Tasks",
        deadline: "Deadline",
        created: "Created",
      },
      page: "Page {page} of {total}",
      previous: "Previous",
      next: "Next",
    },
    recent: {
      title: "Recent Jobs",
      subtitle: "Your latest 5 job postings",
      viewAll: "View All",
      emptyTitle: "No jobs yet",
      emptyBody: "Create your first job to get started with TaskMatch.",
      emptyCta: "Create Job",
      taskCount: "{count} tasks",
    },
  },

  dashboard: {
    overview: "Overview",
    jobs: "Jobs",
    tasks: "Tasks",
    agents: "Agents",
    bids: "Bids",
    submissions: "Submissions",
    validations: "Validations",
    payments: "Payments",
    learning: "Learning",
    audit: "Audit Log",
    loading: "Loading\u2026",
    empty: "Nothing here yet.",
    error: "Something went wrong. Please try again.",
    loadErrorTitle: "Couldn't load this data",
    loadErrorBody:
      "The request to the server failed. The page shows nothing rather than data that might be wrong.",
    retry: "Try again",
  },

  /* ------------------------------------------------------------------------ */
  /*  Content pages                                                           */
  /* ------------------------------------------------------------------------ */


  /* ------------------------------------------------------------------------ */
  /*  GDPR                                                                    */
  /* ------------------------------------------------------------------------ */
  /* ------------------------------------------------------------------------ */
  /*  Homepage (landing page)                                                 */
  /* ------------------------------------------------------------------------ */
  /* ------------------------------------------------------------------------ */
  /*  Quote — TaskMatch sets the price, the client approves it                */
  /* ------------------------------------------------------------------------ */
  quote: {
    title: "Your quote",
    subtitle:
      "TaskMatch sets the price for each task \u2014 you are not bidding against a marketplace. Nothing is executed or billed until you approve.",
    pricingInProgress: "Pricing your request \u2014 this takes a few seconds.",
    pricingHint: "TaskMatch sets a price per task. Nothing runs until you approve it.",
    totalLabel: "Total",
    totalBreakdown: "Includes",
    platformFee: "platform fee",
    humanEquivalent: "Human-expert equivalent",
    savings: "You save",
    validUntil: "Valid until",
    perTask: "Price per task",
    routeLlm: "AI agent",
    routeHuman: "Human expert",
    routeHybrid: "AI + human review",
    tokenCost: "Token cost",
    compute: "Compute",
    orchestration: "Orchestration",
    validation: "Validation",
    expertRange: "Range offered to experts:",
    humanWouldCost: "A human expert would cost:",
    hoursShort: "h",
    gateNotice:
      "Approving releases the job for execution and places the amount in escrow. It is paid out only against validated delivery.",
    accept: "Approve & start",
    accepting: "Approving\u2026",
    decline: "Decline",
    rejecting: "Declining\u2026",
    confirmReject: "Confirm decline",
    cancel: "Cancel",
    rejectPrompt: "What doesn\u2019t work about this price?",
    statusAccepted: "Approved",
    statusRejected: "Declined",
    statusExpired: "Expired",
    acceptedNotice: "Quote approved \u2014 execution has started.",
    rejectedReason: "Reason given:",
    requoteHint: "Adjust your brief or delivery mode, then request a new quote.",
    errorLoad: "Could not load the quote.",
    errorAccept: "Could not accept the quote. Please retry.",
    errorReject: "Could not decline the quote. Please retry.",
  },

  /* ------------------------------------------------------------------------ */
  /*  Delivery & handover                                                     */
  /* ------------------------------------------------------------------------ */
  delivery: {
    title: "Delivery & handover",
    subtitle:
      "How the finished work reaches you \u2014 a document, a repository, or installed on your own infrastructure.",
    loading: "Loading the delivery plan\u2026",
    signedOff: "Signed off",
    modeTitle: "Delivery mode",
    mode: {
      document: "Document",
      repository: "Repository",
      dataset: "Dataset",
      installation: "Installation",
      hosted: "Hosted",
    },
    requirements: "What we need from you",
    requoteNotice:
      "Changing the delivery mode changes the work involved. Request a new quote so the price matches.",
    accessTitle: "Access credentials",
    accessHelp:
      "Encrypted at rest, revealed a limited number of times, every access logged, and revoked automatically when you sign off.",
    vaultUnavailable:
      "The credential vault is not configured on this environment, so credentials cannot be stored. Contact your administrator.",
    addGrant: "Share a credential",
    grantLabel: "What is it for",
    grantSecret: "Credential",
    store: "Store securely",
    reveal: "Reveal",
    reveals: "reveals",
    revoke: "Revoke",
    grantRevoked: "Revoked",
    grantExpired: "Expired",
    signOffHelp:
      "Confirm the delivery landed. Every credential you shared is revoked immediately.",
    signOffAction: "Confirm handover",
    errorUpdate: "Could not update the delivery mode.",
    errorGrant: "Could not store the credential.",
    errorReveal: "This credential can no longer be revealed.",
    errorRevoke: "Could not revoke the credential.",
    errorSignOff: "Could not confirm the handover.",
  },

} as const;

export default en;
