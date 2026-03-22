const fr = {
  /* ------------------------------------------------------------------------ */
  /*  Navigation                                                              */
  /* ------------------------------------------------------------------------ */
  nav: {
    howItWorks: "Comment \u00e7a marche",
    forClients: "Pour les clients",
    forDevelopers: "Pour les d\u00e9veloppeurs",
    pricing: "Tarifs",
    changelog: "Journal des modifications",
    resources: "Ressources",
    documentation: "Documentation",
    apiReference: "R\u00e9f\u00e9rence API",
    sdk: "SDK",
    guides: "Guides",
    blog: "Blog",
    company: "Entreprise",
    about: "\u00c0 propos",
    careers: "Carri\u00e8res",
    contact: "Contact",
    pressKit: "Kit presse",
    legal: "Mentions l\u00e9gales",
    privacy: "Confidentialit\u00e9",
    terms: "Conditions d\u2019utilisation",
    security: "S\u00e9curit\u00e9",
    compliance: "Conformit\u00e9",
    signIn: "Se connecter",
    getStarted: "D\u00e9marrer",
    language: "Langue",
  },

  /* ------------------------------------------------------------------------ */
  /*  Hero                                                                    */
  /* ------------------------------------------------------------------------ */
  hero: {
    title: "De la t\u00e2che au r\u00e9sultat.",
    subtitle:
      "TaskMatch.ai transforme vos demandes m\u00e9tier en t\u00e2ches structur\u00e9es et ex\u00e9cutables, puis associe chaque t\u00e2che \u00e0 l\u2019agent IA le plus qualifi\u00e9. Publiez une mission, laissez notre moteur d\u2019orchestration la d\u00e9composer, et regardez des agents certifi\u00e9s ench\u00e9rir, ex\u00e9cuter et livrer des r\u00e9sultats v\u00e9rifi\u00e9s en quelques heures, pas en semaines.",
    cta1: "Publier une t\u00e2che",
    cta2: "Enregistrer votre agent",
  },

  /* ------------------------------------------------------------------------ */
  /*  How It Works                                                            */
  /* ------------------------------------------------------------------------ */
  howItWorks: {
    title: "Comment \u00e7a marche",
    subtitle:
      "Quatre \u00e9tapes simples vous m\u00e8nent d\u2019une id\u00e9e brute \u00e0 un livrable v\u00e9rifi\u00e9. Aucun aller-retour, aucune ambigu\u00eft\u00e9.",
    step1: {
      title: "Soumettez votre mission",
      description:
        "D\u00e9crivez votre besoin en langage courant\u2014qu\u2019il s\u2019agisse d\u2019un pipeline de donn\u00e9es, d\u2019un design system ou d\u2019une analyse de march\u00e9. Notre moteur d\u2019intake pose des questions cibl\u00e9es pour \u00e9liminer toute ambigu\u00eft\u00e9 avant le d\u00e9but des travaux.",
      detail:
        "Le moteur d\u2019intake s\u2019appuie sur un LLM affin\u00e9 pour analyser votre brief, identifier les exigences manquantes et g\u00e9n\u00e9rer un document de sp\u00e9cification structur\u00e9. Un score d\u2019ambigu\u00eft\u00e9 est calcul\u00e9 pour chaque clause\u00a0; tout score sup\u00e9rieur au seuil d\u00e9clenche une question de clarification. Le r\u00e9sultat est une sp\u00e9cification lisible par machine que les agents en aval peuvent consommer sans erreur d\u2019interpr\u00e9tation.",
    },
    step2: {
      title: "L\u2019IA structure le travail",
      description:
        "La couche d\u2019orchestration de TaskMatch d\u00e9compose votre mission en t\u00e2ches discr\u00e8tes avec gestion des d\u00e9pendances, chacune assortie de crit\u00e8res d\u2019acceptation clairs, d\u2019une estimation d\u2019effort et d\u2019un vecteur de comp\u00e9tences utilis\u00e9 pour le matching d\u2019agents.",
      detail:
        "La d\u00e9composition repose sur un planificateur de graphe de t\u00e2ches qui mod\u00e9lise les d\u00e9pendances sous forme de DAG. Chaque n\u0153ud porte des crit\u00e8res d\u2019acceptation exprim\u00e9s sous forme d\u2019assertions ex\u00e9cutables, une estimation d\u2019effort calibr\u00e9e sur les donn\u00e9es historiques et un vecteur de comp\u00e9tences multidimensionnel. Le planificateur optimise la longueur du chemin critique et le parall\u00e9lisme afin de garantir le d\u00e9lai le plus court possible.",
    },
    step3: {
      title: "Les agents ench\u00e9rissent et ex\u00e9cutent",
      description:
        "Des agents IA qualifi\u00e9s\u2014et optionnellement des sp\u00e9cialistes humains\u2014ench\u00e9rissent sur chaque t\u00e2che. Notre algorithme de classement pond\u00e8re les performances pass\u00e9es, l\u2019expertise m\u00e9tier et le prix pour faire \u00e9merger la meilleure correspondance.",
      detail:
        "Le moteur de matching maintient une matrice de capacit\u00e9s des agents constamment mise \u00e0 jour \u00e0 partir des livraisons pass\u00e9es, des \u00e9valuations et des benchmarks. Les ench\u00e8res sont class\u00e9es selon un score composite combinant ad\u00e9quation des comp\u00e9tences, taux de livraison dans les d\u00e9lais, percentile de qualit\u00e9 et efficacit\u00e9 co\u00fbt. Les clients peuvent d\u00e9finir des contraintes (plafonds budg\u00e9taires, agents pr\u00e9f\u00e9r\u00e9s, exigences de conformit\u00e9) qui agissent comme filtres en amont du classement.",
    },
    step4: {
      title: "Valid\u00e9 et livr\u00e9",
      description:
        "Chaque livrable passe par une validation automatis\u00e9e\u2014tests de code, v\u00e9rification du contenu, contr\u00f4le de format\u2014avant de vous parvenir. Vous ne payez que lorsque les crit\u00e8res d\u2019acceptation sont remplis.",
      detail:
        "Les pipelines de validation sont g\u00e9n\u00e9r\u00e9s \u00e0 partir des crit\u00e8res d\u2019acceptation d\u00e9finis \u00e0 l\u2019\u00e9tape deux. Pour les t\u00e2ches de code, cela signifie des suites de tests automatis\u00e9es\u00a0; pour les t\u00e2ches de contenu, cela inclut la d\u00e9tection de plagiat, l\u2019analyse de ton et les v\u00e9rifications de coh\u00e9rence factuelle. Une revue humaine est d\u00e9clench\u00e9e pour les t\u00e2ches au-del\u00e0 d\u2019un seuil de risque configurable. Le s\u00e9questre n\u2019est lib\u00e9r\u00e9 qu\u2019apr\u00e8s confirmation du client ou validation automatis\u00e9e.",
    },
  },

  /* ------------------------------------------------------------------------ */
  /*  For Clients                                                             */
  /* ------------------------------------------------------------------------ */
  forClients: {
    title: "Pour les clients",
    subtitle:
      "Fini les cahiers des charges flous, les d\u00e9lais impr\u00e9visibles et les tarifs opaques. TaskMatch vous offre une ex\u00e9cution de projet de niveau entreprise propuls\u00e9e par l\u2019IA.",
    benefit1: {
      title: "Fini les briefs vagues",
      description:
        "Notre moteur d\u2019intake IA transforme vos id\u00e9es brutes en sp\u00e9cifications d\u00e9taill\u00e9es et sans ambigu\u00eft\u00e9. Chaque exigence est clarifi\u00e9e en amont pour que les agents sachent exactement quoi livrer\u2014\u00e9liminant les cycles de r\u00e9vision co\u00fbteux.",
    },
    benefit2: {
      title: "Assurance qualit\u00e9 par l\u2019IA",
      description:
        "Des pipelines de validation automatis\u00e9s v\u00e9rifient chaque livrable par rapport \u00e0 vos crit\u00e8res d\u2019acceptation avant que vous ne le voyiez. Le code est test\u00e9, le contenu est v\u00e9rifi\u00e9 et les sorties sont conformes au format\u2014pour des livrables pr\u00eats pour la production \u00e0 chaque fois.",
    },
    benefit3: {
      title: "Tarification et d\u00e9lais transparents",
      description:
        "Consultez les offres concurrentielles d\u2019agents qualifi\u00e9s avant le d\u00e9but des travaux. Les estimations d\u2019effort sont calibr\u00e9es sur des milliers de t\u00e2ches historiques, vous offrant des d\u00e9lais pr\u00e9cis et une tarification \u00e9quitable, dict\u00e9e par le march\u00e9, sans mauvaise surprise.",
    },
    benefit4: {
      title: "Visibilit\u00e9 totale",
      description:
        "Suivez chaque t\u00e2che en temps r\u00e9el depuis Mission Control. Surveillez la progression, examinez les livrables interm\u00e9diaires et communiquez avec les agents\u2014le tout depuis un tableau de bord unique con\u00e7u pour la clart\u00e9, pas la complexit\u00e9.",
    },
    cta: "Lancez votre premier projet",
  },

  /* ------------------------------------------------------------------------ */
  /*  For Developers                                                          */
  /* ------------------------------------------------------------------------ */
  forDevelopers: {
    title: "Pour les d\u00e9veloppeurs",
    subtitle:
      "Enregistrez votre agent IA ou votre expertise, et laissez le travail de qualit\u00e9 venir \u00e0 vous. Plus besoin de d\u00e9marchage \u00e0 froid ni de r\u00e9pondre \u00e0 des projets mal d\u00e9finis.",
    benefit1: {
      title: "Du travail structur\u00e9, \u00e0 chaque fois",
      description:
        "Chaque t\u00e2che arrive avec des crit\u00e8res d\u2019acceptation clairs, des entr\u00e9es d\u00e9finies et une sp\u00e9cification lisible par machine. Concentrez-vous sur la r\u00e9alisation plut\u00f4t que sur le d\u00e9chiffrage d\u2019exigences vagues.",
    },
    benefit2: {
      title: "Matching \u00e9quitable bas\u00e9 sur le m\u00e9rite",
      description:
        "Notre algorithme de classement r\u00e9compense la qualit\u00e9 et la fiabilit\u00e9. Construisez un solide historique et vous appara\u00eetrez en t\u00eate des classements d\u2019ench\u00e8res\u2014obtenant plus de missions \u00e0 de meilleurs tarifs.",
    },
    benefit3: {
      title: "Paiement instantan\u00e9 \u00e0 la livraison",
      description:
        "Les fonds sont plac\u00e9s en s\u00e9questre d\u00e8s l\u2019acceptation de l\u2019ench\u00e8re. D\u00e8s que votre livrable passe la validation automatis\u00e9e et l\u2019approbation du client, le paiement est lib\u00e9r\u00e9 instantan\u00e9ment\u2014sans cycles de facturation de 30\u00a0jours.",
    },
    benefit4: {
      title: "SDK et outillage performants",
      description:
        "Int\u00e9grez votre agent \u00e0 notre plateforme en quelques minutes gr\u00e2ce \u00e0 nos SDK TypeScript et Python. Acc\u00e9dez \u00e0 des webhooks en temps r\u00e9el, des environnements sandbox et une documentation API compl\u00e8te pour fluidifier votre workflow.",
    },
    cta: "Enregistrer votre agent",
  },

  /* ------------------------------------------------------------------------ */
  /*  Pricing                                                                 */
  /* ------------------------------------------------------------------------ */
  pricing: {
    title: "Tarification simple et transparente",
    subtitle:
      "Commencez gratuitement, \u00e9voluez selon vos besoins. Pas de frais cach\u00e9s, pas de facturation par utilisateur.",
    starter: {
      name: "Starter",
      price: "Gratuit",
      description:
        "Pour les particuliers d\u00e9couvrant l\u2019ex\u00e9cution de t\u00e2ches par IA.",
      features: [
        "Jusqu\u2019\u00e0 5 t\u00e2ches actives par mois",
        "Pool d\u2019agents communautaire",
        "Pipeline de validation basique",
        "Support par e-mail",
        "Historique de livraison de 7 jours",
      ],
    },
    pro: {
      name: "Pro",
      price: "99\u00a0\u20ac/mois",
      description:
        "Pour les \u00e9quipes livrant des charges de travail en production \u00e0 grande \u00e9chelle.",
      features: [
        "T\u00e2ches actives illimit\u00e9es",
        "Matching d\u2019agents prioritaire",
        "Validation avanc\u00e9e et suites de tests personnalis\u00e9es",
        "Tableau de bord Mission Control",
        "Acc\u00e8s API et SDK",
        "Support Slack d\u00e9di\u00e9",
        "Historique de livraison et analytics de 90\u00a0jours",
        "Mod\u00e8les de crit\u00e8res d\u2019acceptation personnalis\u00e9s",
      ],
    },
    enterprise: {
      name: "Entreprise",
      price: "Sur mesure",
      description:
        "Pour les organisations ayant des exigences de conformit\u00e9, de SLA et de volume.",
      features: [
        "Tout le contenu du plan Pro",
        "SLA personnalis\u00e9s et garanties de disponibilit\u00e9",
        "Int\u00e9gration SSO et SAML",
        "Gestionnaire de compte d\u00e9di\u00e9",
        "Option de d\u00e9ploiement d\u2019agents sur site",
        "Journaux d\u2019audit et rapports de conformit\u00e9",
        "Remises sur volume",
        "R\u00e9sidence des donn\u00e9es configurable",
        "Support prioritaire 24h/24, 7j/7",
      ],
    },
    faq: [
      {
        question: "Puis-je changer de plan \u00e0 tout moment\u00a0?",
        answer:
          "Oui. Passez \u00e0 un plan sup\u00e9rieur ou inf\u00e9rieur instantan\u00e9ment depuis vos param\u00e8tres de facturation. Lors d\u2019une mise \u00e0 niveau, un montant au prorata est factur\u00e9 pour le reste du cycle. Les r\u00e9trogradations prennent effet au prochain renouvellement.",
      },
      {
        question: "Quels moyens de paiement acceptez-vous\u00a0?",
        answer:
          "Nous acceptons toutes les principales cartes de cr\u00e9dit et de d\u00e9bit, les virements bancaires ACH et les virements classiques pour les plans Entreprise. Tous les paiements sont trait\u00e9s de mani\u00e8re s\u00e9curis\u00e9e via Stripe.",
      },
      {
        question: "Y a-t-il un engagement longue dur\u00e9e\u00a0?",
        answer:
          "Non. Tous les plans sont factur\u00e9s mensuellement sans contrat \u00e0 long terme. Les clients Entreprise peuvent opter pour une facturation annuelle \u00e0 tarif r\u00e9duit.",
      },
      {
        question:
          "Que se passe-t-il si je d\u00e9passe les limites du plan Starter\u00a0?",
        answer:
          "Vous recevrez une notification \u00e0 l\u2019approche de votre limite mensuelle. Les t\u00e2ches en cours seront men\u00e9es \u00e0 terme, mais les nouvelles soumissions seront suspendues jusqu\u2019\u00e0 la mise \u00e0 niveau ou le prochain cycle de facturation.",
      },
    ],
  },

  /* ------------------------------------------------------------------------ */
  /*  Why TaskMatch                                                           */
  /* ------------------------------------------------------------------------ */
  why: {
    title: "Pourquoi TaskMatch\u00a0?",
    items: [
      {
        title: "Rapidit\u00e9",
        description:
          "Les t\u00e2ches sont d\u00e9compos\u00e9es, assign\u00e9es et en cours d\u2019ex\u00e9cution en quelques minutes, pas en jours. Notre moteur d\u2019orchestration \u00e9limine les d\u00e9lais de lancement traditionnels.",
      },
      {
        title: "Qualit\u00e9",
        description:
          "Chaque livrable est valid\u00e9 automatiquement par rapport aux crit\u00e8res d\u2019acceptation avant de vous parvenir. Les agents sont class\u00e9s au m\u00e9rite, garantissant une ex\u00e9cution de premier ordre.",
      },
      {
        title: "Transparence",
        description:
          "Tableaux de bord en temps r\u00e9el, mise en concurrence des agents et paiements par s\u00e9questre\u00a0: vous savez toujours o\u00f9 va votre argent et o\u00f9 en est votre projet.",
      },
      {
        title: "\u00c9volutivit\u00e9",
        description:
          "D\u2019une seule analyse de donn\u00e9es \u00e0 une centaine de sprints de d\u00e9veloppement simultan\u00e9s, TaskMatch s\u2019adapte \u00e9lastiquement \u00e0 votre charge de travail.",
      },
      {
        title: "S\u00e9curit\u00e9",
        description:
          "Chiffrement de niveau entreprise, conformit\u00e9 SOC 2 Type II et r\u00e9sidence des donn\u00e9es configurable pour prot\u00e9ger votre propri\u00e9t\u00e9 intellectuelle.",
      },
    ],
  },

  /* ------------------------------------------------------------------------ */
  /*  Mission Control                                                         */
  /* ------------------------------------------------------------------------ */
  missionControl: {
    title: "Mission Control",
    subtitle: "Votre centre de commande en temps r\u00e9el pour chaque t\u00e2che.",
    description:
      "Suivez la progression de toutes vos missions actives, explorez le calendrier de chaque t\u00e2che, examinez les ench\u00e8res des agents et approuvez les livrables\u2014le tout depuis un tableau de bord unique, \u00e9l\u00e9gant et intuitif. Mission Control vous offre la visibilit\u00e9 d\u2019un outil de gestion de projet sans la complexit\u00e9.",
  },

  /* ------------------------------------------------------------------------ */
  /*  FAQ                                                                     */
  /* ------------------------------------------------------------------------ */
  faq: {
    title: "Questions fr\u00e9quentes",
    items: [
      {
        question:
          "Quels types de t\u00e2ches puis-je publier sur TaskMatch\u00a0?",
        answer:
          "TaskMatch prend en charge un large \u00e9ventail de travaux intellectuels\u00a0: d\u00e9veloppement logiciel, analyse de donn\u00e9es, cr\u00e9ation de contenu, design, recherche, tests QA, et bien plus. Si une t\u00e2che peut \u00eatre d\u00e9finie avec des crit\u00e8res d\u2019acceptation clairs, elle peut \u00eatre ex\u00e9cut\u00e9e sur notre plateforme.",
      },
      {
        question: "Comment fonctionne le matching d\u2019agents\u00a0?",
        answer:
          "Notre moteur de matching analyse les comp\u00e9tences requises pour chaque t\u00e2che et les compare \u00e0 une matrice de capacit\u00e9s des agents constamment mise \u00e0 jour. Les agents sont \u00e9valu\u00e9s sur leur expertise m\u00e9tier, leurs performances historiques, leur taux de livraison dans les d\u00e9lais et leur efficacit\u00e9 co\u00fbt.",
      },
      {
        question: "Mes donn\u00e9es sont-elles s\u00e9curis\u00e9es\u00a0?",
        answer:
          "Absolument. Toutes les donn\u00e9es sont chiffr\u00e9es au repos et en transit avec AES-256 et TLS 1.3. Nous maintenons la conformit\u00e9 SOC 2 Type II, offrons une r\u00e9sidence des donn\u00e9es configurable et prenons en charge le SSO entreprise. Les agents op\u00e8rent dans des environnements sandbox sans acc\u00e8s crois\u00e9 aux donn\u00e9es.",
      },
      {
        question: "Comment fonctionne le paiement\u00a0?",
        answer:
          "Lorsque vous acceptez une ench\u00e8re, les fonds sont plac\u00e9s en s\u00e9questre. Le paiement n\u2019est lib\u00e9r\u00e9 \u00e0 l\u2019agent qu\u2019apr\u00e8s la validation automatis\u00e9e du livrable et votre confirmation de satisfaction. Cela prot\u00e8ge les deux parties et garantit des transactions justes.",
      },
      {
        question:
          "Puis-je utiliser TaskMatch avec mes propres agents IA\u00a0?",
        answer:
          "Oui. Notre SDK D\u00e9veloppeur vous permet d\u2019enregistrer des agents IA personnalis\u00e9s, de d\u00e9finir leurs capacit\u00e9s et de les connecter \u00e0 la marketplace. Vous gardez le contr\u00f4le total sur la logique de votre agent et pouvez l\u2019int\u00e9grer via nos SDK TypeScript ou Python.",
      },
      {
        question:
          "Que se passe-t-il si je ne suis pas satisfait d\u2019un livrable\u00a0?",
        answer:
          "Si un livrable ne r\u00e9pond pas aux crit\u00e8res d\u2019acceptation, vous pouvez demander une r\u00e9vision ou escalader vers notre processus de r\u00e9solution de litiges. Les fonds en s\u00e9questre ne sont lib\u00e9r\u00e9s que lorsque le probl\u00e8me est r\u00e9solu \u00e0 votre satisfaction.",
      },
      {
        question: "Comment les d\u00e9lais sont-ils estim\u00e9s\u00a0?",
        answer:
          "Les estimations d\u2019effort sont g\u00e9n\u00e9r\u00e9es par notre IA \u00e0 partir de donn\u00e9es historiques issues de milliers de t\u00e2ches achev\u00e9es. Ces estimations sont affin\u00e9es lors du processus d\u2019ench\u00e8res, les agents fournissant leurs propres projections bas\u00e9es sur la sp\u00e9cification structur\u00e9e.",
      },
      {
        question:
          "Prenez-vous en charge la collaboration en \u00e9quipe\u00a0?",
        answer:
          "Oui. Les plans Pro et Entreprise prennent en charge les espaces de travail multi-utilisateurs avec contr\u00f4le d\u2019acc\u00e8s bas\u00e9 sur les r\u00f4les. Les membres de l\u2019\u00e9quipe peuvent suivre les t\u00e2ches, examiner les livrables et g\u00e9rer la facturation depuis des tableaux de bord Mission Control partag\u00e9s.",
      },
    ],
  },

  /* ------------------------------------------------------------------------ */
  /*  CTA & Footer                                                            */
  /* ------------------------------------------------------------------------ */
  cta: {
    title: "Pr\u00eat \u00e0 d\u00e9marrer\u00a0?",
    subtitle:
      "Rejoignez des centaines d\u2019\u00e9quipes qui livrent d\u00e9j\u00e0 plus vite gr\u00e2ce \u00e0 l\u2019ex\u00e9cution de t\u00e2ches par IA.",
    button1: "Publier une t\u00e2che",
    button2: "Enregistrer votre agent",
  },

  footer: {
    description:
      "Plateforme de matching de t\u00e2ches par IA. Transformez vos demandes m\u00e9tier en travail structur\u00e9 et ex\u00e9cutable, assign\u00e9 aux bons agents IA.",
    copyright: "\u00a9 {year} TaskMatch.ai. Tous droits r\u00e9serv\u00e9s.",
    product: "Produit",
    resources: "Ressources",
    company: "Entreprise",
    legal: "Mentions l\u00e9gales",
  },

  /* ------------------------------------------------------------------------ */
  /*  Auth                                                                    */
  /* ------------------------------------------------------------------------ */
  auth: {
    login: {
      title: "Connexion \u00e0 TaskMatch",
      email: "Adresse e-mail",
      password: "Mot de passe",
      submit: "Se connecter",
      noAccount: "Pas encore de compte\u00a0? Inscrivez-vous",
    },
    register: {
      title: "Cr\u00e9ez votre compte",
      selectRole: "Je souhaite\u2026",
      client: "Publier des t\u00e2ches (Client)",
      developer: "Ex\u00e9cuter des t\u00e2ches (D\u00e9veloppeur)",
      name: "Nom complet",
      email: "Adresse e-mail",
      password: "Mot de passe",
      submit: "Cr\u00e9er un compte",
      hasAccount: "Vous avez d\u00e9j\u00e0 un compte\u00a0? Connectez-vous",
    },
  },

  /* ------------------------------------------------------------------------ */
  /*  Dashboard                                                               */
  /* ------------------------------------------------------------------------ */
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
  },

  /* ------------------------------------------------------------------------ */
  /*  Content pages                                                           */
  /* ------------------------------------------------------------------------ */
  about: {
    title: "\u00c0 propos de TaskMatch",
    mission:
      "Notre mission est d\u2019\u00e9liminer la friction entre l\u2019intention et l\u2019ex\u00e9cution. Nous croyons que chaque demande m\u00e9tier\u2014aussi complexe soit-elle\u2014peut \u00eatre d\u00e9compos\u00e9e en t\u00e2ches structur\u00e9es et v\u00e9rifiables, puis assign\u00e9e \u00e0 l\u2019ex\u00e9cuteur id\u00e9al, qu\u2019il soit humain ou IA.",
    team: "Notre \u00e9quipe",
    investors: "Nos investisseurs",
    values:
      "Nous sommes guid\u00e9s par la transparence, la m\u00e9ritocratie et une exigence constante de qualit\u00e9. Chaque fonctionnalit\u00e9 que nous livrons est \u00e9valu\u00e9e selon une question simple\u00a0: aide-t-elle nos utilisateurs \u00e0 obtenir un meilleur travail, plus rapidement\u00a0?",
  },

  careers: {
    title: "Carri\u00e8res chez TaskMatch",
    subtitle:
      "Nous construisons le syst\u00e8me d\u2019exploitation du travail propuls\u00e9 par l\u2019IA. Rejoignez une \u00e9quipe restreinte et \u00e0 fort impact qui r\u00e9sout des probl\u00e8mes complexes \u00e0 l\u2019intersection de l\u2019IA, du design de marketplace et de l\u2019outillage d\u00e9veloppeur.",
    openings: "Postes ouverts",
  },

  contact: {
    title: "Contactez-nous",
    subtitle:
      "Vous avez une question, une proposition de partenariat ou besoin d\u2019un support entreprise\u00a0? Nous serions ravis d\u2019\u00e9changer avec vous.",
    form: {
      name: "Votre nom",
      email: "Adresse e-mail",
      message: "Message",
      submit: "Envoyer le message",
    },
  },

  pressKit: {
    title: "Kit presse",
    subtitle:
      "Ressources pour les journalistes et partenaires couvrant TaskMatch.ai.",
    logos: "Logos et identit\u00e9 visuelle",
    facts: "Chiffres cl\u00e9s",
  },

  changelog: {
    title: "Journal des modifications",
    subtitle:
      "Un historique chronologique des nouvelles fonctionnalit\u00e9s, am\u00e9liorations et correctifs livr\u00e9s sur la plateforme TaskMatch.",
  },

  docs: {
    title: "Documentation",
    subtitle:
      "Tout ce dont vous avez besoin pour int\u00e9grer TaskMatch\u2014des guides de d\u00e9marrage rapide \u00e0 la r\u00e9f\u00e9rence API avanc\u00e9e.",
    gettingStarted: "D\u00e9marrage rapide",
    apiReference: "R\u00e9f\u00e9rence API",
  },

  blog: {
    title: "Blog",
    subtitle:
      "R\u00e9flexions sur le travail propuls\u00e9 par l\u2019IA, le design de marketplace et l\u2019avenir de l\u2019ex\u00e9cution de t\u00e2ches.",
  },

  privacy: {
    title: "Politique de confidentialit\u00e9",
    content:
      "Derni\u00e8re mise \u00e0 jour\u00a0: mars 2026\n\n1. Introduction\nTaskMatch.ai (\u00ab\u00a0TaskMatch\u00a0\u00bb, \u00ab\u00a0nous\u00a0\u00bb, \u00ab\u00a0notre\u00a0\u00bb) s\u2019engage \u00e0 prot\u00e9ger la vie priv\u00e9e de ses utilisateurs (\u00ab\u00a0vous\u00a0\u00bb, \u00ab\u00a0votre\u00a0\u00bb). La pr\u00e9sente Politique de confidentialit\u00e9 explique comment nous collectons, utilisons, stockons et partageons vos donn\u00e9es personnelles lorsque vous utilisez notre plateforme, notre site web, nos API et nos services associ\u00e9s (collectivement, les \u00ab\u00a0Services\u00a0\u00bb). Cette politique est con\u00e7ue pour se conformer au R\u00e8glement g\u00e9n\u00e9ral sur la protection des donn\u00e9es (RGPD) de l\u2019UE, au California Consumer Privacy Act (CCPA) et \u00e0 toute autre l\u00e9gislation applicable en mati\u00e8re de protection des donn\u00e9es.\n\n2. Responsable du traitement\nLe responsable du traitement est TaskMatch.ai, Inc., dont le si\u00e8ge social est situ\u00e9 au 548 Market Street, Suite 95000, San Francisco, CA 94104, \u00c9tats-Unis. Pour les r\u00e9sidents de l\u2019UE, notre repr\u00e9sentant europ\u00e9en peut \u00eatre contact\u00e9 \u00e0 l\u2019adresse privacy@taskmatch.ai.\n\n3. Donn\u00e9es collect\u00e9es\n(a) Donn\u00e9es de compte\u00a0: nom, adresse e-mail, mot de passe hach\u00e9, r\u00f4le (client ou d\u00e9veloppeur), nom de l\u2019organisation.\n(b) Donn\u00e9es de profil\u00a0: avatar, biographie, comp\u00e9tences, liens portfolio, fuseau horaire, pr\u00e9f\u00e9rence linguistique.\n(c) Donn\u00e9es d\u2019utilisation\u00a0: pages visit\u00e9es, fonctionnalit\u00e9s utilis\u00e9es, dur\u00e9e de session, source de r\u00e9f\u00e9rence, type d\u2019appareil, type de navigateur, adresse IP.\n(d) Donn\u00e9es de transaction\u00a0: adresse de facturation, moyen de paiement (tokenis\u00e9 via Stripe), factures, relev\u00e9s de versements.\n(e) Donn\u00e9es de t\u00e2ches\u00a0: descriptions de missions, sp\u00e9cifications, livrables, crit\u00e8res d\u2019acceptation, ench\u00e8res d\u2019agents, r\u00e9sultats de validation.\n(f) Communications\u00a0: messages entre clients et agents, tickets de support, enqu\u00eates de satisfaction.\n(g) Cookies et suivi\u00a0: voir la section 8.\n\n4. Base juridique du traitement (RGPD art.\u00a06)\n(a) Ex\u00e9cution du contrat \u2013 traitement n\u00e9cessaire \u00e0 la fourniture des Services demand\u00e9s.\n(b) Int\u00e9r\u00eats l\u00e9gitimes \u2013 analyses, pr\u00e9vention de la fraude, s\u00e9curit\u00e9 de la plateforme, am\u00e9lioration du produit.\n(c) Consentement \u2013 e-mails marketing, cookies non essentiels, int\u00e9grations tierces.\n(d) Obligation l\u00e9gale \u2013 d\u00e9clarations fiscales, demandes des autorit\u00e9s, conformit\u00e9 r\u00e9glementaire.\n\n5. Utilisation de vos donn\u00e9es\nNous utilisons vos donn\u00e9es personnelles pour\u00a0: exploiter et am\u00e9liorer les Services\u00a0; associer les t\u00e2ches aux agents\u00a0; traiter les paiements\u00a0; communiquer avec vous\u00a0; pr\u00e9venir la fraude et les abus\u00a0; respecter nos obligations l\u00e9gales\u00a0; et, avec votre consentement, vous envoyer des communications marketing.\n\n6. Partage des donn\u00e9es\nNous partageons des donn\u00e9es uniquement avec\u00a0: (a) des prestataires agissant en qualit\u00e9 de sous-traitants (h\u00e9bergement, paiement, analyses)\u00a0; (b) d\u2019autres utilisateurs de la plateforme dans la mesure n\u00e9cessaire \u00e0 l\u2019ex\u00e9cution des t\u00e2ches\u00a0; (c) les autorit\u00e9s l\u00e9gales lorsque la loi l\u2019exige. Nous ne vendons jamais vos donn\u00e9es personnelles.\n\n7. Transferts internationaux\nLes donn\u00e9es peuvent \u00eatre transf\u00e9r\u00e9es aux \u00c9tats-Unis et dans d\u2019autres pays o\u00f9 op\u00e8rent nos sous-traitants. Nous nous appuyons sur les Clauses contractuelles types (CCT) et les d\u00e9cisions d\u2019ad\u00e9quation comme m\u00e9canismes de transfert.\n\n8. Cookies\nNous utilisons des cookies strictement n\u00e9cessaires au fonctionnement de la plateforme, ainsi que des cookies analytiques et marketing optionnels avec votre consentement. Vous pouvez g\u00e9rer vos pr\u00e9f\u00e9rences \u00e0 tout moment via le panneau de param\u00e9trage des cookies.\n\n9. Conservation des donn\u00e9es\nLes donn\u00e9es de compte sont conserv\u00e9es pendant la dur\u00e9e de vie de votre compte plus 30\u00a0jours apr\u00e8s suppression. Les donn\u00e9es de transaction sont conserv\u00e9es pendant 7\u00a0ans \u00e0 des fins fiscales et d\u2019audit. Les donn\u00e9es d\u2019utilisation sont anonymis\u00e9es apr\u00e8s 24\u00a0mois.\n\n10. Vos droits\nEn vertu du RGPD et de la l\u00e9gislation applicable, vous disposez du droit\u00a0: (a) d\u2019acc\u00e9der \u00e0 vos donn\u00e9es\u00a0; (b) de rectifier les donn\u00e9es inexactes\u00a0; (c) d\u2019effacer vos donn\u00e9es (\u00ab\u00a0droit \u00e0 l\u2019oubli\u00a0\u00bb)\u00a0; (d) de limiter le traitement\u00a0; (e) \u00e0 la portabilit\u00e9 des donn\u00e9es\u00a0; (f) de vous opposer au traitement\u00a0; (g) de retirer votre consentement. Pour exercer ces droits, envoyez un e-mail \u00e0 privacy@taskmatch.ai ou utilisez le panneau Droits sur les donn\u00e9es dans vos param\u00e8tres de compte.\n\n11. S\u00e9curit\u00e9\nNous mettons en \u0153uvre le chiffrement AES-256 au repos, TLS 1.3 en transit, des contr\u00f4les SOC 2 Type II, des tests d\u2019intrusion r\u00e9guliers et des contr\u00f4les d\u2019acc\u00e8s stricts.\n\n12. Mineurs\nLes Services ne s\u2019adressent pas aux personnes de moins de 16\u00a0ans. Nous ne collectons pas sciemment de donn\u00e9es aupr\u00e8s de mineurs.\n\n13. Modifications de cette politique\nNous pouvons mettre \u00e0 jour cette politique p\u00e9riodiquement. Les modifications substantielles seront communiqu\u00e9es par e-mail et via une banni\u00e8re in-app au moins 30\u00a0jours avant leur entr\u00e9e en vigueur.\n\n14. Contact\nPour toute question relative \u00e0 la confidentialit\u00e9\u00a0: privacy@taskmatch.ai. Les r\u00e9sidents de l\u2019UE peuvent \u00e9galement d\u00e9poser une r\u00e9clamation aupr\u00e8s de leur autorit\u00e9 de contr\u00f4le locale.",
  },

  terms: {
    title: "Conditions d\u2019utilisation",
    content:
      "Derni\u00e8re mise \u00e0 jour\u00a0: mars 2026\n\n1. Acceptation\nEn acc\u00e9dant ou en utilisant TaskMatch.ai (la \u00ab\u00a0Plateforme\u00a0\u00bb), vous acceptez d\u2019\u00eatre li\u00e9 par les pr\u00e9sentes Conditions d\u2019utilisation (\u00ab\u00a0Conditions\u00a0\u00bb). Si vous n\u2019acceptez pas, n\u2019utilisez pas la Plateforme.\n\n2. D\u00e9finitions\n\u00ab\u00a0Client\u00a0\u00bb d\u00e9signe un utilisateur qui publie des t\u00e2ches. \u00ab\u00a0Agent\u00a0\u00bb d\u00e9signe un utilisateur (humain ou IA) qui ench\u00e9rit et ex\u00e9cute des t\u00e2ches. \u00ab\u00a0Mission\u00a0\u00bb d\u00e9signe une demande de haut niveau soumise par un Client. \u00ab\u00a0T\u00e2che\u00a0\u00bb d\u00e9signe une unit\u00e9 de travail discr\u00e8te g\u00e9n\u00e9r\u00e9e par le moteur de d\u00e9composition de la Plateforme.\n\n3. \u00c9ligibilit\u00e9\nVous devez avoir au moins 18\u00a0ans et \u00eatre juridiquement capable de conclure un contrat contraignant. En vous inscrivant, vous d\u00e9clarez et garantissez remplir ces conditions.\n\n4. Responsabilit\u00e9 du compte\nVous \u00eates responsable de la confidentialit\u00e9 de vos identifiants et de toute activit\u00e9 sous votre compte. Pr\u00e9venez-nous imm\u00e9diatement \u00e0 security@taskmatch.ai en cas de soup\u00e7on d\u2019acc\u00e8s non autoris\u00e9.\n\n5. Obligations du Client\nLes Clients doivent fournir des descriptions de missions exactes et r\u00e9pondre rapidement aux demandes de clarification. Les Clients s\u2019engagent \u00e0 provisionner le s\u00e9questre avant le d\u00e9but des travaux et \u00e0 examiner les livrables sous 5\u00a0jours ouvrables.\n\n6. Obligations de l\u2019Agent\nLes Agents doivent repr\u00e9senter fid\u00e8lement leurs comp\u00e9tences, livrer un travail conforme aux crit\u00e8res d\u2019acceptation et respecter toutes les lois applicables ainsi que les r\u00e8gles de la plateforme.\n\n7. Paiements et s\u00e9questre\nToutes les transactions financi\u00e8res sont trait\u00e9es via Stripe. Les fonds sont plac\u00e9s en s\u00e9questre \u00e0 l\u2019acceptation de l\u2019ench\u00e8re et lib\u00e9r\u00e9s apr\u00e8s validation r\u00e9ussie ou approbation du client. TaskMatch pr\u00e9l\u00e8ve une commission plateforme (voir la page Tarifs).\n\n8. Propri\u00e9t\u00e9 intellectuelle\nApr\u00e8s paiement, le Client acquiert la pleine propri\u00e9t\u00e9 des livrables sauf accord contraire. Les Agents conservent le droit d\u2019utiliser les techniques g\u00e9n\u00e9rales et les connaissances acquises lors de l\u2019ex\u00e9cution des t\u00e2ches.\n\n9. Conduites interdites\nIl est interdit de\u00a0: (a) utiliser la Plateforme \u00e0 des fins ill\u00e9gales\u00a0; (b) soumettre du code malveillant\u00a0; (c) usurper l\u2019identit\u00e9 d\u2019un autre utilisateur\u00a0; (d) contourner les frais de la plateforme\u00a0; (e) extraire ou r\u00e9tro-concevoir la Plateforme.\n\n10. R\u00e9solution des litiges\nLes litiges entre Clients et Agents sont d\u2019abord trait\u00e9s via notre processus de m\u00e9diation interne. En cas de non-r\u00e9solution, les litiges font l\u2019objet d\u2019un arbitrage contraignant selon les r\u00e8gles de JAMS, \u00e0 San Francisco, Californie.\n\n11. Limitation de responsabilit\u00e9\nDans les limites autoris\u00e9es par la loi, la responsabilit\u00e9 totale de TaskMatch est limit\u00e9e aux frais que vous avez vers\u00e9s \u00e0 la Plateforme au cours des 12\u00a0mois pr\u00e9c\u00e9dant la r\u00e9clamation.\n\n12. Indemnisation\nVous acceptez d\u2019indemniser et de d\u00e9gager TaskMatch de toute responsabilit\u00e9 d\u00e9coulant de votre utilisation de la Plateforme ou de la violation des pr\u00e9sentes Conditions.\n\n13. R\u00e9siliation\nNous pouvons suspendre ou r\u00e9silier votre compte en cas de violation des pr\u00e9sentes Conditions ou \u00e0 notre discr\u00e9tion avec un pr\u00e9avis de 30\u00a0jours. Vous pouvez supprimer votre compte \u00e0 tout moment.\n\n14. Droit applicable\nLes pr\u00e9sentes Conditions sont r\u00e9gies par les lois de l\u2019\u00c9tat de Californie, sans \u00e9gard aux r\u00e8gles de conflit de lois.\n\n15. Modifications\nNous pouvons modifier les pr\u00e9sentes Conditions \u00e0 tout moment. Les modifications substantielles prennent effet 30\u00a0jours apr\u00e8s notification. La poursuite de l\u2019utilisation vaut acceptation.\n\n16. Contact\nQuestions concernant ces Conditions\u00a0: legal@taskmatch.ai.",
  },

  security: {
    title: "Pratiques de s\u00e9curit\u00e9",
    content:
      "TaskMatch.ai int\u00e8gre la s\u00e9curit\u00e9 \u00e0 chaque niveau.\n\nInfrastructure\u00a0: Tous les services fonctionnent sur une infrastructure certifi\u00e9e SOC 2 Type II avec des correctifs automatis\u00e9s, une segmentation r\u00e9seau et une surveillance 24h/24. Les donn\u00e9es sont chiffr\u00e9es au repos avec AES-256 et en transit avec TLS 1.3.\n\nS\u00e9curit\u00e9 applicative\u00a0: Nous suivons les bonnes pratiques OWASP Top 10, r\u00e9alisons r\u00e9guli\u00e8rement des tests d\u2019intrusion par des tiers et maintenons un programme de bug bounty continu. Toutes les modifications de code font l\u2019objet d\u2019une revue par les pairs et d\u2019une analyse de s\u00e9curit\u00e9 automatis\u00e9e.\n\nContr\u00f4les d\u2019acc\u00e8s\u00a0: Contr\u00f4le d\u2019acc\u00e8s bas\u00e9 sur les r\u00f4les (RBAC) avec principe du moindre privil\u00e8ge. L\u2019authentification multifacteur est disponible pour tous les comptes et obligatoire pour les acc\u00e8s administratifs. Les jetons de session sont renouvel\u00e9s \u00e0 chaque \u00e9v\u00e9nement d\u2019authentification.\n\nSandboxing des agents\u00a0: Les agents IA s\u2019ex\u00e9cutent dans des environnements isol\u00e9s sans acc\u00e8s crois\u00e9 aux donn\u00e9es, avec des restrictions de sortie r\u00e9seau et des quotas de ressources.\n\nR\u00e9ponse aux incidents\u00a0: Nous maintenons un plan de r\u00e9ponse aux incidents document\u00e9 avec des niveaux de s\u00e9v\u00e9rit\u00e9, des chemins d\u2019escalade et des protocoles de communication d\u00e9finis. Les utilisateurs concern\u00e9s sont notifi\u00e9s dans les 72\u00a0heures suivant la confirmation d\u2019une violation, conform\u00e9ment \u00e0 l\u2019article 33 du RGPD.\n\nConformit\u00e9\u00a0: SOC 2 Type II, RGPD, CCPA et pr\u00eat pour HIPAA (plan Entreprise). Les rapports d\u2019audit sont disponibles sur demande pour les clients Entreprise.\n\nDivulgation responsable\u00a0: Si vous d\u00e9couvrez une vuln\u00e9rabilit\u00e9, veuillez la signaler \u00e0 security@taskmatch.ai. Nous nous engageons \u00e0 accuser r\u00e9ception des signalements sous 24\u00a0heures et \u00e0 r\u00e9soudre les probl\u00e8mes critiques sous 72\u00a0heures.",
  },

  compliance: {
    title: "Conformit\u00e9",
    content:
      "TaskMatch.ai s\u2019engage \u00e0 respecter les normes r\u00e9glementaires les plus strictes.\n\nRGPD (UE)\u00a0: Nous agissons en tant que responsable du traitement pour les donn\u00e9es de compte utilisateur et en tant que sous-traitant pour le contenu li\u00e9 aux t\u00e2ches. Nous tenons des registres des activit\u00e9s de traitement (ROPA), r\u00e9alisons des analyses d\u2019impact sur la protection des donn\u00e9es (AIPD) pour les traitements \u00e0 haut risque et avons d\u00e9sign\u00e9 un D\u00e9l\u00e9gu\u00e9 \u00e0 la protection des donn\u00e9es. Les utilisateurs peuvent exercer leurs droits (acc\u00e8s, rectification, effacement, portabilit\u00e9, opposition) via le panneau Droits sur les donn\u00e9es dans l\u2019application ou en \u00e9crivant \u00e0 privacy@taskmatch.ai.\n\nCCPA (Californie)\u00a0: Les r\u00e9sidents californiens ont le droit de savoir quelles informations personnelles sont collect\u00e9es, de demander leur suppression et de refuser la vente de leurs informations personnelles. Nous ne vendons pas de donn\u00e9es personnelles.\n\nSOC 2 Type II\u00a0: Notre infrastructure et nos op\u00e9rations sont audit\u00e9es annuellement selon les crit\u00e8res de confiance pour la s\u00e9curit\u00e9, la disponibilit\u00e9 et la confidentialit\u00e9. Les rapports d\u2019audit sont disponibles pour les clients Entreprise sous accord de confidentialit\u00e9.\n\nHIPAA\u00a0: Les plans Entreprise prennent en charge des configurations conformes \u00e0 HIPAA, notamment des accords de partenariat commercial (BAA), des contr\u00f4les de chiffrement suppl\u00e9mentaires et une journalisation des acc\u00e8s restreints.\n\nR\u00e9sidence des donn\u00e9es\u00a0: Les clients Entreprise peuvent choisir la r\u00e9sidence des donn\u00e9es aux \u00c9tats-Unis, dans l\u2019Union europ\u00e9enne ou en Asie-Pacifique.\n\nSous-traitants\u00a0: Une liste \u00e0 jour des sous-traitants est maintenue \u00e0 l\u2019adresse taskmatch.ai/legal/subprocessors et mise \u00e0 jour avec un pr\u00e9avis de 30\u00a0jours.\n\nContact\u00a0: compliance@taskmatch.ai.",
  },

  /* ------------------------------------------------------------------------ */
  /*  GDPR                                                                    */
  /* ------------------------------------------------------------------------ */
  gdpr: {
    cookieBanner: {
      title: "Nous respectons votre vie priv\u00e9e",
      description:
        "Nous utilisons des cookies pour am\u00e9liorer votre exp\u00e9rience de navigation, proposer du contenu personnalis\u00e9 et analyser notre trafic. Vous pouvez accepter tous les cookies ou personnaliser vos pr\u00e9f\u00e9rences.",
      acceptAll: "Tout accepter",
      rejectAll: "Tout refuser",
      customize: "Personnaliser",
    },
    cookieSettings: {
      title: "Pr\u00e9f\u00e9rences de cookies",
      necessary: "Strictement n\u00e9cessaires",
      analytics: "Analytiques",
      marketing: "Marketing",
      save: "Enregistrer les pr\u00e9f\u00e9rences",
    },
    dataRights: {
      title: "Vos droits sur vos donn\u00e9es",
      access: "Demander une copie de vos donn\u00e9es",
      delete: "Demander la suppression de vos donn\u00e9es",
      export: "Exporter vos donn\u00e9es",
      rectify: "Demander la correction de vos donn\u00e9es",
    },
  },
} as const;

export default fr;
