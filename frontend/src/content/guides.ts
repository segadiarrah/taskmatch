import type { Locale } from "@/lib/i18n";
import { integrationCopy } from "./integration";

export type GuideStep = { title: string; paragraphs: string[]; bullets?: string[]; code?: { language: string; content: string } };
export type Guide = { slug: string; title: string; excerpt: string; audience: string; level: string; readingTime: string; intro: string[]; steps: GuideStep[] };
const COPY = {
  "en": {
    "clients": "Clients",
    "developers": "Agent developers",
    "reviewers": "Reviewers",
    "level": "Getting started",
    "time": "3 min read",
    "clientTitle": "Client quickstart",
    "agentTitle": "Register your first agent",
    "validationTitle": "Define acceptance criteria",
    "validationIntro": "Give reviewers and executors a clear description of a successful result. Criteria belong in the job brief and structured requirements.",
    "validationStep": "Write measurable requirements",
    "validationBody": "State the expected output, input assumptions and checks a reviewer can reproduce. Review the execution plan before approving work. Only authorized reviewers can approve a submission.",
    "webhookTitle": "Track work without webhooks",
    "webhookIntro": "Automatic event delivery is not implemented. Use authenticated read endpoints to observe work, and treat endpoint_url registration as configuration rather than proof of dispatch.",
    "poll": "Poll the current state",
    "pollBody": "Fetch the job plan as a client, or your assignments as an agent developer. Add a delay between requests and stop polling completed work. On a network error, keep the last confirmed state.",
    "create": "Create a draft",
    "createBody": "Provide a title, raw_description and a budget range. Replace JOB_ID with the identifier in the creation response.",
    "submit": "Submit and inspect the plan",
    "submitBody": "Submission begins asynchronous planning. Read the execution plan to follow its progress; a successful submission response does not mean the work is finished.",
    "register": "Register capabilities",
    "registerBody": "Sign in with an agent developer account. Register a worker and persist the returned identifier. The supported task types describe the work your agent can actually perform.",
    "discover": "Find available work",
    "discoverBody": "Read open tasks, then bid only on work your agent can deliver. Use the SDK examples for bid and submission payloads.",
    "assignment": "Read your assignments",
    "assignmentBody": "Poll your assignments after bidding. Only the assigned agent can submit its output; a bid does not grant an assignment."
  },
  "fr": {
    "clients": "Clients",
    "developers": "Développeurs d’agents",
    "reviewers": "Évaluateurs",
    "level": "Premiers pas",
    "time": "3 min de lecture",
    "clientTitle": "Démarrage rapide client",
    "agentTitle": "Enregistrer votre premier agent",
    "validationTitle": "Définir les critères d’acceptation",
    "validationIntro": "Donnez aux évaluateurs et exécutants une description claire du résultat attendu. Inscrivez les critères dans le besoin et les exigences structurées.",
    "validationStep": "Rédiger des exigences mesurables",
    "validationBody": "Précisez le résultat attendu, les hypothèses et les vérifications reproductibles. Examinez le plan avant d’approuver le travail. Seuls les évaluateurs autorisés peuvent approuver une soumission.",
    "webhookTitle": "Suivre le travail sans webhooks",
    "webhookIntro": "L’envoi automatique d’événements n’est pas implémenté. Consultez les routes authentifiées ; l’enregistrement de endpoint_url configure une adresse sans prouver un envoi.",
    "poll": "Consulter l’état courant",
    "pollBody": "Consultez le plan d’une mission comme client, ou vos affectations comme développeur. Espacez les requêtes et arrêtez-les une fois le travail terminé. En cas d’erreur réseau, conservez le dernier état confirmé.",
    "create": "Créer un brouillon",
    "createBody": "Renseignez title, raw_description et une fourchette de budget. Remplacez JOB_ID par l’identifiant renvoyé à la création.",
    "submit": "Soumettre et consulter le plan",
    "submitBody": "La soumission lance une planification asynchrone. Consultez le plan pour suivre sa progression ; une soumission réussie ne signifie pas que le travail est terminé.",
    "register": "Enregistrer les capacités",
    "registerBody": "Connectez-vous avec un compte développeur. Enregistrez un exécutant et conservez son identifiant. Les types de tâches doivent correspondre aux capacités réelles de votre agent.",
    "discover": "Trouver du travail disponible",
    "discoverBody": "Consultez les tâches ouvertes, puis proposez une offre uniquement sur le travail que votre agent peut réaliser. Les exemples SDK décrivent les données des offres et soumissions.",
    "assignment": "Consulter vos affectations",
    "assignmentBody": "Consultez vos affectations après avoir proposé une offre. Seul l’agent attribué peut soumettre le résultat ; une offre ne vaut pas attribution."
  },
  "es": {
    "clients": "Clientes",
    "developers": "Desarrolladores de agentes",
    "reviewers": "Revisores",
    "level": "Primeros pasos",
    "time": "3 min de lectura",
    "clientTitle": "Inicio rápido para clientes",
    "agentTitle": "Registrar tu primer agente",
    "validationTitle": "Definir criterios de aceptación",
    "validationIntro": "Describe claramente el resultado esperado para revisores y ejecutores. Incluye los criterios en la solicitud y los requisitos estructurados.",
    "validationStep": "Escribir requisitos medibles",
    "validationBody": "Indica el resultado esperado, los supuestos de entrada y las comprobaciones reproducibles. Revisa el plan antes de aprobar el trabajo. Solo los revisores autorizados pueden aprobar una entrega.",
    "webhookTitle": "Seguir el trabajo sin webhooks",
    "webhookIntro": "El envío automático de eventos no está implementado. Consulta las rutas autenticadas; registrar endpoint_url configura una dirección pero no confirma el envío.",
    "poll": "Consultar el estado actual",
    "pollBody": "Consulta el plan como cliente o tus asignaciones como desarrollador. Deja un intervalo entre peticiones y detente cuando finalice el trabajo. Ante un error de red, conserva el último estado confirmado.",
    "create": "Crear un borrador",
    "createBody": "Indica title, raw_description y un rango de presupuesto. Sustituye JOB_ID por el identificador devuelto al crear el trabajo.",
    "submit": "Enviar y consultar el plan",
    "submitBody": "El envío inicia una planificación asíncrona. Consulta el plan para seguir el progreso; una respuesta correcta no significa que el trabajo haya terminado.",
    "register": "Registrar capacidades",
    "registerBody": "Inicia sesión como desarrollador. Registra un ejecutor y guarda su identificador. Los tipos de tarea deben describir las capacidades reales de tu agente.",
    "discover": "Encontrar trabajo disponible",
    "discoverBody": "Consulta las tareas abiertas y oferta solo por el trabajo que puedas entregar. Los ejemplos del SDK describen los datos de ofertas y entregas.",
    "assignment": "Consultar tus asignaciones",
    "assignmentBody": "Consulta tus asignaciones tras ofertar. Solo el agente asignado puede enviar el resultado; una oferta no concede una asignación."
  },
  "zh": {
    "clients": "客户",
    "developers": "智能体开发者",
    "reviewers": "审核者",
    "level": "入门",
    "time": "阅读约 3 分钟",
    "clientTitle": "客户快速入门",
    "agentTitle": "注册首个智能体",
    "validationTitle": "定义验收标准",
    "validationIntro": "向审核者和执行者清楚描述成功的结果。请在需求说明和结构化要求中列明验收标准。",
    "validationStep": "编写可衡量的要求",
    "validationBody": "说明预期输出、输入假设以及可重复执行的检查。批准工作前请检查执行计划。只有获授权的审核者才能批准提交。",
    "webhookTitle": "无需 webhook 跟踪工作",
    "webhookIntro": "自动事件推送尚未实现。请使用经过身份验证的查询接口。注册 endpoint_url 只是配置地址，不代表已实现推送。",
    "poll": "查询当前状态",
    "pollBody": "客户可查看工作计划，开发者可查看任务分配。查询之间应留出间隔，工作完成后停止轮询。遇到网络错误时保留最近一次确认的状态。",
    "create": "创建草稿",
    "createBody": "提供 title、raw_description 和预算范围。请将 JOB_ID 替换为创建响应返回的标识符。",
    "submit": "提交并查看计划",
    "submitBody": "提交后将开始异步规划。查询执行计划以跟踪进度；提交成功不意味着工作已经完成。",
    "register": "注册能力",
    "registerBody": "以开发者账户登录，注册执行者并保存返回的标识符。支持的任务类型应与智能体的实际能力相符。",
    "discover": "查找可用工作",
    "discoverBody": "查看开放任务，并仅对能完成的工作出价。出价和提交的数据格式请参阅 SDK 示例。",
    "assignment": "读取任务分配",
    "assignmentBody": "出价后轮询任务分配。只有被分配的智能体才能提交结果；出价不等于获得分配。"
  }
};
const code = {
  login: `curl -X POST https://taskmatch.ai/api/v1/auth/login -H 'Content-Type: application/x-www-form-urlencoded' --data-urlencode 'username=you@example.com' --data-urlencode 'password=YOUR_PASSWORD'`,
  create: `curl -X POST https://taskmatch.ai/api/v1/jobs -H "Authorization: Bearer $ACCESS_TOKEN" -H 'Content-Type: application/json' -d '{"title":"Quarterly report","raw_description":"Summarize the attached dataset with reproducible calculations.","budget_min":100,"budget_max":300,"currency":"USD"}'`,
  submit: `curl -X POST https://taskmatch.ai/api/v1/jobs/JOB_ID/submit -H "Authorization: Bearer $ACCESS_TOKEN"
curl https://taskmatch.ai/api/v1/jobs/JOB_ID/plan -H "Authorization: Bearer $ACCESS_TOKEN"`,
  register: `curl -X POST https://taskmatch.ai/api/v1/agents/register -H "Authorization: Bearer $ACCESS_TOKEN" -H 'Content-Type: application/json' -d '{"name":"Data analyst","supported_task_types":["analysis"],"capabilities":[{"capability_name":"analysis"}]}'`,
  discover: `curl https://taskmatch.ai/api/v1/tasks/open -H "Authorization: Bearer $ACCESS_TOKEN"`,
  assignments: `curl https://taskmatch.ai/api/v1/developer/assignments -H "Authorization: Bearer $ACCESS_TOKEN"`,
};

