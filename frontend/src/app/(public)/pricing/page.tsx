"use client";

import Link from "next/link";
import { useTranslation, type Locale } from "@/lib/i18n";
import { PageHero } from "@/components/public/page-shell";
import { Reveal } from "@/components/public/motion";
import { ArrowRight, Banknote, Check } from "lucide-react";

type Copy = {
  eyebrow: string; title: string; accent: string; description: string;
  steps: { title: string; value: string; body: string }[];
  exampleTitle: string; example: string; includedTitle: string; included: string[];
  faqTitle: string; faqs: { q: string; a: string }[]; cta: string; contact: string;
};
const COPY: Record<Locale, Copy> = {
  en: {
    eyebrow: "Pricing", title: "One mission.", accent: "One prepaid quote.",
    description: "Pay for each mission in EUR. Review the scope and total before paying through Stripe Checkout; execution starts after payment confirmation. No subscription.",
    steps: [
      { title: "Mission subtotal", value: "EUR", body: "A quote based on the tasks, complexity and execution route. AI pricing includes provider costs, orchestration and validation." },
      { title: "Platform fee", value: "10 %", body: "Added to the mission subtotal and shown separately in your quote. This fee is not the platform’s entire margin." },
      { title: "Before execution", value: "Prepaid", body: "Accept and pay the quote before work begins. The amount you accepted is preserved if model prices change." },
    ],
    exampleTitle: "A simple example", example: "100 EUR mission subtotal + 10 EUR platform fee = 110 EUR total. Illustrative only; your mission has its own quote.",
    includedTitle: "Your mission, from brief to acceptance", included: ["A task plan and itemized quote", "AI or human execution according to the plan", "Recorded submissions and review history", "Client review before acceptance"],
    faqTitle: "Payment questions",
    faqs: [
      { q: "Is this a monthly plan?", a: "No. Each new mission receives a prepaid quote in EUR. There are no subscriptions, seat packages or unlimited-task plans." },
      { q: "When are developers paid?", a: "Eligible external developer transfers follow client acceptance and require a ready Stripe Connect account. A transfer is separate from arrival in a bank account." },
      { q: "What happens if a task fails?", a: "Other independent tasks can continue. The team can retry within limits or arrange human intervention. If the mission cannot be delivered, an operator can cancel it and request a full refund. Partial delivery and partial refunds are not offered at launch." },
      { q: "What does validation mean?", a: "Automated checks and any required human review are recorded. A structural check alone does not establish that a real-world task has been completed. You review the delivered work before accepting it." },
    ], cta: "Describe your mission", contact: "Discuss your requirements",
  },
  fr: {
    eyebrow: "Tarifs", title: "Une mission.", accent: "Un devis prépayé.",
    description: "Payez chaque mission en EUR. Vérifiez le périmètre et le total avant le paiement via Stripe Checkout ; l’exécution commence après confirmation du paiement. Sans abonnement.",
    steps: [
      { title: "Sous-total de la mission", value: "EUR", body: "Un devis selon les tâches, leur complexité et leur mode d’exécution. Le prix IA inclut les coûts fournisseur, l’orchestration et la validation." },
      { title: "Frais de plateforme", value: "10 %", body: "Ajoutés au sous-total et affichés séparément dans le devis. Ils ne représentent pas à eux seuls toute la marge de la plateforme." },
      { title: "Avant l’exécution", value: "Prépayé", body: "Acceptez et payez le devis avant le début du travail. Le montant accepté est conservé si les prix des modèles changent." },
    ],
    exampleTitle: "Un exemple simple", example: "100 EUR de sous-total + 10 EUR de frais de plateforme = 110 EUR au total. Exemple indicatif ; chaque mission a son propre devis.",
    includedTitle: "Du besoin à l’acceptation", included: ["Un plan de tâches et un devis détaillé", "Une exécution IA ou humaine selon le plan", "Les livrables et l’historique des revues", "Votre examen avant acceptation"],
    faqTitle: "Questions sur les paiements",
    faqs: [
      { q: "S’agit-il d’un forfait mensuel ?", a: "Non. Chaque nouvelle mission reçoit un devis prépayé en EUR, sans abonnement, forfait de sièges ni tâches illimitées." },
      { q: "Quand les développeurs sont-ils payés ?", a: "Les transferts aux développeurs externes éligibles suivent l’acceptation client et nécessitent un compte Stripe Connect opérationnel. Un transfert est distinct de son arrivée en banque." },
      { q: "Que se passe-t-il si une tâche échoue ?", a: "Les autres tâches indépendantes peuvent continuer. L’équipe peut relancer dans les limites prévues ou organiser une intervention humaine. Si la mission ne peut pas être livrée, un opérateur peut l’annuler et demander un remboursement intégral. La livraison et les remboursements partiels ne sont pas proposés au lancement." },
      { q: "Que signifie la validation ?", a: "Les contrôles automatisés et les revues humaines requises sont enregistrés. Un contrôle de structure ne prouve pas à lui seul qu’une tâche réelle a été accomplie. Vous examinez le travail livré avant de l’accepter." },
    ], cta: "Décrire votre mission", contact: "Discuter de vos besoins",
  },
  es: {
    eyebrow: "Precios", title: "Una misión.", accent: "Un presupuesto prepagado.",
    description: "Paga cada misión en EUR. Revisa el alcance y el total antes de pagar mediante Stripe Checkout; la ejecución empieza tras confirmar el pago. Sin suscripción.",
    steps: [
      { title: "Subtotal de la misión", value: "EUR", body: "Un presupuesto según las tareas, su complejidad y la ruta de ejecución. El precio de IA incluye proveedor, orquestación y validación." },
      { title: "Comisión de plataforma", value: "10 %", body: "Se añade al subtotal y aparece por separado en el presupuesto. Esta comisión no representa todo el margen de la plataforma." },
      { title: "Antes de ejecutar", value: "Prepago", body: "Acepta y paga el presupuesto antes de empezar. El importe aceptado se conserva aunque cambien los precios de los modelos." },
    ],
    exampleTitle: "Un ejemplo sencillo", example: "100 EUR de subtotal + 10 EUR de comisión = 110 EUR en total. Ejemplo ilustrativo; cada misión tiene su propio presupuesto.",
    includedTitle: "De la solicitud a la aceptación", included: ["Plan de tareas y presupuesto desglosado", "Ejecución por IA o personas según el plan", "Entregas e historial de revisiones", "Revisión del cliente antes de aceptar"],
    faqTitle: "Preguntas sobre pagos",
    faqs: [
      { q: "¿Es un plan mensual?", a: "No. Cada nueva misión recibe un presupuesto prepagado en EUR. No hay suscripciones, paquetes de asientos ni planes de tareas ilimitadas." },
      { q: "¿Cuándo cobran los desarrolladores?", a: "Las transferencias a desarrolladores externos elegibles siguen la aceptación del cliente y requieren una cuenta Stripe Connect preparada. Una transferencia es distinta de su llegada al banco." },
      { q: "¿Qué pasa si falla una tarea?", a: "Las otras tareas independientes pueden continuar. El equipo puede reintentar dentro de los límites o disponer intervención humana. Si no se puede entregar la misión, un operador puede cancelarla y solicitar un reembolso completo. No se ofrecen entregas ni reembolsos parciales en el lanzamiento." },
      { q: "¿Qué significa validar?", a: "Se registran las comprobaciones automáticas y las revisiones humanas requeridas. Una comprobación de estructura no demuestra por sí sola que una tarea real esté terminada. Revisas el trabajo antes de aceptarlo." },
    ], cta: "Describe tu misión", contact: "Habla de tus necesidades",
  },
  zh: {
    eyebrow: "价格", title: "一项任务。", accent: "一份预付报价。",
    description: "每个项目以 EUR 计价。在 Stripe Checkout 付款前确认范围和总额，付款确认后开始执行。无需订阅。",
    steps: [
      { title: "项目小计", value: "EUR", body: "报价取决于任务、复杂程度和执行路线。AI 价格包含供应商成本、编排和验证。" },
      { title: "平台费用", value: "10 %", body: "在项目小计基础上另加，并在报价中单独列出。这项费用并不代表平台的全部利润。" },
      { title: "执行之前", value: "预付", body: "在开始工作之前接受并支付报价。即使模型价格发生变化，已接受的金额也保持不变。" },
    ],
    exampleTitle: "简单示例", example: "100 EUR 项目小计 + 10 EUR 平台费用 = 110 EUR 总额。仅供说明，每个项目均有独立报价。",
    includedTitle: "从需求到验收", included: ["任务计划与明细报价", "按计划由 AI 或人工执行", "提交内容和审核历史", "客户审阅后验收"],
    faqTitle: "付款问题",
    faqs: [
      { q: "这是月费套餐吗？", a: "不是。每个新项目都有以 EUR 计价的预付报价，没有订阅、席位套餐或无限任务计划。" },
      { q: "开发者何时收到付款？", a: "符合条件的外部开发者在客户验收后安排转账，并需要已准备就绪的 Stripe Connect 账户。转账与资金到达银行账户是不同的步骤。" },
      { q: "如果任务失败会怎样？", a: "其他独立任务可以继续。团队可在限制内重试或安排人工处理。如果项目无法交付，操作员可以取消项目并申请全额退款。上线阶段不提供部分交付或部分退款。" },
      { q: "验证意味着什么？", a: "自动检查和必要的人工审核都会记录。结构检查本身不能证明现实中的任务已经完成。您在验收前审阅交付内容。" },
    ], cta: "描述您的项目", contact: "讨论您的需求",
  },
};

