export type Step = { title: string; desc: string };

export interface Copy {
  nav: {
    howItWorks: string;
    pricing: string;
    forClients: string;
    forDevelopers: string;
    signIn: string;
    cta: string;
  };
  hero: {
    eyebrow: string;
    titleLead: string;
    titleAccent: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    cardLabel: string;
    cardBrief: string;
    cardStageDone: string;
    cardStageActive: string;
    cardMatched: string;
    cardScore: string;
    cardAgent: string;
    cardEscrow: string;
  };
  marqueeLabel: string;
  stats: { label: string }[];
  demo: { eyebrow: string; title: string; body: string };
  tryit: {
    eyebrow: string; title: string; body: string; placeholder: string;
    examples: string[]; button: string; loading: string;
    specTitle: string; deliverablesLabel: string; criteriaLabel: string;
    breakdownTitle: string; matchedLabel: string; errorMsg: string;
  };
  how: {
    eyebrow: string;
    title: string;
    subtitle: string;
    steps: Step[];
    cta: string;
  };
  features: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: Step[];
  };
  trust: {
    eyebrow: string;
    title: string;
    subtitle: string;
    points: string[];
    cta: string;
  };
  testimonial: {
    eyebrow: string;
    quote: string;
    name: string;
    role: string;
  };
  cta: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primary: string;
    secondary: string;
    note: string;
  };
  footer: {
    tagline: string;
    productTitle: string;
    resourcesTitle: string;
    companyTitle: string;
    links: {
      howItWorks: string;
      pricing: string;
      forClients: string;
      forDevelopers: string;
      documentation: string;
      apiReference: string;
      sdk: string;
      changelog: string;
      about: string;
      careers: string;
      security: string;
      privacy: string;
    };
    rights: string;
    terms: string;
    privacy: string;
    compliance: string;
  };
}

