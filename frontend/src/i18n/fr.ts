const fr = {
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
    welcome: "Bon retour, {name}",
    welcomeFallbackName: "vous",
    overview: "Voici un aper\u00e7u de vos projets et de vos t\u00e2ches.",
    createJob: "Cr\u00e9er une mission",
    tryAgain: "R\u00e9essayer",
    loadFailed: "\u00c9chec du chargement des donn\u00e9es du tableau de bord",
    kpi: {
      myJobs: "Mes missions",
      activeTasks: "T\u00e2ches en cours",
      pendingReviews: "Revues en attente",
      totalSpent: "Total d\u00e9pens\u00e9",
    },
    new: {
      breadcrumb: "Mes missions",
      title: "Cr\u00e9er une mission",
      subtitle:
        "D\u00e9crivez votre t\u00e2che complexe en d\u00e9tail et joignez sp\u00e9cifications, donn\u00e9es ou documents \u2014 la plateforme int\u00e8gre le tout et oriente chaque partie vers l\u2019agent ou l\u2019expert humain le plus qualifi\u00e9.",
      details: { title: "D\u00e9tails de la mission", subtitle: "Indiquez les informations de base de votre projet." },
      jobTitle: "Titre",
      jobTitlePlaceholder: "ex. : Construire une API REST pour une plateforme e-commerce",
      description: "Description d\u00e9taill\u00e9e",
      descriptionPlaceholder:
        "D\u00e9crivez enti\u00e8rement votre t\u00e2che : le r\u00e9sultat attendu, le contexte, les livrables, les exigences techniques, les contraintes et les crit\u00e8res de r\u00e9ussite. Plus vous \u00eates pr\u00e9cis, mieux la plateforme d\u00e9compose le travail et oriente chaque partie vers le bon agent ou le bon expert humain.",
      descriptionHelp:
        "\u00c9crivez autant que n\u00e9cessaire \u2014 ce n\u2019est pas une invite d\u2019une ligne. Joignez des documents ci-dessous et la plateforme les int\u00e8gre \u00e0 c\u00f4t\u00e9 de votre description.",
      attachments: "Pi\u00e8ces jointes",
      optional: "(facultatif)",
      dropFiles: "D\u00e9posez des fichiers ici ou",
      browse: "parcourez",
      acceptedFiles:
        "Sp\u00e9cifications, briefs, donn\u00e9es, maquettes \u2014 PDF, Word, TXT, Markdown, CSV, JSON et plus. La plateforme en extrait le texte et l\u2019int\u00e8gre \u00e0 votre brief.",
      removeFile: "Retirer {name}",
      budget: { title: "Budget et calendrier", subtitle: "D\u00e9finissez votre fourchette de budget et l\u2019\u00e9ch\u00e9ance." },
      minBudget: "Budget minimum",
      maxBudget: "Budget maximum",
      currency: "Devise",
      deadline: "\u00c9ch\u00e9ance",
      deadlineHelp: "Facultatif. Laissez vide s\u2019il n\u2019y a pas d\u2019\u00e9ch\u00e9ance ferme.",
      autoSelect: "S\u00e9lection automatique des agents",
      autoSelectHelp: "Laissez TaskMatch affecter automatiquement les agents les mieux appari\u00e9s \u00e0 vos t\u00e2ches.",
      requirements: { title: "Exigences", subtitle: "Ajoutez des exigences pr\u00e9cises. Elles aident \u00e0 filtrer et \u00e0 apparier les agents." },
      removeRequirement: "Retirer l\u2019exigence {number}",
      addRequirementLabel: "Ajouter une exigence",
      requirementPlaceholder: "ex. : Python 3.10+",
      addRequirement: "Ajouter l\u2019exigence",
      cancel: "Annuler",
      submit: "Cr\u00e9er la mission",
      phase: { creating: "Cr\u00e9ation\u2026", uploading: "Envoi des documents\u2026", planning: "Planification\u2026" },
      reqType: {
        skill: "Comp\u00e9tence",
        experience: "Exp\u00e9rience",
        certification: "Certification",
        tool: "Outil",
        language: "Langue",
        other: "Autre",
      },
      priority: { low: "Basse", medium: "Moyenne", high: "Haute", critical: "Critique" },
    },
    detail: {
      notFound: "Mission introuvable",
      backToJobs: "Retour aux missions",
      breadcrumbDashboard: "Tableau de bord",
      breadcrumbJobs: "Missions",
      created: "Cr\u00e9\u00e9e le",
      progress: "Avancement de la mission",
      description: "Description",
      summaryTitle: "Synth\u00e8se structur\u00e9e par l\u2019IA",
      summarySubtitle: "D\u00e9composition structur\u00e9e et automatique de vos exigences",
      deliverablesTitle: "Livrables finaux",
      deliverablesSubtitle: "Remises approuv\u00e9es des agents",
      qualityScore: "Score qualit\u00e9 :",
      artifact: "Artefact",
      submitted: "Remis le",
      reviewTitle: "Revue requise",
      reviewBody: "Cette mission attend votre revue. Approuvez le r\u00e9sultat ou demandez une r\u00e9vision.",
      reviewNotesLabel: "Notes de r\u00e9vision (facultatives pour approuver, requises pour une r\u00e9vision)",
      reviewNotesPlaceholder: "Donnez un retour ou des instructions de r\u00e9vision\u2026",
      approve: "Approuver le r\u00e9sultat",
      requestRevision: "Demander une r\u00e9vision",
      budget: "Budget",
      range: "Fourchette",
      used: "Consomm\u00e9",
      currency: "Devise",
      payment: "Paiement",
      status: "Statut",
      totalPaid: "Total pay\u00e9",
      details: "D\u00e9tails",
      deadline: "\u00c9ch\u00e9ance",
      noDeadline: "Aucune \u00e9ch\u00e9ance",
      autoSelect: "S\u00e9lection automatique",
      yes: "Oui",
      no: "Non",
      lastUpdated: "Derni\u00e8re mise \u00e0 jour",
    },
    plan: {
      stage: {
        format: { label: "Mise en forme", desc: "Structuration de votre demande" },
        decompose: { label: "D\u00e9composition", desc: "D\u00e9coupage en t\u00e2ches" },
        match: { label: "Appariement", desc: "Recherche des meilleurs agents" },
        assign: { label: "Affectation", desc: "Attribution des agents aux t\u00e2ches" },
        validate: { label: "Validation", desc: "Contr\u00f4le qualit\u00e9 du travail" },
        pay: { label: "Paiement", desc: "Lib\u00e9ration du paiement apr\u00e8s approbation" },
      },
      title: "Plan d\u2019ex\u00e9cution",
      ready: "Pr\u00eat",
      notSubmitted:
        "Soumettez cette mission pour g\u00e9n\u00e9rer son plan d\u2019ex\u00e9cution. Nous structurerons votre brief, le d\u00e9couperons en t\u00e2ches et confierons chacune \u00e0 un ex\u00e9cutant.",
      submitCta: "Soumettre la mission pour g\u00e9n\u00e9rer le plan",
      loading: "Chargement de votre plan d\u2019ex\u00e9cution\u2026",
      planningTitle: "Nous planifions votre demande\u2026",
      planningBody:
        "Notre couche d\u2019orchestration structure votre brief, le d\u00e9coupe en t\u00e2ches et appartie les ex\u00e9cutants.",
      planningHint: "Cela prend g\u00e9n\u00e9ralement moins d\u2019une minute. Ce panneau se met \u00e0 jour tout seul.",
      subtitle:
        "Voici pr\u00e9cis\u00e9ment comment votre demande sera livr\u00e9e \u2014 les t\u00e2ches issues du brief, qui ex\u00e9cute chacune, et ce que vous payez.",
      escrowReleasedTitle: "Travail accept\u00e9 \u2014 s\u00e9questre lib\u00e9r\u00e9",
      escrowHeldTitle: "Travail livr\u00e9 \u2014 sous s\u00e9questre en attente de votre revue",
      escrowReleasedBody: "{net} vers\u00e9s \u00e0 l\u2019ex\u00e9cutant. Mission termin\u00e9e.",
      escrowHeldBody:
        "{gross} sous s\u00e9questre ({net} pour l\u2019ex\u00e9cutant apr\u00e8s {fee} de frais de plateforme). Examinez les r\u00e9sultats ci-dessous, puis lib\u00e9rez.",
      requestChanges: "Demander des modifications",
      releasing: "Lib\u00e9ration\u2026",
      acceptAndRelease: "Accepter et lib\u00e9rer le paiement",
      completed: "Termin\u00e9e",
      disputePrompt:
        "Qu\u2019est-ce qui manque au livrable ? Votre paiement reste sous s\u00e9questre pendant la r\u00e9vision.",
      disputePlaceholder:
        "ex. : la section 2 ne couvre pas le march\u00e9 europ\u00e9en comme demand\u00e9 ; le ton est trop familier.",
      cancel: "Annuler",
      submitting: "Envoi\u2026",
      submitDispute: "Envoyer le litige et demander une r\u00e9vision",
      briefTitle: "Comment nous avons compris votre brief",
      objective: "Objectif",
      deliverables: "Livrables",
      successCriteria: "Crit\u00e8res de r\u00e9ussite",
      constraints: "Contraintes",
      briefEmpty: "Une synth\u00e8se structur\u00e9e de votre brief appara\u00eetra ici.",
      breakdown: {
        one: "Comment cela se d\u00e9compose \u2014 {count} t\u00e2che et agents appari\u00e9s",
        other: "Comment cela se d\u00e9compose \u2014 {count} t\u00e2ches et agents appari\u00e9s",
      },
      noTasks: "Aucune t\u00e2che n\u2019a \u00e9t\u00e9 g\u00e9n\u00e9r\u00e9e pour cette mission.",
      priority: "Priorit\u00e9",
      revised: "R\u00e9vis\u00e9e",
      revisionCount: "\u00d7{count}",
      matchedAgents: "Agents appari\u00e9s",
      matching: "Appariement des agents \u00e0 cette t\u00e2che\u2026",
      bestMatch: "Meilleur appariement",
      delivered: "Livr\u00e9",
    },
    jobs: {
      title: "Mes missions",
      subtitle: "G\u00e9rez toutes vos missions publi\u00e9es et suivez leur avancement.",
      create: "Cr\u00e9er une mission",
      createFirst: "Cr\u00e9er ma premi\u00e8re mission",
      retry: "R\u00e9essayer",
      found: { one: "{count} mission trouv\u00e9e", other: "{count} missions trouv\u00e9es" },
      emptyTitle: "Aucune mission trouv\u00e9e",
      emptyFiltered: "Aucune mission ne correspond au filtre actuel. Essayez de changer le statut.",
      emptyAll: "Vous n\u2019avez encore cr\u00e9\u00e9 aucune mission. Publiez la premi\u00e8re pour d\u00e9marrer.",
      allStatuses: "Tous les statuts",
      status: {
        draft: "Brouillon",
        pending: "En attente",
        active: "Active",
        in_progress: "En cours",
        client_review: "Revue client",
        completed: "Termin\u00e9e",
        cancelled: "Annul\u00e9e",
      },
      column: {
        title: "Titre",
        status: "Statut",
        budget: "Budget",
        tasks: "T\u00e2ches",
        deadline: "\u00c9ch\u00e9ance",
        created: "Cr\u00e9\u00e9e le",
      },
      page: "Page {page} sur {total}",
      previous: "Pr\u00e9c\u00e9dent",
      next: "Suivant",
    },
    recent: {
      title: "Missions r\u00e9centes",
      subtitle: "Vos 5 derni\u00e8res missions publi\u00e9es",
      viewAll: "Tout voir",
      emptyTitle: "Aucune mission",
      emptyBody: "Cr\u00e9ez votre premi\u00e8re mission pour d\u00e9marrer avec TaskMatch.",
      emptyCta: "Cr\u00e9er une mission",
      taskCount: "{count} t\u00e2ches",
    },
  },

  dashboard: {
    overview: "Vue d\u2019ensemble",
    jobs: "Missions",
    tasks: "T\u00e2ches",
    agents: "Agents",
    bids: "Ench\u00e8res",
    submissions: "Soumissions",
    validations: "Validations",
    payments: "Paiements",
    learning: "Apprentissage",
    audit: "Journal d\u2019audit",
    loading: "Chargement\u2026",
    empty: "Rien \u00e0 afficher pour le moment.",
    error: "Une erreur est survenue. Veuillez r\u00e9essayer.",
    loadErrorTitle: "Impossible de charger ces donn\u00e9es",
    loadErrorBody:
      "La requ\u00eate au serveur a \u00e9chou\u00e9. La page n'affiche rien plut\u00f4t que des donn\u00e9es qui pourraient \u00eatre fausses.",
    retry: "R\u00e9essayer",
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
  /*  Devis \u2014 TaskMatch fixe le prix, le client l\u2019approuve                  */
  /* ------------------------------------------------------------------------ */
  quote: {
    title: "Votre devis",
    subtitle:
      "TaskMatch fixe le prix de chaque t\u00e2che \u2014 vous n\u2019ench\u00e9rissez pas sur une place de march\u00e9. Rien n\u2019est ex\u00e9cut\u00e9 ni factur\u00e9 tant que vous n\u2019avez pas approuv\u00e9.",
    pricingInProgress: "Estimation de votre demande en cours \u2014 quelques secondes.",
    pricingHint:
      "TaskMatch fixe un prix par t\u00e2che. Rien ne d\u00e9marre avant votre approbation.",
    totalLabel: "Total",
    totalBreakdown: "Dont",
    platformFee: "de commission plateforme",
    humanEquivalent: "\u00c9quivalent expert humain",
    savings: "Vous \u00e9conomisez",
    validUntil: "Valable jusqu\u2019au",
    perTask: "Prix par t\u00e2che",
    routeLlm: "Agent IA",
    routeHuman: "Expert humain",
    routeHybrid: "IA + relecture humaine",
    tokenCost: "Co\u00fbt tokens",
    compute: "Calcul",
    orchestration: "Orchestration",
    validation: "Validation",
    expertRange: "Fourchette propos\u00e9e aux experts :",
    humanWouldCost: "Un expert humain co\u00fbterait :",
    hoursShort: " h",
    gateNotice:
      "L\u2019approbation lance l\u2019ex\u00e9cution et place le montant sous s\u00e9questre. Il n\u2019est vers\u00e9 que contre une livraison valid\u00e9e.",
    accept: "Approuver et lancer",
    accepting: "Approbation\u2026",
    decline: "Refuser",
    rejecting: "Refus\u2026",
    confirmReject: "Confirmer le refus",
    cancel: "Annuler",
    rejectPrompt: "Qu\u2019est-ce qui ne convient pas dans ce prix ?",
    statusAccepted: "Approuv\u00e9",
    statusRejected: "Refus\u00e9",
    statusExpired: "Expir\u00e9",
    acceptedNotice: "Devis approuv\u00e9 \u2014 l\u2019ex\u00e9cution a commenc\u00e9.",
    rejectedReason: "Motif indiqu\u00e9 :",
    requoteHint:
      "Ajustez votre brief ou le mode de livraison, puis demandez un nouveau devis.",
    errorLoad: "Impossible de charger le devis.",
    errorAccept: "Impossible d\u2019accepter le devis. Merci de r\u00e9essayer.",
    errorReject: "Impossible de refuser le devis. Merci de r\u00e9essayer.",
  },

  /* ------------------------------------------------------------------------ */
  /*  Livraison et remise                                                     */
  /* ------------------------------------------------------------------------ */
  delivery: {
    title: "Livraison et remise",
    subtitle:
      "Comment le travail fini vous parvient \u2014 un document, un d\u00e9p\u00f4t, ou une installation sur votre propre infrastructure.",
    loading: "Chargement du plan de livraison\u2026",
    signedOff: "R\u00e9ceptionn\u00e9",
    modeTitle: "Mode de livraison",
    mode: {
      document: "Document",
      repository: "D\u00e9p\u00f4t",
      dataset: "Jeu de donn\u00e9es",
      installation: "Installation",
      hosted: "H\u00e9berg\u00e9",
    },
    requirements: "Ce dont nous avons besoin de votre part",
    requoteNotice:
      "Changer le mode de livraison change le travail \u00e0 fournir. Demandez un nouveau devis pour que le prix corresponde.",
    accessTitle: "Acc\u00e8s et identifiants",
    accessHelp:
      "Chiffr\u00e9s au repos, r\u00e9v\u00e9l\u00e9s un nombre limit\u00e9 de fois, chaque acc\u00e8s trac\u00e9, et r\u00e9voqu\u00e9s automatiquement \u00e0 la r\u00e9ception.",
    vaultUnavailable:
      "Le coffre d\u2019identifiants n\u2019est pas configur\u00e9 sur cet environnement : aucun acc\u00e8s ne peut \u00eatre stock\u00e9. Contactez votre administrateur.",
    addGrant: "Partager un acc\u00e8s",
    grantLabel: "\u00c0 quoi il sert",
    grantSecret: "Identifiant",
    store: "Stocker en s\u00e9curit\u00e9",
    reveal: "R\u00e9v\u00e9ler",
    reveals: "r\u00e9v\u00e9lations",
    revoke: "R\u00e9voquer",
    grantRevoked: "R\u00e9voqu\u00e9",
    grantExpired: "Expir\u00e9",
    signOffHelp:
      "Confirmez la bonne r\u00e9ception. Tous les acc\u00e8s que vous avez partag\u00e9s sont r\u00e9voqu\u00e9s imm\u00e9diatement.",
    signOffAction: "Confirmer la r\u00e9ception",
    errorUpdate: "Impossible de modifier le mode de livraison.",
    errorGrant: "Impossible d\u2019enregistrer l\u2019acc\u00e8s.",
    errorReveal: "Cet acc\u00e8s ne peut plus \u00eatre r\u00e9v\u00e9l\u00e9.",
    errorRevoke: "Impossible de r\u00e9voquer l\u2019acc\u00e8s.",
    errorSignOff: "Impossible de confirmer la r\u00e9ception.",
  },

} as const;

export default fr;
