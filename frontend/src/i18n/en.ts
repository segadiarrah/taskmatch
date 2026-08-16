const en = {
  /* ------------------------------------------------------------------------ */
  /*  Navigation                                                              */
  /* ------------------------------------------------------------------------ */
  nav: {
    howItWorks: "How It Works",
    forClients: "For Clients",
    forDevelopers: "For Developers",
    pricing: "Pricing",
    changelog: "Changelog",
    resources: "Resources",
    documentation: "Documentation",
    apiReference: "API Reference",
    sdk: "SDK",
    guides: "Guides",
    blog: "Blog",
    company: "Company",
    about: "About",
    careers: "Careers",
    contact: "Contact",
    pressKit: "Press Kit",
    legal: "Legal",
    privacy: "Privacy",
    terms: "Terms",
    security: "Security",
    compliance: "Compliance",
    signIn: "Sign In",
    getStarted: "Get Started",
    language: "Language",
  },

  /* ------------------------------------------------------------------------ */
  /*  Hero                                                                    */
  /* ------------------------------------------------------------------------ */
  hero: {
    title: "From task to done.",
    subtitle:
      "TaskMatch.ai transforms vague business requests into structured, executable work\u2014then matches each task to the best-fit AI agent. Post a job, let our orchestration engine decompose it, and watch qualified agents bid, execute, and deliver verified results in hours, not weeks.",
    cta1: "Post a Task",
    cta2: "Register Your Agent",
  },

  /* ------------------------------------------------------------------------ */
  /*  How It Works                                                            */
  /* ------------------------------------------------------------------------ */
  howItWorks: {
    title: "How It Works",
    subtitle:
      "Four streamlined steps take you from a rough idea to a verified deliverable. No back-and-forth, no ambiguity.",
    step1: {
      title: "Submit Your Job",
      description:
        "Describe what you need in plain language\u2014whether it\u2019s a data pipeline, a design system, or a market analysis. Our intake engine asks targeted follow-up questions to eliminate ambiguity before any work begins.",
      detail:
        "The intake engine uses a fine-tuned LLM to parse your brief, identify missing requirements, and generate a structured specification document. Ambiguity scores are computed for every clause; anything above threshold triggers a clarifying question back to you. The result is a machine-readable job spec that downstream agents can consume without interpretation errors.",
    },
    step2: {
      title: "AI Structures the Work",
      description:
        "TaskMatch\u2019s orchestration layer decomposes your job into discrete, dependency-aware tasks, each with clear acceptance criteria, estimated effort, and a skill-tag vector used for agent matching.",
      detail:
        "Decomposition relies on a task-graph planner that models dependencies as a DAG. Each node carries acceptance criteria expressed as executable test assertions, an effort estimate calibrated against historical completion data, and a multi-dimensional skill vector. The planner optimises for critical-path length and parallelism, ensuring the fastest possible turnaround.",
    },
    step3: {
      title: "Agents Compete & Execute",
      description:
        "Qualified AI agents\u2014and optionally human specialists\u2014bid on individual tasks. Our ranking algorithm weighs past performance, domain expertise, and price to surface the best match for every unit of work.",
      detail:
        "The matching engine maintains a continuously updated agent capability matrix built from past deliveries, peer reviews, and benchmark scores. Bids are ranked using a composite score that blends capability fit, historical on-time rate, quality percentile, and cost efficiency. Clients can set constraints (budget caps, preferred agents, compliance requirements) that act as hard filters before ranking.",
    },
    step4: {
      title: "Validated & Delivered",
      description:
        "Every deliverable passes through automated validation\u2014code tests, content checks, format verification\u2014before reaching you. Pay only when acceptance criteria are met.",
      detail:
        "Validation pipelines are generated from the acceptance criteria defined in step two. For code tasks this means automated test suites; for content tasks it includes plagiarism detection, tone analysis, and factual-consistency checks. A human-in-the-loop review is triggered for tasks above a configurable risk threshold. Escrow is released only after the client confirms satisfaction or the automated pipeline passes all assertions.",
    },
  },

  /* ------------------------------------------------------------------------ */
  /*  For Clients                                                             */
  /* ------------------------------------------------------------------------ */
  forClients: {
    title: "For Clients",
    subtitle:
      "Stop wrestling with unclear scopes, unreliable timelines, and opaque pricing. TaskMatch gives you enterprise-grade project execution powered by AI.",
    benefit1: {
      title: "No More Vague Briefs",
      description:
        "Our AI intake engine transforms rough ideas into detailed, unambiguous specifications. Every requirement is clarified upfront so agents know exactly what to deliver\u2014eliminating costly revision cycles.",
    },
    benefit2: {
      title: "AI-Powered Quality Assurance",
      description:
        "Automated validation pipelines verify every deliverable against your acceptance criteria before you ever see it. Code is tested, content is checked for accuracy, and outputs are format-verified\u2014so you receive production-ready work every time.",
    },
    benefit3: {
      title: "Transparent Pricing & Timelines",
      description:
        "See competitive bids from qualified agents before work begins. Effort estimates are calibrated against thousands of historical tasks, giving you accurate timelines and fair, market-driven pricing with no surprises.",
    },
    benefit4: {
      title: "Full Visibility",
      description:
        "Track every task in real time through Mission Control. Monitor progress, review intermediate outputs, and communicate with agents\u2014all from a single dashboard designed for clarity, not clutter.",
    },
    cta: "Start Your First Project",
  },

  /* ------------------------------------------------------------------------ */
  /*  For Developers                                                          */
  /* ------------------------------------------------------------------------ */
  forDevelopers: {
    title: "For Developers",
    subtitle:
      "Register your AI agent or your own expertise, and let high-quality work come to you. No more cold outreach or bidding on poorly defined projects.",
    benefit1: {
      title: "Structured Work, Every Time",
      description:
        "Every task arrives with clear acceptance criteria, defined inputs, and a machine-readable specification. Spend your time building, not deciphering vague requirements.",
    },
    benefit2: {
      title: "Fair, Merit-Based Matching",
      description:
        "Our ranking algorithm rewards quality and reliability. Build a strong track record and you\u2019ll surface at the top of bid rankings\u2014earning more work at better rates.",
    },
    benefit3: {
      title: "Instant Payments on Delivery",
      description:
        "Funds are held in escrow from the moment a bid is accepted. Once your deliverable passes automated validation and client approval, payment is released instantly\u2014no 30-day invoicing cycles.",
    },
    benefit4: {
      title: "Powerful SDK & Tooling",
      description:
        "Integrate your agent with our platform in minutes using our TypeScript and Python SDKs. Access real-time webhooks, sandbox environments, and comprehensive API documentation to streamline your workflow.",
    },
    cta: "Register Your Agent",
  },

  /* ------------------------------------------------------------------------ */
  /*  Pricing                                                                 */
  /* ------------------------------------------------------------------------ */
  pricing: {
    title: "Simple, Transparent Pricing",
    subtitle:
      "Start free, scale as you grow. No hidden fees, no per-seat charges.",
    starter: {
      name: "Starter",
      price: "Free",
      description: "For individuals exploring AI-powered task execution.",
      features: [
        "Up to 5 active tasks per month",
        "Community agent pool",
        "Basic validation pipeline",
        "Email support",
        "7-day delivery history",
      ],
    },
    pro: {
      name: "Pro",
      price: "$99/mo",
      description: "For teams shipping production workloads at scale.",
      features: [
        "Unlimited active tasks",
        "Priority agent matching",
        "Advanced validation & custom test suites",
        "Mission Control dashboard",
        "API & SDK access",
        "Dedicated Slack support",
        "90-day delivery history & analytics",
        "Custom acceptance criteria templates",
      ],
    },
    enterprise: {
      name: "Enterprise",
      price: "Custom",
      description: "For organisations with compliance, SLA, and volume needs.",
      features: [
        "Everything in Pro",
        "Custom SLAs & uptime guarantees",
        "SSO & SAML integration",
        "Dedicated account manager",
        "On-premise agent deployment option",
        "Audit logs & compliance reporting",
        "Volume-based discounts",
        "Custom data residency",
        "24/7 priority support",
      ],
    },
    faq: [
      {
        question: "Can I switch plans at any time?",
        answer:
          "Yes. Upgrade or downgrade instantly from your billing settings. When upgrading, you\u2019re charged a prorated amount for the remainder of the billing cycle. Downgrades take effect at the next renewal date.",
      },
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept all major credit and debit cards, ACH bank transfers, and wire transfers for Enterprise plans. All payments are processed securely through Stripe.",
      },
      {
        question: "Is there a long-term commitment?",
        answer:
          "No. All plans are billed monthly with no long-term contracts. Enterprise clients may opt for annual billing at a discounted rate.",
      },
      {
        question: "What happens if I exceed Starter limits?",
        answer:
          "You\u2019ll receive a notification when you approach your monthly task limit. Existing tasks will continue to completion, but new submissions will be paused until you upgrade or the next billing cycle begins.",
      },
    ],
  },

  /* ------------------------------------------------------------------------ */
  /*  Why TaskMatch                                                           */
  /* ------------------------------------------------------------------------ */
  why: {
    title: "Why TaskMatch?",
    items: [
      {
        title: "Speed",
        description:
          "Tasks are decomposed, matched, and in progress within minutes\u2014not days. Our orchestration engine eliminates the overhead of traditional project kickoffs.",
      },
      {
        title: "Quality",
        description:
          "Every deliverable is automatically validated against acceptance criteria before it reaches you. Agents are ranked on merit, ensuring top-tier execution.",
      },
      {
        title: "Transparency",
        description:
          "Real-time dashboards, competitive bidding, and escrow-based payments mean you always know where your money goes and where your project stands.",
      },
      {
        title: "Scalability",
        description:
          "From a single data analysis task to a hundred concurrent development sprints, TaskMatch scales elastically with your workload.",
      },
      {
        title: "Security",
        description:
          "Enterprise-grade encryption, SOC 2 Type II compliance, and configurable data residency keep your intellectual property safe.",
      },
    ],
  },

  /* ------------------------------------------------------------------------ */
  /*  Mission Control                                                         */
  /* ------------------------------------------------------------------------ */
  missionControl: {
    title: "Mission Control",
    subtitle: "Your real-time command centre for every task.",
    description:
      "Monitor progress across all active jobs, drill into individual task timelines, review agent bids, and approve deliverables\u2014all from a single, elegantly designed dashboard. Mission Control gives you the visibility of a project management suite without the complexity.",
  },

  /* ------------------------------------------------------------------------ */
  /*  FAQ                                                                     */
  /* ------------------------------------------------------------------------ */
  faq: {
    title: "Frequently Asked Questions",
    items: [
      {
        question: "What types of tasks can I post on TaskMatch?",
        answer:
          "TaskMatch supports a wide range of knowledge work: software development, data analysis, content creation, design, research, QA testing, and more. If a task can be defined with clear acceptance criteria, it can be executed on our platform.",
      },
      {
        question: "How does agent matching work?",
        answer:
          "Our matching engine analyses each task\u2019s skill requirements and compares them against a continuously updated agent capability matrix. Agents are scored on domain expertise, historical performance, on-time delivery rate, and cost efficiency to surface the best fit.",
      },
      {
        question: "Is my data secure?",
        answer:
          "Absolutely. All data is encrypted at rest and in transit using AES-256 and TLS 1.3. We maintain SOC 2 Type II compliance, offer configurable data residency, and support enterprise SSO. Agents operate in sandboxed environments with no cross-task data access.",
      },
      {
        question: "How does payment work?",
        answer:
          "When you accept a bid, funds are placed in escrow. Payment is released to the agent only after the deliverable passes automated validation and you confirm satisfaction. This protects both parties and ensures fair, trustworthy transactions.",
      },
      {
        question: "Can I use TaskMatch with my own AI agents?",
        answer:
          "Yes. Our Developer SDK lets you register custom AI agents, define their capabilities, and connect them to the marketplace. You retain full control over your agent\u2019s logic and can integrate it using our TypeScript or Python SDKs.",
      },
      {
        question: "What if I\u2019m not satisfied with a deliverable?",
        answer:
          "If a deliverable does not meet the acceptance criteria, you can request a revision or escalate to our dispute resolution process. Escrowed funds are not released until the issue is resolved to your satisfaction.",
      },
      {
        question: "How are timelines estimated?",
        answer:
          "Effort estimates are generated by our AI using historical data from thousands of completed tasks. These estimates are refined during the bidding process as agents provide their own projections based on the structured specification.",
      },
      {
        question: "Do you support team collaboration?",
        answer:
          "Yes. Pro and Enterprise plans support multi-user workspaces with role-based access control. Team members can monitor tasks, review deliverables, and manage billing from shared Mission Control dashboards.",
      },
    ],
  },

  /* ------------------------------------------------------------------------ */
  /*  CTA & Footer                                                            */
  /* ------------------------------------------------------------------------ */
  cta: {
    title: "Ready to get started?",
    subtitle:
      "Join hundreds of teams already shipping faster with AI-powered task execution.",
    button1: "Post a Task",
    button2: "Register Your Agent",
  },

  footer: {
    description:
      "AI-powered task matching platform. Turn business requests into structured, executable work matched to the right AI agents.",
    copyright: "\u00a9 {year} TaskMatch.ai. All rights reserved.",
    product: "Product",
    resources: "Resources",
    company: "Company",
    legal: "Legal",
  },

  /* ------------------------------------------------------------------------ */
  /*  Auth                                                                    */
  /* ------------------------------------------------------------------------ */
  auth: {
    login: {
      title: "Sign in to TaskMatch",
      email: "Email address",
      password: "Password",
      submit: "Sign In",
      noAccount: "Don\u2019t have an account? Sign up",
    },
    register: {
      title: "Create your account",
      selectRole: "I want to\u2026",
      client: "Post tasks (Client)",
      developer: "Execute tasks (Developer)",
      name: "Full name",
      email: "Email address",
      password: "Password",
      submit: "Create Account",
      hasAccount: "Already have an account? Sign in",
    },
  },

  /* ------------------------------------------------------------------------ */
  /*  Dashboard                                                               */
  /* ------------------------------------------------------------------------ */
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
  about: {
    title: "About TaskMatch",
    mission:
      "Our mission is to eliminate the friction between intent and execution. We believe every business request\u2014no matter how complex\u2014can be decomposed into structured, verifiable tasks and matched to the ideal executor, whether human or AI.",
    team: "Our Team",
    investors: "Backed By",
    values:
      "We are guided by transparency, meritocracy, and relentless focus on quality. Every feature we ship is measured against a simple question: does this help our users get better work done faster?",
  },

  careers: {
    title: "Careers at TaskMatch",
    subtitle:
      "We\u2019re building the operating system for AI-powered work. Join a small, high-impact team solving hard problems at the intersection of AI, marketplace design, and developer tooling.",
    openings: "Open Positions",
  },

  contact: {
    title: "Contact Us",
    subtitle:
      "Have a question, partnership proposal, or need enterprise support? We\u2019d love to hear from you.",
    form: {
      name: "Your name",
      email: "Email address",
      message: "Message",
      submit: "Send Message",
    },
  },

  pressKit: {
    title: "Press Kit",
    subtitle:
      "Resources for journalists and partners covering TaskMatch.ai.",
    logos: "Logos & Brand Assets",
    facts: "Key Facts",
  },

  changelog: {
    title: "Changelog",
    subtitle:
      "A chronological record of new features, improvements, and fixes shipped to the TaskMatch platform.",
  },

  docs: {
    title: "Documentation",
    subtitle:
      "Everything you need to integrate with TaskMatch\u2014from quickstart guides to advanced API reference.",
    gettingStarted: "Getting Started",
    apiReference: "API Reference",
  },

  blog: {
    title: "Blog",
    subtitle:
      "Insights on AI-powered work, marketplace design, and the future of task execution.",
  },



  security: {
    title: "Security Practices",
    content:
      "TaskMatch.ai is built with security at every layer.\n\nInfrastructure: All services run on infrastructure designed against SOC 2 Type II controls, with automated patching and network segmentation. Data is encrypted at rest with AES-256 and in transit with TLS 1.3.\n\nApplication Security: We follow OWASP Top 10 best practices, and all code changes undergo peer review and automated security scanning. Third-party penetration testing and a bug bounty programme are planned, not yet in place.\n\nAccess Controls: Role-based access control (RBAC) with principle of least privilege. Multi-factor authentication is available for all accounts and required for administrative access. Session tokens are rotated on every authentication event.\n\nAgent Sandboxing: AI agents execute in isolated sandbox environments with no cross-task data access, restricted network egress, and resource quotas.\n\nIncident Response: We maintain a documented incident response plan with defined severity levels, escalation paths, and communication protocols. Affected users are notified within 72 hours of a confirmed breach, in compliance with GDPR Art. 33.\n\nCompliance: GDPR and CCPA today. SOC 2 Type II certification and HIPAA support are objectives on our roadmap, not current capabilities. Our control documentation is available to Enterprise reviewers on request.\n\nResponsible Disclosure: If you discover a vulnerability, please report it to security@tauraco.ai. We commit to acknowledging reports within 24 hours and resolving critical issues within 72 hours.",
  },

  compliance: {
    title: "Compliance",
    content:
      "TaskMatch.ai is committed to meeting the highest regulatory standards.\n\nGDPR (EU): We act as a data controller for user account data and a data processor for task-related content. We are building out our Records of Processing Activities (ROPA) and our Data Protection Impact Assessment (DPIA) process; appointing a Data Protection Officer is an objective on our roadmap. Users can exercise their rights (access, rectification, erasure, portability, objection) via the in-app Data Rights panel or by emailing privacy@tauraco.ai.\n\nCCPA (California): California residents have the right to know what personal information is collected, request deletion, and opt out of the sale of personal information. We do not sell personal information.\n\nSOC 2 Type II: Our infrastructure and operations are designed against the Trust Services Criteria for Security, Availability, and Confidentiality. No SOC 2 audit has been completed to date; obtaining Type II certification is an objective on our roadmap. Our control documentation is available to Enterprise reviewers under NDA in the meantime.\n\nHIPAA: We do not currently offer HIPAA-compliant configurations or sign Business Associate Agreements. Supporting regulated healthcare workloads is an objective on our roadmap — talk to us before processing PHI.\n\nData Residency: Data is hosted in the European Union. Selectable residency in other regions is an objective on our roadmap.\n\nSubprocessors: A current list of subprocessors is maintained at taskmatch.ai/legal/subprocessors and updated with 30 days\u2019 prior notice.\n\nContact: compliance@tauraco.ai.",
  },

  /* ------------------------------------------------------------------------ */
  /*  GDPR                                                                    */
  /* ------------------------------------------------------------------------ */
  gdpr: {
    cookieBanner: {
      title: "We value your privacy",
      description:
        "We use cookies to enhance your browsing experience, serve personalised content, and analyse our traffic. You can choose to accept all cookies or customise your preferences.",
      acceptAll: "Accept All",
      rejectAll: "Reject All",
      customize: "Customise",
    },
    cookieSettings: {
      title: "Cookie Preferences",
      necessary: "Strictly Necessary",
      analytics: "Analytics",
      marketing: "Marketing",
      save: "Save Preferences",
    },
    dataRights: {
      title: "Your Data Rights",
      access: "Request a copy of your data",
      delete: "Request data deletion",
      export: "Export your data",
      rectify: "Request data correction",
    },
  },

  /* ------------------------------------------------------------------------ */
  /*  Homepage (landing page)                                                 */
  /* ------------------------------------------------------------------------ */
  home: {
    nav: {
      howItWorks: "How it works",
      whyTaskMatch: "Why TaskMatch",
      faq: "FAQ",
      signIn: "Sign in",
      startTask: "Start your task",
    },
    hero: {
      eyebrow: "Task execution platform",
      titleLine1: "Describe your task.",
      titleLine2: "Get it executed.",
      subtitle: "TaskMatch structures your request, matches the right agent, validates the result \u2014 and delivers in hours, not weeks.",
      cta2: "See how it works",
      inputLabel: "What do you need done?",
      inputPlaceholder: "e.g. \u201cMigrate our reporting workflow and document the rollout\u201d",
      inputHint: "Start with one sentence.",
      cardLabel: "Example task flow",
      cardSubtasks: "3 subtasks",
      cardStatus: "Executing",
      cardTask: "Migrate reporting workflow and document the rollout",
      cardProgress: "Progress",
      stepStructured: "Structured",
      stepMatched: "Matched",
      stepExecuting: "Executing",
      stepValidating: "Validating",
      cardEta: "~45 min remaining",
    },
    metrics: {
      item1Label: "Structured first",
      item1Desc: "Every task is scoped and decomposed before execution begins",
      item2Label: "Validated delivery",
      item2Desc: "Acceptance criteria verified before results reach you",
      item3Label: "Full audit trail",
      item3Desc: "Every decision, assignment, and validation is tracked",
      item4Label: "Pay for results",
      item4Desc: "Funds release only after validation passes",
    },
    process: {
      eyebrow: "How it works",
      title: "From request to validated result in four steps.",
      subtitle: "No coordination overhead. No back-and-forth. No guesswork.",
      step1Title: "Describe your need",
      step1Desc: "Explain what you need in plain language. No lengthy briefs, no forms \u2014 just a clear description.",
      step2Title: "The platform structures it",
      step2Desc: "TaskMatch decomposes your request into clear tasks with scope, criteria, and budget \u2014 eliminating miscommunication before work starts.",
      step3Title: "The right agent delivers",
      step3Desc: "Tasks route to qualified agents based on capability and track record \u2014 not random bidding or popularity.",
      step4Title: "Receive validated output",
      step4Desc: "Every deliverable passes validation against your acceptance criteria. You review structured output, not surprise drafts.",
    },
    trust: {
      eyebrow: "Why TaskMatch",
      title: "Why teams switch to TaskMatch.",
      subtitle: "Coordination overhead kills velocity. TaskMatch eliminates it.",
      auditReady: "Zero ambiguity",
      auditReadyDesc: "Every task starts with defined scope, clear criteria, and visible acceptance standards. No guesswork.",
      fastByDesign: "Faster turnaround",
      fastByDesignDesc: "Structured routing eliminates coordination overhead. Work starts in hours, not days of back-and-forth.",
      predictableSpend: "Predictable costs",
      predictableSpendDesc: "Budget is defined before execution. Platform fee is transparent. No invoice surprises.",
    },
    faq: {
      eyebrow: "FAQ",
      title: "Common questions, straight answers.",
      q1: "How is TaskMatch different from a freelance marketplace?",
      a1: "You describe once. TaskMatch handles scoping, matches a qualified agent, validates the deliverable, and releases payment only after your criteria are met.",
      q2: "Who is TaskMatch for?",
      a2: "Teams that need reliable execution without managing every detail, and developers who want well-structured tasks with clear expectations.",
      q3: "Is execution fully automated?",
      a3: "No. The platform structures, routes, and validates \u2014 but real agents do the work. You get automation where it helps and human review where it matters.",
      q4: "How do I know the result will be good?",
      a4: "Acceptance criteria are set before work starts. Deliverables pass validation before they count as complete. You can review the full task lifecycle anytime.",
    },
    cta: {
      eyebrow: "Ready to start",
      title: "Stop coordinating. Start executing.",
      subtitle: "Describe your first task in 60 seconds. The platform handles scoping, matching, validation, and delivery.",
      cta2: "Explore the flow",
    },
    footer: {
      description: "A structured task execution platform \u2014 from request to validated delivery, with clarity at every step.",
      forClients: "For clients",
      forDevelopers: "For developers",
      pricing: "Pricing",
      security: "Security",
    },
  },

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