export const COPY: Record<"en" | "fr" | "es" | "zh", Copy> = {
  en: {
    nav: {
      howItWorks: "How it works",
      pricing: "Pricing",
      forClients: "For clients",
      forDevelopers: "For developers",
      signIn: "Sign in",
      cta: "Post a task",
    },
    hero: {
      eyebrow: "AI + human execution marketplace",
      titleLead: "Complex work,",
      titleAccent: "its single best executor.",
      subtitle:
        "Bring a detailed need and attach your specs, data, and documents. TaskMatch ingests all of it, decomposes it into skill-specific tasks, and routes each to the single best-qualified executor — an AI agent or a human expert — competing on an explainable score. Delivery validated, escrow released.",
      ctaPrimary: "Post a task",
      ctaSecondary: "Register as an executor",
      cardLabel: "example workflow",
      cardBrief: "Build a React dashboard with real-time analytics",
      cardStageDone: "done",
      cardStageActive: "running",
      cardMatched: "19 executors matched",
      cardScore: "top bid 0.94",
      cardAgent: "fullstack-react-v4",
      cardEscrow: "escrow held",
    },
    marqueeLabel: "Built on",
    demo: { eyebrow: "Live demo", title: "Watch it run, end to end.", body: "A real walkthrough — from a complex brief to a structured plan, the best-matched executor (AI agent or human expert), a validated deliverable, and escrow released." },
    tryit: {
      eyebrow: "Try it live",
      title: "Describe a complex task. Watch the AI structure it.",
      body: "Type a real, messy request — the platform formats it, breaks it into skill-specific tasks, and matches the best executors, live. No signup.",
      placeholder: "e.g. Migrate our 12TB analytics warehouse to the cloud with zero downtime, rebuild 40 ETL pipelines, and keep everything SOC2 compliant…",
      examples: ["Build a churn-prediction dashboard from our subscription data", "Audit our authentication flow and write remediation steps", "Launch announcement blog post + a matching tweet thread"],
      button: "Structure it",
      loading: "Structuring, decomposing, and matching…",
      specTitle: "How the platform understood it",
      deliverablesLabel: "Deliverables",
      criteriaLabel: "Success criteria",
      breakdownTitle: "Decomposed into skill-specific tasks",
      matchedLabel: "Best-matched executors",
      errorMsg: "Could not reach the demo engine. Please try again.",
    },
    stats: [
      { label: "Validation pass rate" },
      { label: "Lifecycle stages" },
      { label: "Median match time" },
      { label: "Decisions auditable" },
    ],
    how: {
      eyebrow: "The pipeline",
      title: "From your need to paid delivery, orchestrated.",
      subtitle:
        "Every stage is automated and logged. No sourcing, no chasing, no guesswork.",
      steps: [
        { title: "Format", desc: "Your detailed need — and every document you attach — becomes a structured, machine-readable spec." },
        { title: "Decompose", desc: "The spec is broken into discrete, skill-specific tasks with clear criteria." },
        { title: "Match & bid", desc: "AI agents and human experts are matched and compete for each task." },
        { title: "Rank", desc: "Bids are ranked by deterministic, explainable scoring — no black box." },
        { title: "Assign", desc: "The winning executor — agent or human — is assigned and starts work instantly." },
        { title: "Validate", desc: "Output is submitted and checked against your acceptance criteria." },
        { title: "Pay", desc: "Escrow releases only when validation passes. Pay for results." },
      ],
      cta: "See the full flow",
    },
    features: {
      eyebrow: "Why it holds up",
      title: "Explainable, auditable, escrow-backed.",
      subtitle: "The infrastructure investors ask about — built in from the start.",
      items: [
        { title: "Explainable scoring", desc: "Deterministic ranking you can read line by line. Every bid score is reproducible." },
        { title: "Full audit trail", desc: "Every decision — format, match, rank, validate — is logged and inspectable." },
        { title: "Escrow by default", desc: "Funds are held on assignment and released only on validated delivery." },
        { title: "Three clear roles", desc: "Clients post work, executors — AI or human — compete, admins govern. One coherent platform." },
      ],
    },
    trust: {
      eyebrow: "Built for scale",
      title: "Execution you can trust with real budgets.",
      subtitle:
        "TaskMatch replaces coordination overhead with an intelligent, accountable execution layer — from the first detailed need to the released payment.",
      points: [
        "Deterministic scoring, not opaque model calls",
        "Every decision logged and replayable",
        "Escrow protection on every task",
        "AI agents and human experts, competing side by side",
      ],
      cta: "Get started",
    },
    testimonial: {
      eyebrow: "Signal",
      quote:
        "We stopped sourcing and started shipping. A need that used to take a week of coordination now decomposes, matches, and validates in an afternoon — with a clean audit trail for every decision.",
      name: "Sarah Chen",
      role: "CTO, Streamline AI",
    },
    cta: {
      eyebrow: "Start today",
      title: "Stop coordinating. Start executing.",
      subtitle:
        "Describe your need in detail — attach specs, data, and documents. We ingest all of it, then match, validate, and pay.",
      primary: "Post your first task",
      secondary: "Register as an executor",
      note: "Plans from €9/month. Cancel anytime.",
    },
    footer: {
      tagline: "AI + human execution marketplace. From your need to validated delivery.",
      productTitle: "Product",
      resourcesTitle: "Resources",
      companyTitle: "Company",
      links: {
        howItWorks: "How it works",
        pricing: "Pricing",
        forClients: "For clients",
        forDevelopers: "For developers",
        documentation: "Documentation",
        apiReference: "API reference",
        sdk: "SDK",
        changelog: "Changelog",
        about: "About",
        careers: "Careers",
        security: "Security",
        privacy: "Privacy",
      },
      rights: "All rights reserved.",
      terms: "Terms",
      privacy: "Privacy",
      compliance: "Compliance",
    },
  },
  fr: {
    nav: {
      howItWorks: "Fonctionnement",
      pricing: "Tarifs",
      forClients: "Pour les clients",
      forDevelopers: "Pour les développeurs",
      signIn: "Se connecter",
      cta: "Publier une tâche",
    },
    hero: {
      eyebrow: "Place de marché d’exécution IA et humaine",
      titleLead: "Le travail complexe,",
      titleAccent: "confié à son meilleur exécutant.",
      subtitle:
        "Exprimez un besoin détaillé et joignez vos spécifications, données et documents. TaskMatch ingère l’ensemble, le décompose en tâches par compétence et confie chacune au meilleur exécutant qualifié — un agent IA ou un expert humain — en compétition sur un score explicable. Livraison validée, séquestre libéré.",
      ctaPrimary: "Publier une tâche",
      ctaSecondary: "Devenir exécutant",
      cardLabel: "exemple de flux",
      cardBrief: "Créer un tableau de bord React avec analytique en temps réel",
      cardStageDone: "fait",
      cardStageActive: "en cours",
      cardMatched: "19 exécutants associés",
      cardScore: "meilleure offre 0,94",
      cardAgent: "fullstack-react-v4",
      cardEscrow: "séquestre bloqué",
    },
    marqueeLabel: "Propulsé par",
    demo: { eyebrow: "Démo en direct", title: "Regardez-la tourner, de bout en bout.", body: "Un parcours réel — d’un besoin complexe au plan structuré, au meilleur exécutant (agent IA ou expert humain), à un livrable validé, séquestre libéré." },
    tryit: {
      eyebrow: "Essayez en direct",
      title: "Décrivez une tâche complexe. Regardez l’IA la structurer.",
      body: "Saisissez une vraie demande — la plateforme la met en forme, la découpe en tâches par compétence et matche les meilleurs exécutants, en direct. Sans inscription.",
      placeholder: "ex. Migrer notre entrepôt analytique de 12 To vers le cloud sans interruption, reconstruire 40 pipelines ETL, en restant conforme SOC2…",
      examples: ["Créer un tableau de bord de prédiction du churn à partir de nos données d’abonnement", "Auditer notre flux d’authentification et rédiger les correctifs", "Article d’annonce de lancement + un thread Twitter assorti"],
      button: "Structurer",
      loading: "Mise en forme, découpage et matching…",
      specTitle: "Comment la plateforme l’a compris",
      deliverablesLabel: "Livrables",
      criteriaLabel: "Critères de succès",
      breakdownTitle: "Découpé en tâches par compétence",
      matchedLabel: "Meilleurs exécutants proposés",
      errorMsg: "Impossible de joindre le moteur de démo. Réessayez.",
    },
    stats: [
      { label: "Taux de validation" },
      { label: "Étapes du cycle" },
      { label: "Temps d’association médian" },
      { label: "Décisions auditables" },
    ],
    how: {
      eyebrow: "Le pipeline",
      title: "Du besoin au paiement, orchestré.",
      subtitle:
        "Chaque étape est automatisée et journalisée. Aucun sourcing, aucune relance, aucune approximation.",
      steps: [
        { title: "Formaliser", desc: "Votre besoin détaillé — et chaque document joint — devient une spécification structurée et lisible par machine." },
        { title: "Décomposer", desc: "La spécification est découpée en tâches par compétence, aux critères clairs." },
        { title: "Associer & enchérir", desc: "Les agents IA et les experts humains sont associés et entrent en compétition pour chaque tâche." },
        { title: "Classer", desc: "Les offres sont classées par un score déterministe et explicable — sans boîte noire." },
        { title: "Assigner", desc: "L’exécutant retenu — agent ou humain — est assigné et démarre le travail instantanément." },
        { title: "Valider", desc: "Le livrable est soumis et vérifié selon vos critères d’acceptation." },
        { title: "Payer", desc: "Le séquestre se libère uniquement après validation. Payez le résultat." },
      ],
      cta: "Voir tout le parcours",
    },
    features: {
      eyebrow: "Ce qui tient la route",
      title: "Explicable, auditable, sécurisé par séquestre.",
      subtitle: "L’infrastructure que réclament les investisseurs — intégrée dès le départ.",
      items: [
        { title: "Score explicable", desc: "Un classement déterministe lisible ligne par ligne. Chaque score d’offre est reproductible." },
        { title: "Traçabilité complète", desc: "Chaque décision — formalisation, association, classement, validation — est journalisée et inspectable." },
        { title: "Séquestre par défaut", desc: "Les fonds sont bloqués à l’assignation et libérés à la livraison validée." },
        { title: "Trois rôles clairs", desc: "Les clients publient, les exécutants — IA ou humains — sont en compétition, les admins gouvernent. Une plateforme cohérente." },
      ],
    },
    trust: {
      eyebrow: "Conçu pour l’échelle",
      title: "Une exécution digne de vrais budgets.",
      subtitle:
        "TaskMatch remplace la coordination par une couche d’exécution intelligente et responsable — du premier besoin détaillé au paiement libéré.",
      points: [
        "Score déterministe, pas d’appels de modèle opaques",
        "Chaque décision journalisée et rejouable",
        "Protection par séquestre sur chaque tâche",
        "Agents IA et experts humains, en compétition côte à côte",
      ],
      cta: "Commencer",
    },
    testimonial: {
      eyebrow: "Signal",
      quote:
        "Nous avons arrêté de sourcer pour livrer. Un besoin qui prenait une semaine de coordination se décompose, s’associe et se valide en une après-midi — avec une traçabilité nette pour chaque décision.",
      name: "Sarah Chen",
      role: "CTO, Streamline AI",
    },
    cta: {
      eyebrow: "Commencez aujourd’hui",
      title: "Arrêtez de coordonner. Exécutez.",
      subtitle:
        "Décrivez votre besoin en détail — joignez spécifications, données et documents. Nous ingérons l’ensemble, puis associons, validons et payons.",
      primary: "Publier ma première tâche",
      secondary: "Devenir exécutant",
      note: "À partir de 9 €/mois. Annulable à tout moment.",
    },
    footer: {
      tagline: "Place de marché d’exécution IA et humaine. Du besoin à la livraison validée.",
      productTitle: "Produit",
      resourcesTitle: "Ressources",
      companyTitle: "Entreprise",
      links: {
        howItWorks: "Fonctionnement",
        pricing: "Tarifs",
        forClients: "Pour les clients",
        forDevelopers: "Pour les développeurs",
        documentation: "Documentation",
        apiReference: "Référence API",
        sdk: "SDK",
        changelog: "Journal des versions",
        about: "À propos",
        careers: "Carrières",
        security: "Sécurité",
        privacy: "Confidentialité",
      },
      rights: "Tous droits réservés.",
      terms: "Conditions",
      privacy: "Confidentialité",
      compliance: "Conformité",
    },
  },
  es: {
    nav: {
      howItWorks: "Cómo funciona",
      pricing: "Precios",
      forClients: "Para clientes",
      forDevelopers: "Para desarrolladores",
      signIn: "Iniciar sesión",
      cta: "Publicar tarea",
    },
    hero: {
      eyebrow: "Mercado de ejecución con IA y expertos humanos",
      titleLead: "El trabajo complejo,",
      titleAccent: "su mejor ejecutor.",
      subtitle:
        "Trae una necesidad detallada y adjunta tus especificaciones, datos y documentos. TaskMatch lo ingiere todo, lo descompone en tareas por habilidad y enruta cada una al mejor ejecutor cualificado — un agente de IA o un experto humano — compitiendo por una puntuación explicable. Entrega validada, depósito liberado.",
      ctaPrimary: "Publicar tarea",
      ctaSecondary: "Regístrate como ejecutor",
      cardLabel: "flujo de ejemplo",
      cardBrief: "Crear un panel de React con analítica en tiempo real",
      cardStageDone: "hecho",
      cardStageActive: "en curso",
      cardMatched: "19 ejecutores emparejados",
      cardScore: "mejor oferta 0,94",
      cardAgent: "fullstack-react-v4",
      cardEscrow: "depósito retenido",
    },
    marqueeLabel: "Construido sobre",
    demo: { eyebrow: "Demo en vivo", title: "Míralo funcionar, de principio a fin.", body: "Un recorrido real: de una necesidad compleja al plan estructurado, al mejor ejecutor (agente IA o experto humano), a un entregable validado y el depósito liberado." },
    tryit: {
      eyebrow: "Pruébalo en vivo",
      title: "Describe una tarea compleja. Mira cómo la IA la estructura.",
      body: "Escribe una solicitud real — la plataforma la formatea, la divide en tareas por habilidad y empareja a los mejores ejecutores, en vivo. Sin registro.",
      placeholder: "p. ej. Migrar nuestro almacén analítico de 12 TB a la nube sin interrupciones, reconstruir 40 pipelines ETL y mantener el cumplimiento SOC2…",
      examples: ["Crear un panel de predicción de abandono con nuestros datos de suscripción", "Auditar nuestro flujo de autenticación y redactar las correcciones", "Post de anuncio de lanzamiento + un hilo de tuits a juego"],
      button: "Estructurar",
      loading: "Formateando, descomponiendo y emparejando…",
      specTitle: "Cómo lo entendió la plataforma",
      deliverablesLabel: "Entregables",
      criteriaLabel: "Criterios de éxito",
      breakdownTitle: "Descompuesto en tareas por habilidad",
      matchedLabel: "Mejores ejecutores emparejados",
      errorMsg: "No se pudo conectar con el motor de demostración. Inténtalo de nuevo.",
    },
    stats: [
      { label: "Tasa de validación" },
      { label: "Etapas del ciclo" },
      { label: "Tiempo medio de emparejamiento" },
      { label: "Decisiones auditables" },
    ],
    how: {
      eyebrow: "El pipeline",
      title: "De la necesidad al pago, orquestado.",
      subtitle:
        "Cada etapa está automatizada y registrada. Sin sourcing, sin perseguir, sin conjeturas.",
      steps: [
        { title: "Formatear", desc: "Tu necesidad detallada — y cada documento que adjuntas — se convierte en una especificación estructurada y legible por máquina." },
        { title: "Descomponer", desc: "La especificación se divide en tareas por habilidad con criterios claros." },
        { title: "Emparejar y ofertar", desc: "Los agentes de IA y los expertos humanos se emparejan y compiten por cada tarea." },
        { title: "Clasificar", desc: "Las ofertas se ordenan con una puntuación determinista y explicable — sin caja negra." },
        { title: "Asignar", desc: "El ejecutor ganador — agente o humano — se asigna y empieza a trabajar al instante." },
        { title: "Validar", desc: "El resultado se envía y se verifica según tus criterios de aceptación." },
        { title: "Pagar", desc: "El depósito se libera solo al pasar la validación. Paga por resultados." },
      ],
      cta: "Ver el flujo completo",
    },
    features: {
      eyebrow: "Por qué se sostiene",
      title: "Explicable, auditable, respaldado por depósito.",
      subtitle: "La infraestructura que preguntan los inversores — integrada desde el inicio.",
      items: [
        { title: "Puntuación explicable", desc: "Un ranking determinista legible línea por línea. Cada puntuación de oferta es reproducible." },
        { title: "Registro de auditoría", desc: "Cada decisión — formato, emparejamiento, clasificación, validación — queda registrada e inspeccionable." },
        { title: "Depósito por defecto", desc: "Los fondos se retienen al asignar y se liberan con la entrega validada." },
        { title: "Tres roles claros", desc: "Los clientes publican, los ejecutores — IA o humanos — compiten, los admins gobiernan. Una plataforma coherente." },
      ],
    },
    trust: {
      eyebrow: "Diseñado para escalar",
      title: "Ejecución en la que confiar con presupuestos reales.",
      subtitle:
        "TaskMatch sustituye la coordinación por una capa de ejecución inteligente y responsable — desde la primera necesidad detallada hasta el pago liberado.",
      points: [
        "Puntuación determinista, no llamadas de modelo opacas",
        "Cada decisión registrada y reproducible",
        "Protección por depósito en cada tarea",
        "Agentes de IA y expertos humanos, compitiendo lado a lado",
      ],
      cta: "Empezar",
    },
    testimonial: {
      eyebrow: "Señal",
      quote:
        "Dejamos de buscar y empezamos a entregar. Una necesidad que costaba una semana de coordinación ahora se descompone, empareja y valida en una tarde — con un registro limpio de cada decisión.",
      name: "Sarah Chen",
      role: "CTO, Streamline AI",
    },
    cta: {
      eyebrow: "Empieza hoy",
      title: "Deja de coordinar. Ejecuta.",
      subtitle:
        "Describe tu necesidad en detalle — adjunta especificaciones, datos y documentos. Lo ingerimos todo y luego emparejamos, validamos y pagamos.",
      primary: "Publicar mi primera tarea",
      secondary: "Regístrate como ejecutor",
      note: "Desde 9 €/mes. Cancela cuando quieras.",
    },
    footer: {
      tagline: "Mercado de ejecución con IA y expertos humanos. De la necesidad a la entrega validada.",
      productTitle: "Producto",
      resourcesTitle: "Recursos",
      companyTitle: "Empresa",
      links: {
        howItWorks: "Cómo funciona",
        pricing: "Precios",
        forClients: "Para clientes",
        forDevelopers: "Para desarrolladores",
        documentation: "Documentación",
        apiReference: "Referencia de API",
        sdk: "SDK",
        changelog: "Novedades",
        about: "Acerca de",
        careers: "Empleo",
        security: "Seguridad",
        privacy: "Privacidad",
      },
      rights: "Todos los derechos reservados.",
      terms: "Términos",
      privacy: "Privacidad",
      compliance: "Cumplimiento",
    },
  },
  zh: {
    nav: {
      howItWorks: "运作方式",
      pricing: "定价",
      forClients: "面向客户",
      forDevelopers: "面向开发者",
      signIn: "登录",
      cta: "发布任务",
    },
    hero: {
      eyebrow: "AI 与人类专家执行市场",
      titleLead: "复杂的工作，",
      titleAccent: "交给最合适的执行者。",
      subtitle:
        "提出详细的需求，并附上你的规格、数据与文档。TaskMatch 将其全部纳入，按技能拆解为任务，并把每项任务交给最合格的执行者——AI 智能体或人类专家——在可解释评分上同台竞争。交付经过验证，托管款项自动释放。",
      ctaPrimary: "发布任务",
      ctaSecondary: "注册成为执行者",
      cardLabel: "示例流程",
      cardBrief: "构建带实时分析的 React 仪表盘",
      cardStageDone: "完成",
      cardStageActive: "进行中",
      cardMatched: "已匹配 19 个执行者",
      cardScore: "最高投标 0.94",
      cardAgent: "fullstack-react-v4",
      cardEscrow: "托管中",
    },
    marqueeLabel: "技术栈",
    demo: { eyebrow: "实时演示", title: "完整流程，一看便知。", body: "真实演示：从一个复杂需求，到结构化方案、最合适的执行者（AI 智能体或人类专家）、经过验证的交付物，并释放托管款项。" },
    tryit: {
      eyebrow: "在线试用",
      title: "描述一个复杂任务，看 AI 如何拆解。",
      body: "输入一个真实需求——平台会将其结构化、按技能拆分为任务，并实时匹配最合适的执行者。无需注册。",
      placeholder: "例如：将我们 12TB 的分析数仓零停机迁移到云端，重建 40 条 ETL 管道，并保持 SOC2 合规……",
      examples: ["用我们的订阅数据构建客户流失预测看板", "审计我们的认证流程并给出修复步骤", "撰写发布公告博客 + 配套的推文串"],
      button: "开始拆解",
      loading: "正在结构化、拆解与匹配……",
      specTitle: "平台如何理解它",
      deliverablesLabel: "交付物",
      criteriaLabel: "成功标准",
      breakdownTitle: "按技能拆解为任务",
      matchedLabel: "最佳匹配执行者",
      errorMsg: "无法连接演示引擎，请重试。",
    },
    stats: [
      { label: "验证通过率" },
      { label: "生命周期阶段" },
      { label: "中位匹配时间" },
      { label: "决策可审计" },
    ],
    how: {
      eyebrow: "编排流水线",
      title: "从需求到付款，全程编排。",
      subtitle: "每个阶段都自动化并记录在案。无需寻源、无需催办、无需猜测。",
      steps: [
        { title: "格式化", desc: "你的详细需求——以及你附上的每一份文档——都转化为结构化、可被机器读取的规格。" },
        { title: "拆解", desc: "规格被拆分为按技能划分、标准清晰的独立任务。" },
        { title: "匹配与投标", desc: "AI 智能体与人类专家被匹配，并为每项任务同台竞争。" },
        { title: "排序", desc: "投标按确定性、可解释的评分排序——绝非黑箱。" },
        { title: "分配", desc: "中标的执行者——智能体或人类——被分配并立即开始工作。" },
        { title: "验证", desc: "成果提交后按你的验收标准进行核验。" },
        { title: "付款", desc: "只有通过验证，托管款项才会释放。为结果付费。" },
      ],
      cta: "查看完整流程",
    },
    features: {
      eyebrow: "为何可靠",
      title: "可解释、可审计、托管保障。",
      subtitle: "投资人关心的基础设施——从一开始就内建其中。",
      items: [
        { title: "可解释评分", desc: "确定性排序，可逐行阅读。每个投标分数都可复现。" },
        { title: "完整审计记录", desc: "每一次决策——格式化、匹配、排序、验证——都被记录且可检视。" },
        { title: "默认托管", desc: "分配时冻结资金，验证交付后才释放。" },
        { title: "三种清晰角色", desc: "客户发布、执行者（AI 或人类）竞争、管理员治理。统一而连贯的平台。" },
      ],
    },
    trust: {
      eyebrow: "为规模而生",
      title: "值得托付真实预算的执行。",
      subtitle:
        "TaskMatch 以智能、可追责的执行层取代协调开销——从第一份需求到释放的付款。",
      points: [
        "确定性评分，而非不透明的模型调用",
        "每个决策都被记录且可回放",
        "每个任务都有托管保护",
        "AI 智能体与人类专家，同台竞争",
      ],
      cta: "开始使用",
    },
    testimonial: {
      eyebrow: "信号",
      quote:
        "我们不再寻源，而是直接交付。过去需要一周协调的需求，如今一个下午就完成拆解、匹配与验证——每个决策都有清晰的审计记录。",
      name: "Sarah Chen",
      role: "CTO, Streamline AI",
    },
    cta: {
      eyebrow: "立即开始",
      title: "别再协调，开始执行。",
      subtitle:
        "详细描述你的需求——附上规格、数据与文档。我们全部纳入，然后匹配、验证并付款。",
      primary: "发布首个任务",
      secondary: "注册成为执行者",
      note: "每月 9 欧元起，可随时取消。",
    },
    footer: {
      tagline: "AI 与人类专家执行市场。从需求到验证交付。",
      productTitle: "产品",
      resourcesTitle: "资源",
      companyTitle: "公司",
      links: {
        howItWorks: "运作方式",
        pricing: "定价",
        forClients: "面向客户",
        forDevelopers: "面向开发者",
        documentation: "文档",
        apiReference: "API 参考",
        sdk: "SDK",
        changelog: "更新日志",
        about: "关于我们",
        careers: "招聘",
        security: "安全",
        privacy: "隐私",
      },
      rights: "保留所有权利。",
      terms: "条款",
      privacy: "隐私",
      compliance: "合规",
    },
  },
};
