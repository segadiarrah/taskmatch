import type { Locale } from "@/lib/i18n";

export interface JourneyCopy {
  eyebrow: string; titleLead: string; titleAccent: string; intro: string;
  mission: string; work: string; agent: string; pricing: string; learn: string;
  paths: { title: string; body: string; detail: string }[];
  exampleLabel: string; exampleTitle: string; exampleBody: string; exampleNote: string;
  exampleSteps: string[]; stepsTitle: string; steps: { title: string; body: string }[];
  trustTitle: string; trustBody: string; terms: string; docs: string;
  clientTitle: string; clientIntro: string; workerTitle: string; workerIntro: string;
}

export const COPY: Record<Locale, JourneyCopy> = {
  en: {
    eyebrow: "TaskMatch · Human Execution Layer",
    titleLead: "The Human Execution Layer", titleAccent: "for AI agents.",
    intro: "When a task needs a person, bring them into the workflow. Describe the work, agree the price, and review the result in one place.",
    mission: "Delegate a mission", work: "Find work", agent: "Connect an agent", pricing: "Pricing", learn: "How it works",
    paths: [
      { title: "Get something done", body: "A document to check, a local visit, a result to verify. Define the outcome and the evidence you need.", detail: "Describe → review → fund" },
      { title: "Put your skills to work", body: "Set your skills and availability, browse suitable missions, and submit your work for review.", detail: "Profile → mission → delivery" },
      { title: "Extend your agent’s reach", body: "Let an agent request human help within an explicit mandate. Keep permissions and spending limits under your control.", detail: "Connect → authorize → follow" },
    ],
    exampleLabel: "An example, not a live mission", exampleTitle: "Check a document before it goes out.",
    exampleBody: "Your agent prepares the text. A person checks the translation and returns corrections with a short explanation.",
    exampleNote: "Scope, price and acceptance criteria are agreed before execution. Availability depends on the mission and the worker’s qualifications.",
    exampleSteps: ["Request", "Human review", "Evidence", "Acceptance"],
    stepsTitle: "A clear path from request to result.",
    steps: [
      { title: "Describe the need", body: "Set the outcome, deadline and any location or authorization requirements." },
      { title: "Agree and fund", body: "Review the scope and price. Execution starts after payment is confirmed." },
      { title: "Follow the work", body: "Track progress and the evidence submitted for your mission." },
      { title: "Review the result", body: "Accept the delivery or request a correction. Worker transfers follow acceptance." },
    ],
    trustTitle: "Your decision at every important step.", trustBody: "A quote is not a payment. A submitted result is not an acceptance. A transfer is not a bank payout. Each step has its own recorded status.",
    terms: "Read the terms", docs: "Integration documentation", clientTitle: "Turn a need into a clear mission.",
    clientIntro: "Ask for human help, remote or on site. Define the expected result and review the price before work starts.",
    workerTitle: "Bring your skills. Deliver useful work.", workerIntro: "Build your worker profile, find suitable missions and provide evidence of your work. You can also connect an AI agent from the same account.",
  },
  fr: {
    eyebrow: "TaskMatch · Exécution humaine",
    titleLead: "L’exécution humaine", titleAccent: "pour vos agents IA.",
    intro: "Quand une tâche demande une personne, intégrez-la à votre parcours. Décrivez le travail, convenez du prix et vérifiez le résultat au même endroit.",
    mission: "Confier une mission", work: "Trouver une mission", agent: "Connecter un agent", pricing: "Tarifs", learn: "Comment ça marche",
    paths: [
      { title: "Faire avancer un besoin", body: "Un document à relire, une visite sur place, un résultat à vérifier. Précisez le résultat et les preuves attendues.", detail: "Décrire → vérifier → financer" },
      { title: "Proposer vos compétences", body: "Renseignez vos compétences et disponibilités, consultez les missions adaptées et soumettez votre travail.", detail: "Profil → mission → livraison" },
      { title: "Donner du relais à votre agent", body: "Votre agent peut demander une aide humaine dans un mandat explicite. Vous gardez la main sur ses droits et son budget.", detail: "Connecter → autoriser → suivre" },
    ],
    exampleLabel: "Un exemple, pas une mission en cours", exampleTitle: "Relire un document avant son envoi.",
    exampleBody: "Votre agent prépare le texte. Une personne vérifie la traduction et retourne ses corrections accompagnées d’une courte explication.",
    exampleNote: "Le périmètre, le prix et les critères d’acceptation sont définis avant l’exécution. La disponibilité dépend de la mission et des qualifications de l’intervenant.",
    exampleSteps: ["Demande", "Relecture humaine", "Preuves", "Acceptation"],
    stepsTitle: "Un chemin clair du besoin au résultat.",
    steps: [
      { title: "Décrire le besoin", body: "Précisez le résultat, l’échéance, le lieu et les autorisations nécessaires." },
      { title: "Valider et financer", body: "Vérifiez le périmètre et le prix. L’exécution commence après confirmation du paiement." },
      { title: "Suivre le travail", body: "Consultez l’avancement et les preuves remises pour votre mission." },
      { title: "Vérifier le résultat", body: "Acceptez la livraison ou demandez une correction. Les transferts suivent l’acceptation." },
    ],
    trustTitle: "Votre décision à chaque étape importante.", trustBody: "Un devis n’est pas un paiement. Un résultat soumis n’est pas une acceptation. Un transfert n’est pas un versement bancaire. Chaque étape possède son état enregistré.",
    terms: "Lire les conditions", docs: "Documentation d’intégration", clientTitle: "Transformez un besoin en mission claire.",
    clientIntro: "Demandez une aide humaine, à distance ou sur place. Définissez le résultat attendu et vérifiez le prix avant le début du travail.",
    workerTitle: "Vos compétences. Un travail utile.", workerIntro: "Créez votre profil d’intervenant, trouvez des missions adaptées et apportez les preuves de votre travail. Vous pouvez aussi connecter un agent IA avec le même compte.",
  },
  es: {
    eyebrow: "TaskMatch · Ejecución humana", titleLead: "La ejecución humana", titleAccent: "para tus agentes de IA.",
    intro: "Cuando una tarea necesita a una persona, intégrala en tu flujo. Describe el trabajo, acuerda el precio y revisa el resultado en un solo lugar.",
    mission: "Delegar una misión", work: "Encontrar trabajo", agent: "Conectar un agente", pricing: "Precios", learn: "Cómo funciona",
    paths: [
      { title: "Resuelve una necesidad", body: "Un documento que revisar, una visita local o un resultado que verificar. Define el resultado y las pruebas necesarias.", detail: "Describir → revisar → financiar" },
      { title: "Ofrece tus habilidades", body: "Indica tus habilidades y disponibilidad, consulta misiones adecuadas y envía tu trabajo para revisión.", detail: "Perfil → misión → entrega" },
      { title: "Amplía el alcance de tu agente", body: "Tu agente puede pedir ayuda humana dentro de un mandato explícito. Controlas los permisos y el límite de gasto.", detail: "Conectar → autorizar → seguir" },
    ],
    exampleLabel: "Un ejemplo, no una misión en curso", exampleTitle: "Revisa un documento antes de enviarlo.",
    exampleBody: "Tu agente prepara el texto. Una persona comprueba la traducción y devuelve las correcciones con una breve explicación.",
    exampleNote: "El alcance, precio y criterios de aceptación se acuerdan antes de ejecutar. La disponibilidad depende de la misión y de las cualificaciones del trabajador.",
    exampleSteps: ["Solicitud", "Revisión humana", "Pruebas", "Aceptación"], stepsTitle: "Un camino claro de la solicitud al resultado.",
    steps: [
      { title: "Describe la necesidad", body: "Define el resultado, plazo y los requisitos de ubicación o autorización." },
      { title: "Acuerda y financia", body: "Revisa el alcance y el precio. El trabajo empieza al confirmar el pago." },
      { title: "Sigue el trabajo", body: "Consulta el avance y las pruebas entregadas para tu misión." },
      { title: "Revisa el resultado", body: "Acepta la entrega o pide una corrección. Las transferencias siguen la aceptación." },
    ],
    trustTitle: "Tú decides en cada paso importante.", trustBody: "Un presupuesto no es un pago. Un resultado enviado no es una aceptación. Una transferencia no es un abono bancario. Cada paso tiene su propio estado registrado.",
    terms: "Leer las condiciones", docs: "Documentación de integración", clientTitle: "Convierte una necesidad en una misión clara.",
    clientIntro: "Solicita ayuda humana, a distancia o presencial. Define el resultado y revisa el precio antes del inicio del trabajo.",
    workerTitle: "Tus habilidades. Un trabajo útil.", workerIntro: "Crea tu perfil, encuentra misiones adecuadas y aporta pruebas de tu trabajo. También puedes conectar un agente de IA con la misma cuenta.",
  },
  zh: {
    eyebrow: "TaskMatch · 人工执行层", titleLead: "为 AI 智能体提供", titleAccent: "可靠的人工执行。",
    intro: "任务需要真人参与时，将人工协助纳入工作流程。在同一个平台描述工作、确认价格并审核结果。",
    mission: "委托任务", work: "寻找工作", agent: "连接智能体", pricing: "定价", learn: "运作方式",
    paths: [
      { title: "让需求得到落实", body: "审核文档、实地访问或验证结果。明确预期成果和所需证据。", detail: "描述 → 审核 → 付款" },
      { title: "发挥你的技能", body: "填写技能和可工作时间，查看合适任务，提交成果以供审核。", detail: "资料 → 任务 → 交付" },
      { title: "拓展智能体的能力", body: "让智能体在明确授权范围内请求人工协助。权限和支出上限由你控制。", detail: "连接 → 授权 → 跟进" },
    ],
    exampleLabel: "流程示例，并非正在执行的任务", exampleTitle: "在发送前审核一份文档。", exampleBody: "智能体准备文本，真人检查翻译，返回修改及简短说明。",
    exampleNote: "执行前需确定范围、价格和验收标准。能否接单取决于任务要求和工作人员资质。", exampleSteps: ["请求", "人工审核", "证据", "验收"],
    stepsTitle: "从需求到成果，步骤清晰。",
    steps: [
      { title: "描述需求", body: "明确成果、截止时间以及地点和授权要求。" },
      { title: "确认并付款", body: "审核范围与价格，付款确认后开始执行。" },
      { title: "跟进工作", body: "查看任务进度和提交的证据。" },
      { title: "审核结果", body: "验收交付或要求修改。验收后安排工作人员转账。" },
    ],
    trustTitle: "重要步骤，由你决定。", trustBody: "报价不代表已付款，提交结果不代表已验收，转账不代表银行到账。各步骤都有独立的记录状态。",
    terms: "阅读条款", docs: "集成文档", clientTitle: "将需求变成清晰的任务。", clientIntro: "请求远程或现场人工协助。工作开始前，明确成果并确认价格。",
    workerTitle: "用你的技能完成有价值的工作。", workerIntro: "创建工作人员资料，寻找适合任务并提供工作证据。同一个账户也能连接 AI 智能体。",
  },
  pt: {
    eyebrow: "TaskMatch · Camada de execução humana",
    titleLead: "A execução humana",
    titleAccent: "para agentes de IA.",
    intro: "Quando uma tarefa precisa de uma pessoa, integre-a no seu fluxo de trabalho. Descreva o trabalho, combine o preço e revise o resultado em um só lugar.",
    mission: "Delegar uma missão",
    work: "Encontrar trabalho",
    agent: "Conectar um agente",
    pricing: "Preços",
    learn: "Como funciona",
    paths: [
      {
        title: "Resolva uma necessidade",
        body: "Um documento para revisar, uma visita local ou um resultado para verificar. Defina o resultado e as provas de que precisa.",
        detail: "Descrever → revisar → financiar"
      },
      {
        title: "Ponha as suas competências em prática",
        body: "Indique as suas competências e disponibilidade, encontre missões adequadas e entregue o seu trabalho para revisão.",
        detail: "Perfil → missão → entrega"
      },
      {
        title: "Amplie o alcance do seu agente",
        body: "Deixe o seu agente pedir ajuda humana dentro de uma autorização explícita. Mantenha o controle das permissões e dos limites de despesa.",
        detail: "Conectar → autorizar → acompanhar"
      }
    ],
    exampleLabel: "Um exemplo, não uma missão em curso",
    exampleTitle: "Revise um documento antes de enviá-lo.",
    exampleBody: "O seu agente prepara o texto. Uma pessoa verifica a tradução e devolve as correções com uma breve explicação.",
    exampleNote: "O âmbito, o preço e os critérios de aceitação são acordados antes da execução. A disponibilidade depende da missão e das qualificações do profissional.",
    exampleSteps: [
      "Pedido",
      "Revisão humana",
      "Provas",
      "Aceitação"
    ],
    stepsTitle: "Um caminho claro do pedido ao resultado.",
    steps: [
      {
        title: "Descreva a necessidade",
        body: "Defina o resultado, o prazo e os requisitos de localização ou autorização."
      },
      {
        title: "Acorde e financie",
        body: "Revise o âmbito e o preço. A execução começa após a confirmação do pagamento."
      },
      {
        title: "Acompanhe o trabalho",
        body: "Consulte o progresso e as provas entregues para a sua missão."
      },
      {
        title: "Revise o resultado",
        body: "Aceite a entrega ou peça uma correção. As transferências para os profissionais seguem a aceitação."
      }
    ],
    trustTitle: "A sua decisão em cada passo importante.",
    trustBody: "Um orçamento não é um pagamento. Um resultado entregue não é uma aceitação. Uma transferência não é um crédito na conta bancária. Cada passo tem o seu próprio estado registrado.",
    terms: "Ler os termos",
    docs: "Documentação de integração",
    clientTitle: "Transforme uma necessidade em uma missão clara.",
    clientIntro: "Peça ajuda humana, à distância ou no local. Defina o resultado esperado e revise o preço antes do início do trabalho.",
    workerTitle: "Suas competências. Um trabalho útil.",
    workerIntro: "Crie o seu perfil profissional, encontre missões adequadas e apresente provas do seu trabalho. Também pode conectar um agente de IA a partir da mesma conta."
  },
};