export default function PricingPage() {
  const { locale } = useTranslation();
  const c = COPY[locale];
  return (
    <div className="min-h-screen bg-ink-950 text-ink-50">
      <PageHero eyebrow={c.eyebrow} title={c.title} accent={c.accent} description={c.description} icon={Banknote} />
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
          {c.steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 80} className={`hover-lift rounded-lg border bg-ink-900 p-8 shadow-panel ${i === 1 ? "border-signal-500" : "border-ink-700"}`}>
              <h2 className="eyebrow text-signal-400">{step.title}</h2>
              <p className="mt-4 font-display text-4xl font-medium text-ink-50">{step.value}</p>
              <p className="mt-5 text-sm leading-7 text-ink-300">{step.body}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="border-y border-paper-ink/15 bg-paper px-4 py-16 text-paper-ink sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-3xl font-medium">{c.exampleTitle}</h2>
          <p className="mt-5 max-w-3xl text-lg leading-8">{c.example}</p>
        </div>
      </section>
      <section id="enterprise" className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-medium">{c.includedTitle}</h2>
          <ul className="mt-8 space-y-4">{c.included.map(item => <li key={item} className="flex gap-3 text-ink-300"><Check className="mt-1 h-4 w-4 shrink-0 text-signal-400" />{item}</li>)}</ul>
          <Link href="/register" className="mt-8 inline-flex h-12 items-center gap-2 rounded-md bg-signal-500 px-6 font-semibold text-ink-950 hover:bg-signal-400">{c.cta}<ArrowRight className="h-4 w-4" /></Link>
          <Link href="/company/contact" className="mt-5 block text-sm text-signal-400 hover:underline">{c.contact}</Link>
        </div>
        <div id="faq">
          <h2 className="font-display text-3xl font-medium">{c.faqTitle}</h2>
          <div className="mt-8 space-y-3">{c.faqs.map(item => <details key={item.q} className="rounded-lg border border-ink-700 bg-ink-900 p-6"><summary className="cursor-pointer font-semibold">{item.q}</summary><p className="mt-4 text-sm leading-7 text-ink-300">{item.a}</p></details>)}</div>
        </div>
      </section>
    </div>
  );
}
