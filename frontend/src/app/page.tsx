"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslation } from "@/lib/i18n";
import { Reveal, Counter, Marquee } from "@/components/public/motion";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  FileText,
  Gavel,
  Layers,
  ListChecks,
  Lock,
  Menu,
  Network,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trophy,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  i18n copy — every visible string, 4 languages                     */
/* ------------------------------------------------------------------ */

type Step = { title: string; desc: string };

interface Copy {
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

const COPY: Record<"en" | "fr" | "es" | "zh", Copy> = {
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
      cardLabel: "live orchestration",
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
      cardLabel: "orchestration en direct",
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
      cardLabel: "orquestación en vivo",
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
      cardLabel: "实时编排",
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

const TECH_KEYWORDS = [
  "Next.js",
  "FastAPI",
  "PostgreSQL",
  "Redis",
  "OpenRouter",
  "MCP",
  "Explainable scoring",
  "Escrow",
  "Audit log",
];

const STAT_VALUES = [
  { value: 98, suffix: "%", decimals: 0 },
  { value: 9, suffix: "", decimals: 0 },
  { value: 4, suffix: "s", decimals: 0 },
  { value: 100, suffix: "%", decimals: 0 },
];

const HOW_ICONS = [FileText, Layers, Network, Trophy, Gavel, ShieldCheck, Lock];
const FEATURE_ICONS = [ListChecks, ScrollText, Lock, Network];

const BTN_PRIMARY =
  "inline-flex h-12 items-center gap-2 rounded-full bg-accent-lime px-7 text-sm font-semibold text-[var(--accent-ink)] transition-transform hover:scale-[1.03]";
const BTN_SECONDARY =
  "inline-flex h-12 items-center gap-2 rounded-full border border-line-strong px-7 text-sm font-medium text-ink hover:bg-white/5 transition-colors";

/* ------------------------------------------------------------------ */
/*  Navbar                                                             */
/* ------------------------------------------------------------------ */

function Navbar({ c }: { c: Copy }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { label: c.nav.howItWorks, href: "/how-it-works" },
    { label: c.nav.pricing, href: "/pricing" },
    { label: c.nav.forClients, href: "/for-clients" },
    { label: c.nav.forDevelopers, href: "/for-developers" },
  ];

  return (
    <header className="fixed top-0 z-50 w-full border-b border-line bg-[rgba(10,11,13,0.72)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-lime text-[var(--accent-ink)]">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-display text-sm font-semibold tracking-tight text-ink">
            TaskMatch<span className="text-accent">.ai</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-muted transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            {c.nav.signIn}
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent-lime px-5 text-sm font-semibold text-[var(--accent-ink)] transition-transform hover:scale-[1.03]"
          >
            {c.nav.cta}
          </Link>
        </div>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line-strong text-ink lg:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-line bg-surface px-4 py-4 lg:hidden">
          <div className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-xl px-3 py-3 text-sm font-medium text-ink-muted hover:bg-white/5"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex justify-center pb-1">
              <LanguageSwitcher />
            </div>
            <Link href="/login" className={BTN_SECONDARY + " justify-center"}>
              {c.nav.signIn}
            </Link>
            <Link href="/register" className={BTN_PRIMARY + " justify-center"}>
              {c.nav.cta}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

function Hero({ c }: { c: Copy }) {
  const stages = [
    { label: c.hero.cardStageDone, key: "Format", done: true, active: false },
    { label: c.hero.cardStageDone, key: "Decompose", done: true, active: false },
    { label: c.hero.cardStageActive, key: "Match & rank", done: false, active: true },
    { label: "", key: "Validate", done: false, active: false },
  ];

  return (
    <section className="relative overflow-hidden pt-16">
      <div className="pointer-events-none absolute inset-0 lime-radial" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] grid-bg" />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 sm:pt-24 lg:px-8 lg:pt-28">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-2xl">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/5 px-3.5 py-1.5">
                <Terminal className="h-3.5 w-3.5 text-accent" />
                <span className="tech-eyebrow text-ink-muted">{c.hero.eyebrow}</span>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-7 font-display text-5xl font-semibold leading-[0.98] tracking-tight text-ink sm:text-6xl lg:text-[4.5rem]">
                {c.hero.titleLead}
                <span className="mt-1 block text-gradient-lime">{c.hero.titleAccent}</span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-6 max-w-xl text-lg leading-8 text-ink-muted">
                {c.hero.subtitle}
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className={BTN_PRIMARY}>
                  {c.hero.ctaPrimary}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/for-developers" className={BTN_SECONDARY}>
                  {c.hero.ctaSecondary}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal delay={200}>
            <div className="relative">
              <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 animate-float rounded-full bg-accent-lime/20 blur-2xl" />
              <p className="mb-3 tech-eyebrow text-ink-faint">{c.hero.cardLabel}</p>
              <div className="relative overflow-hidden rounded-3xl border border-line-strong bg-surface p-6 card-glow">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-ink-faint">TM-1847</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-lime/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-accent">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-lime opacity-50" />
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-accent-lime" />
                    </span>
                    {c.hero.cardStageActive}
                  </span>
                </div>

                <p className="mt-4 text-base font-medium leading-6 text-ink">
                  {c.hero.cardBrief}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  {stages.map((s) => (
                    <div
                      key={s.key}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs ${
                        s.done
                          ? "bg-accent-lime/10 text-accent"
                          : s.active
                          ? "border border-line-strong bg-white/[0.03] font-medium text-ink"
                          : "border border-line bg-white/[0.02] text-ink-faint"
                      }`}
                    >
                      {s.done ? (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      ) : s.active ? (
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-lime opacity-40" />
                          <span className="inline-flex h-2 w-2 rounded-full bg-accent-lime" />
                        </span>
                      ) : (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/20" />
                      )}
                      <span className="font-mono">{s.key}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-[10px]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-ink-muted">
                    <Network className="h-2.5 w-2.5" />
                    {c.hero.cardMatched}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-ink-muted">
                    <Trophy className="h-2.5 w-2.5" />
                    {c.hero.cardScore}
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-xs">
                  <div className="flex items-center gap-2 text-ink-muted">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
                      <Bot className="h-3 w-3" />
                    </span>
                    <span className="font-mono">{c.hero.cardAgent}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] text-accent">
                    <Lock className="h-2.5 w-2.5" />
                    {c.hero.cardEscrow}
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Marquee */}
      <div className="relative border-y border-line bg-surface/40 py-5">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <span className="hidden shrink-0 tech-eyebrow text-ink-faint sm:block">
            {c.marqueeLabel}
          </span>
          <Marquee className="flex-1">
            {TECH_KEYWORDS.map((k) => (
              <span key={k} className="font-mono text-sm text-ink-faint">
                {k}
                <span className="ml-12 text-accent/40">/</span>
              </span>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Stats                                                              */
/* ------------------------------------------------------------------ */

function Stats({ c }: { c: Copy }) {
  return (
    <section className="border-b border-line py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {STAT_VALUES.map((s, i) => (
          <Reveal key={i} delay={i * 70}>
            <div>
              <div className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                <Counter value={s.value} suffix={s.suffix} decimals={s.decimals} />
              </div>
              <div className="mt-2 font-mono text-xs uppercase tracking-wider text-ink-faint">
                {c.stats[i].label}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  How it works — the pipeline                                        */
/* ------------------------------------------------------------------ */

function HowItWorks({ c }: { c: Copy }) {
  return (
    <section className="relative overflow-hidden py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-0 lime-radial opacity-60" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <p className="tech-eyebrow text-accent">{c.how.eyebrow}</p>
          </Reveal>
          <Reveal delay={70}>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              {c.how.title}
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-5 text-lg leading-8 text-ink-muted">{c.how.subtitle}</p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {c.how.steps.map((step, i) => {
            const Icon = HOW_ICONS[i];
            return (
              <Reveal key={step.title} delay={i * 70}>
                <div className="hover-lift group h-full rounded-2xl border border-line bg-surface p-6 hover:border-line-strong">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-accent transition-colors group-hover:bg-accent-lime group-hover:text-[var(--accent-ink)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-xs text-ink-faint">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-6 font-display text-lg font-semibold tracking-tight text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">{step.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={120}>
          <div className="mt-10 flex justify-center">
            <Link href="/how-it-works" className={BTN_SECONDARY}>
              {c.how.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Features                                                           */
/* ------------------------------------------------------------------ */

function Features({ c }: { c: Copy }) {
  return (
    <section className="border-y border-line bg-surface/30 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <Reveal>
            <p className="tech-eyebrow text-accent">{c.features.eyebrow}</p>
          </Reveal>
          <Reveal delay={70}>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              {c.features.title}
            </h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-5 text-lg leading-8 text-ink-muted">{c.features.subtitle}</p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {c.features.items.map((item, i) => {
            const Icon = FEATURE_ICONS[i];
            return (
              <Reveal key={item.title} delay={i * 70}>
                <div className="hover-lift h-full rounded-2xl border border-line bg-canvas p-6 hover:border-line-strong">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line-strong text-accent">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-6 font-display text-lg font-semibold tracking-tight text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">{item.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Trust                                                              */
/* ------------------------------------------------------------------ */

function Trust({ c }: { c: Copy }) {
  return (
    <section className="py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <Reveal>
              <p className="tech-eyebrow text-accent">{c.trust.eyebrow}</p>
            </Reveal>
            <Reveal delay={70}>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                {c.trust.title}
              </h2>
            </Reveal>
            <Reveal delay={140}>
              <p className="mt-5 max-w-xl text-lg leading-8 text-ink-muted">
                {c.trust.subtitle}
              </p>
            </Reveal>
            <Reveal delay={200}>
              <div className="mt-8">
                <Link href="/register" className={BTN_PRIMARY}>
                  {c.trust.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>

          <div className="space-y-3">
            {c.trust.points.map((point, i) => (
              <Reveal key={point} delay={i * 70}>
                <div className="hover-lift flex items-start gap-3 rounded-2xl border border-line bg-surface p-5 hover:border-line-strong">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-lime text-[var(--accent-ink)]">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm leading-6 text-ink">{point}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Testimonial                                                        */
/* ------------------------------------------------------------------ */

function Testimonial({ c }: { c: Copy }) {
  return (
    <section className="border-y border-line bg-surface/30 py-24 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <Reveal>
          <p className="tech-eyebrow text-accent">{c.testimonial.eyebrow}</p>
        </Reveal>
        <Reveal delay={80}>
          <blockquote className="mt-6 font-display text-2xl font-medium leading-snug tracking-tight text-ink sm:text-3xl">
            {c.testimonial.quote}
          </blockquote>
        </Reveal>
        <Reveal delay={160}>
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-lime font-mono text-sm font-semibold text-[var(--accent-ink)]">
              SC
            </span>
            <div className="text-left">
              <div className="text-sm font-semibold text-ink">{c.testimonial.name}</div>
              <div className="font-mono text-xs text-ink-faint">{c.testimonial.role}</div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  CTA                                                                */
/* ------------------------------------------------------------------ */

function CTASection({ c }: { c: Copy }) {
  return (
    <section className="px-4 py-24 sm:px-6 sm:py-28 lg:px-8">
      <Reveal>
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-line-strong bg-surface p-10 text-center sm:p-16 lime-glow">
          <div className="pointer-events-none absolute inset-0 lime-radial" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full grid-bg opacity-40" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/5 px-3.5 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span className="tech-eyebrow text-ink-muted">{c.cta.eyebrow}</span>
            </div>
            <h2 className="mt-6 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-6xl">
              {c.cta.title}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-ink-muted">
              {c.cta.subtitle}
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register" className={BTN_PRIMARY}>
                {c.cta.primary}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/for-developers" className={BTN_SECONDARY}>
                {c.cta.secondary}
              </Link>
            </div>
            <p className="mt-6 font-mono text-xs text-ink-faint">{c.cta.note}</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */

function Footer({ c }: { c: Copy }) {
  const l = c.footer.links;
  return (
    <footer className="border-t border-line bg-canvas">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-lime text-[var(--accent-ink)]">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="font-display text-sm font-semibold tracking-tight text-ink">
                TaskMatch<span className="text-accent">.ai</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-6 text-ink-muted">{c.footer.tagline}</p>
          </div>

          <div>
            <h4 className="tech-eyebrow text-ink-faint">{c.footer.productTitle}</h4>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/how-it-works" className="text-sm text-ink-muted hover:text-ink">{l.howItWorks}</Link></li>
              <li><Link href="/pricing" className="text-sm text-ink-muted hover:text-ink">{l.pricing}</Link></li>
              <li><Link href="/for-clients" className="text-sm text-ink-muted hover:text-ink">{l.forClients}</Link></li>
              <li><Link href="/for-developers" className="text-sm text-ink-muted hover:text-ink">{l.forDevelopers}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="tech-eyebrow text-ink-faint">{c.footer.resourcesTitle}</h4>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/resources/documentation" className="text-sm text-ink-muted hover:text-ink">{l.documentation}</Link></li>
              <li><Link href="/resources/api-reference" className="text-sm text-ink-muted hover:text-ink">{l.apiReference}</Link></li>
              <li><Link href="/resources/sdk" className="text-sm text-ink-muted hover:text-ink">{l.sdk}</Link></li>
              <li><Link href="/changelog" className="text-sm text-ink-muted hover:text-ink">{l.changelog}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="tech-eyebrow text-ink-faint">{c.footer.companyTitle}</h4>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/company/about" className="text-sm text-ink-muted hover:text-ink">{l.about}</Link></li>
              <li><Link href="/company/careers" className="text-sm text-ink-muted hover:text-ink">{l.careers}</Link></li>
              <li><Link href="/legal/security" className="text-sm text-ink-muted hover:text-ink">{l.security}</Link></li>
              <li><Link href="/legal/privacy" className="text-sm text-ink-muted hover:text-ink">{l.privacy}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line pt-6 sm:flex-row">
          <p className="font-mono text-xs text-ink-faint">
            &copy; {new Date().getFullYear()} TaskMatch.ai. {c.footer.rights}
          </p>
          <div className="flex gap-5 font-mono text-xs text-ink-faint">
            <Link href="/legal/terms" className="hover:text-ink">{c.footer.terms}</Link>
            <Link href="/legal/privacy" className="hover:text-ink">{c.footer.privacy}</Link>
            <Link href="/legal/compliance" className="hover:text-ink">{c.footer.compliance}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

interface DemoResult {
  spec: { objective?: string | null; deliverables: string[]; success_criteria: string[] };
  tasks: { title: string; task_type: string; matched: { name: string; slug: string; score: number }[] }[];
}

function TryItLive({ c }: { c: Copy }) {
  const t = c.tryit;
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DemoResult | null>(null);
  const API = process.env.NEXT_PUBLIC_API_URL ?? "/api";

  async function run(text: string) {
    const q = text.trim();
    if (q.length < 10 || loading) return;
    setInput(text);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API}/v1/demo/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: q.slice(0, 2000) }),
      });
      if (!res.ok) throw new Error("bad");
      setResult((await res.json()) as DemoResult);
    } catch {
      setError(t.errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center">
            <div className="tech-eyebrow text-accent">{t.eyebrow}</div>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{t.title}</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-8 text-ink-muted">{t.body}</p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-10 rounded-2xl border border-line-strong bg-surface p-4 sm:p-5 card-glow">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder={t.placeholder}
              className="w-full resize-none rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-[var(--accent-lime)] focus:outline-none"
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {t.examples.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => run(ex)}
                    className="rounded-full border border-line px-3 py-1 text-xs text-ink-muted transition-colors hover:border-[var(--accent-lime)] hover:text-ink"
                  >
                    {ex.length > 42 ? ex.slice(0, 42) + "…" : ex}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => run(input)}
                disabled={loading || input.trim().length < 10}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-accent-lime px-6 text-sm font-semibold text-[var(--accent-ink)] transition-transform hover:scale-[1.03] disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? t.loading : t.button}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </Reveal>

        {error && <p className="mt-4 text-center text-sm text-red-400">{error}</p>}

        {loading && (
          <div className="mt-6 flex items-center justify-center gap-3 font-mono text-sm text-ink-muted">
            <span className="h-2 w-2 animate-ping rounded-full bg-accent-lime" />
            {t.loading}
          </div>
        )}

        {result && !loading && (
          <div className="mt-8 space-y-6">
            {/* Spec */}
            <div className="rounded-2xl border border-line bg-surface p-6">
              <div className="tech-eyebrow text-ink-faint">{t.specTitle}</div>
              {result.spec.objective && (
                <p className="mt-3 text-lg font-medium leading-8 text-ink">{result.spec.objective}</p>
              )}
              <div className="mt-5 grid gap-6 md:grid-cols-2">
                <div>
                  <div className="mb-2 text-sm font-semibold text-accent">{t.deliverablesLabel}</div>
                  <ul className="space-y-1.5">
                    {result.spec.deliverables.map((d, i) => (
                      <li key={i} className="flex gap-2 text-sm text-ink-muted">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="mb-2 text-sm font-semibold text-accent">{t.criteriaLabel}</div>
                  <ul className="space-y-1.5">
                    {result.spec.success_criteria.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-ink-muted">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Task breakdown + matched executors */}
            <div>
              <div className="tech-eyebrow mb-4 text-ink-faint">{t.breakdownTitle}</div>
              <div className="grid gap-4 md:grid-cols-2">
                {result.tasks.map((task, i) => (
                  <div key={i} className="rounded-2xl border border-line bg-surface p-5 hover-lift">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 font-mono text-xs text-accent">
                        {i + 1}
                      </span>
                      <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                        {task.task_type}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-ink">{task.title}</p>
                    <div className="mt-4">
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                        {t.matchedLabel}
                      </div>
                      <div className="space-y-1.5">
                        {task.matched.map((m, mi) => (
                          <div key={m.slug} className="flex items-center gap-2">
                            <span className={mi === 0 ? "text-accent" : "text-ink-muted"}>
                              {mi === 0 ? <Trophy className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                            </span>
                            <span className="w-28 shrink-0 truncate text-xs text-ink">{m.name}</span>
                            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                              <span
                                className="block h-full rounded-full bg-accent-lime"
                                style={{ width: `${Math.max(6, Math.min(100, m.score))}%` }}
                              />
                            </span>
                            <span className="w-10 shrink-0 text-right font-mono text-xs text-ink-muted">
                              {Math.round(m.score)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/register"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong px-6 text-sm font-medium text-ink transition-colors hover:bg-white/5"
              >
                {c.hero.ctaPrimary}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function DemoVideo({ c }: { c: Copy }) {
  return (
    <section className="relative overflow-hidden border-b border-line py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-0 lime-radial opacity-40" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center">
            <div className="tech-eyebrow text-accent">{c.demo.eyebrow}</div>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              {c.demo.title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-8 text-ink-muted">{c.demo.body}</p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-10 overflow-hidden rounded-2xl border border-line-strong bg-surface card-glow">
            <video
              className="aspect-video w-full bg-canvas"
              controls
              playsInline
              preload="metadata"
              poster="/demo/demo-poster.jpg"
            >
              <source src="/demo/taskmatch-demo.mp4" type="video/mp4" />
            </video>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <Navbar c={c} />
      <Hero c={c} />
      <Stats c={c} />
      <DemoVideo c={c} />
      <TryItLive c={c} />
      <HowItWorks c={c} />
      <Features c={c} />
      <Trust c={c} />
      <Testimonial c={c} />
      <CTASection c={c} />
      <Footer c={c} />
    </main>
  );
}
