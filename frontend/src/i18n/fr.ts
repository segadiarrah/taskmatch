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