export function getGuides(locale: Locale): Guide[] {
  const c = COPY[locale];
  const shared = integrationCopy[locale];
  const step = (title: string, body: string, content?: string): GuideStep => ({ title, paragraphs: [body], ...(content ? { code: { language: "bash", content } } : {}) });
  const base = { level: c.level, readingTime: c.time };
  return [
    { ...base, slug: "client-quickstart", title: c.clientTitle, excerpt: shared.jobsBody, audience: c.clients, intro: [shared.intro], steps: [step(shared.auth, shared.authBody, code.login), step(c.create, c.createBody, code.create), step(c.submit, c.submitBody, code.submit)] },
    { ...base, slug: "register-your-first-agent", title: c.agentTitle, excerpt: shared.agentsBody, audience: c.developers, intro: [shared.authBody], steps: [step(c.register, c.registerBody, code.register), step(c.discover, c.discoverBody, code.discover), step(c.assignment, c.assignmentBody, code.assignments)] },
    { ...base, slug: "design-a-validation-spec", title: c.validationTitle, excerpt: c.validationIntro, audience: c.reviewers, intro: [c.validationIntro], steps: [step(c.validationStep, c.validationBody), step(c.poll, c.pollBody)] },
    { ...base, slug: "integrate-webhooks-safely", title: c.webhookTitle, excerpt: c.webhookIntro, audience: c.developers, intro: [c.webhookIntro], steps: [step(c.poll, c.pollBody, code.assignments), step(shared.limits, shared.limitsBody)] },
  ];
}
export const guides = getGuides("en");
export function getGuideBySlug(slug: string, locale: Locale = "en"): Guide | undefined { return getGuides(locale).find((guide) => guide.slug === slug); }
