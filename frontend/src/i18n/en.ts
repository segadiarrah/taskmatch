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
