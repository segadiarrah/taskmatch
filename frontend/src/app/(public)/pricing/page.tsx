"use client";

import Link from "@/components/public/localized-link";
import { useAuth } from "@/lib/auth";
import { authIntentHref, postAuthDestination, MARKETPLACE_INTENTS } from "@/lib/public-intent";
import { useTranslation, type Locale } from "@/lib/i18n";
import { COPY as journeyCopy } from "@/lib/landing-copy";
import { paymentRoles, firstProjectOffer } from "@/content/marketplace-payments";
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
    description: "Your quote shows the scope, total and billing currency before you pay. Work starts once payment is confirmed. No subscription.",
    steps: [
      { title: "Mission subtotal", value: "Per project", body: "A quote based on the tasks, complexity and execution route. AI pricing includes provider costs, orchestration and validation." },
      { title: "Platform fee", value: "10 %", body: "Added to the mission subtotal and shown separately in your quote. This fee is not the platform’s entire margin." },
      { title: "Before execution", value: "Prepaid", body: "Accept and pay the quote before work begins. The amount you accepted is preserved if model prices change." },
    ],
    exampleTitle: "A simple example", example: "For a task subtotal of 100, the standard 10% platform fee adds 10, bringing the total to 110 in the currency shown on the quote.",
    includedTitle: "Your mission, from brief to acceptance", included: ["A task plan and itemized quote", "AI or human execution according to the plan", "Recorded submissions and review history", "Client review before acceptance"],
    faqTitle: "Payment questions",
    faqs: [
      { q: "Is this a monthly plan?", a: "No. Each new mission receives a prepaid quote. There are no subscriptions, seat packages or unlimited-task plans." },
      { q: "When are developers paid?", a: "Eligible external developer transfers follow client acceptance and require a ready payout account. A transfer is separate from arrival in a bank account." },
      { q: "What happens if a task fails?", a: "Other independent tasks can continue. The team can retry within limits or arrange human intervention. If the mission cannot be delivered, an operator can cancel it and request a full refund. Partial delivery and partial refunds are not offered at launch." },
      { q: "What does validation mean?", a: "Automated checks and any required human review are recorded. A structural check alone does not establish that a real-world task has been completed. You review the delivered work before accepting it." },
    ], cta: "Describe your project", contact: "Discuss your requirements",
  },
  fr: {
    eyebrow: "Tarifs", title: "Une mission.", accent: "Un devis prépayé.",
    description: "Le devis indique le périmètre de la mission, le total et la devise de facturation avant le paiement. Le travail commence une fois le paiement confirmé. Sans abonnement.",
    steps: [
      { title: "Sous-total de la mission", value: "Sur devis", body: "Un devis selon les tâches, leur complexité et leur mode d’exécution. Le prix IA inclut les coûts fournisseur, l’orchestration et la validation." },
      { title: "Frais de plateforme", value: "10 %", body: "Ajoutés au sous-total et affichés séparément dans le devis. Ils ne représentent pas à eux seuls toute la marge de la plateforme." },
      { title: "Avant l’exécution", value: "Prépayé", body: "Acceptez et payez le devis avant le début du travail. Le montant accepté est conservé si les prix des modèles changent." },
    ],
    exampleTitle: "Un exemple simple", example: "Pour un sous-total de 100, les frais de plateforme habituels de 10 % ajoutent 10, soit un total de 110 dans la devise du devis.",
    includedTitle: "Du besoin à l’acceptation", included: ["Un plan de tâches et un devis détaillé", "Une exécution IA ou humaine selon le plan", "Les livrables et l’historique des revues", "Votre examen avant acceptation"],
    faqTitle: "Questions sur les paiements",
    faqs: [
      { q: "S’agit-il d’un forfait mensuel ?", a: "Non. Chaque nouvelle mission reçoit un devis prépayé, sans abonnement, forfait de sièges ni tâches illimitées." },
      { q: "Quand les développeurs sont-ils payés ?", a: "Les transferts aux développeurs externes éligibles suivent l’acceptation client et nécessitent un compte de versement opérationnel. Un transfert est distinct de son arrivée en banque." },
      { q: "Que se passe-t-il si une tâche échoue ?", a: "Les autres tâches indépendantes peuvent continuer. L’équipe peut relancer dans les limites prévues ou organiser une intervention humaine. Si la mission ne peut pas être livrée, un opérateur peut l’annuler et demander un remboursement intégral. La livraison et les remboursements partiels ne sont pas proposés au lancement." },
      { q: "Que signifie la validation ?", a: "Les contrôles automatisés et les revues humaines requises sont enregistrés. Un contrôle de structure ne prouve pas à lui seul qu’une tâche réelle a été accomplie. Vous examinez le travail livré avant de l’accepter." },
    ], cta: "Décrire votre projet", contact: "Discuter de vos besoins",
  },
  es: {
    eyebrow: "Precios", title: "Una misión.", accent: "Un presupuesto prepagado.",
    description: "El presupuesto indica el alcance, el total y la moneda de facturación antes de pagar. El trabajo empieza cuando se confirma el pago. Sin suscripción.",
    steps: [
      { title: "Subtotal de la misión", value: "Por proyecto", body: "Un presupuesto según las tareas, su complejidad y la ruta de ejecución. El precio de IA incluye proveedor, orquestación y validación." },
      { title: "Comisión de plataforma", value: "10 %", body: "Se añade al subtotal y aparece por separado en el presupuesto. Esta comisión no representa todo el margen de la plataforma." },
      { title: "Antes de ejecutar", value: "Prepago", body: "Acepta y paga el presupuesto antes de empezar. El importe aceptado se conserva aunque cambien los precios de los modelos." },
    ],
    exampleTitle: "Un ejemplo sencillo", example: "Para un subtotal de 100, la comisión habitual del 10 % añade 10. El total es de 110 en la moneda del presupuesto.",
    includedTitle: "De la solicitud a la aceptación", included: ["Plan de tareas y presupuesto desglosado", "Ejecución por IA o personas según el plan", "Entregas e historial de revisiones", "Revisión del cliente antes de aceptar"],
    faqTitle: "Preguntas sobre pagos",
    faqs: [
      { q: "¿Es un plan mensual?", a: "No. Cada nueva misión recibe un presupuesto prepagado. No hay suscripciones, paquetes de asientos ni planes de tareas ilimitadas." },
      { q: "¿Cuándo cobran los desarrolladores?", a: "Las transferencias a desarrolladores externos elegibles siguen la aceptación del cliente y requieren una cuenta de cobros preparada. Una transferencia es distinta de su llegada al banco." },
      { q: "¿Qué pasa si falla una tarea?", a: "Las otras tareas independientes pueden continuar. El equipo puede reintentar dentro de los límites o disponer intervención humana. Si no se puede entregar la misión, un operador puede cancelarla y solicitar un reembolso completo. No se ofrecen entregas ni reembolsos parciales en el lanzamiento." },
      { q: "¿Qué significa validar?", a: "Se registran las comprobaciones automáticas y las revisiones humanas requeridas. Una comprobación de estructura no demuestra por sí sola que una tarea real esté terminada. Revisas el trabajo antes de aceptarlo." },
    ], cta: "Describe tu proyecto", contact: "Habla de tus necesidades",
  },
  zh: {
    eyebrow: "价格", title: "一项任务。", accent: "一份预付报价。",
    description: "付款前，您可以在报价中查看项目范围、总额和结算币种。付款确认后开始执行。无需订阅。",
    steps: [
      { title: "项目小计", value: "按项目报价", body: "报价取决于任务、复杂程度和执行路线。AI 价格包含供应商成本、编排和验证。" },
      { title: "平台费用", value: "10 %", body: "在项目小计基础上另加，并在报价中单独列出。这项费用并不代表平台的全部利润。" },
      { title: "执行之前", value: "预付", body: "在开始工作之前接受并支付报价。即使模型价格发生变化，已接受的金额也保持不变。" },
    ],
    exampleTitle: "简单示例", example: "例如，任务小计为 100，按常规费率 10% 计算，平台费为 10，总计 110。所有金额均以报价所示币种计价。",
    includedTitle: "从需求到验收", included: ["任务计划与明细报价", "按计划由 AI 或人工执行", "提交内容和审核历史", "客户审阅后验收"],
    faqTitle: "付款问题",
    faqs: [
      { q: "这是月费套餐吗？", a: "不是。每个新项目都有预付报价，没有订阅、席位套餐或无限任务计划。" },
      { q: "开发者何时收到付款？", a: "符合条件的外部开发者在客户验收后安排转账，并需要已准备就绪的 收款 账户。转账与资金到达银行账户是不同的步骤。" },
      { q: "如果任务失败会怎样？", a: "其他独立任务可以继续。团队可在限制内重试或安排人工处理。如果项目无法交付，操作员可以取消项目并申请全额退款。上线阶段不提供部分交付或部分退款。" },
      { q: "验证意味着什么？", a: "自动检查和必要的人工审核都会记录。结构检查本身不能证明现实中的任务已经完成。您在验收前审阅交付内容。" },
    ], cta: "描述您的项目", contact: "讨论您的需求",
  },
  pt: {
    eyebrow: "Preços",
    title: "Uma missão.",
    accent: "Um orçamento pré-pago.",
    description: "O orçamento indica o escopo, o total e a moeda de cobrança antes do pagamento. O trabalho começa após a confirmação do pagamento. Sem assinatura.",
    steps: [
      {
        title: "Subtotal da missão",
        value: "Por projeto",
        body: "Um orçamento baseado nas tarefas, na complexidade e no modo de execução. O preço da IA inclui os custos do fornecedor, a orquestração e a validação."
      },
      {
        title: "Taxa da plataforma",
        value: "10 %",
        body: "Acrescentada ao subtotal da missão e apresentada separadamente no orçamento. Esta taxa não representa toda a margem da plataforma."
      },
      {
        title: "Antes da execução",
        value: "Pré-pago",
        body: "Aceite e pague o orçamento antes do início do trabalho. O valor aceito mantém-se se os preços dos modelos mudarem."
      }
    ],
    exampleTitle: "Um exemplo simples",
    example: "Para um subtotal de 100, a taxa habitual de 10% acrescenta 10. O total é de 110 na moeda indicada no orçamento.",
    includedTitle: "A sua missão, do pedido à aceitação",
    included: [
      "Plano de tarefas e orçamento discriminado",
      "Execução por IA ou pessoas de acordo com o plano",
      "Entregas registradas e histórico de revisão",
      "Revisão do cliente antes da aceitação"
    ],
    faqTitle: "Perguntas sobre pagamentos",
    faqs: [
      {
        q: "É um plano mensal?",
        a: "Não. Cada nova missão recebe um orçamento pré-pago. Não existem assinaturas, pacotes de usuários ou planos com tarefas ilimitadas."
      },
      {
        q: "Quando recebem os desenvolvedores?",
        a: "As transferências para desenvolvedores externos elegíveis seguem a aceitação do cliente e exigem uma conta de recebimento pronta. Uma transferência é diferente da chegada do dinheiro à conta bancária."
      },
      {
        q: "O que acontece se uma tarefa falhar?",
        a: "As outras tarefas independentes podem continuar. A equipe pode tentar novamente dentro dos limites ou organizar uma intervenção humana. Se a missão não puder ser entregue, um operador pode cancelá-la e pedir um reembolso integral. No lançamento, não são disponibilizadas entregas nem reembolsos parciais."
      },
      {
        q: "O que significa validação?",
        a: "As verificações automáticas e as revisões humanas necessárias ficam registradas. Uma verificação de estrutura, por si só, não prova que uma tarefa real foi concluída. Revise o trabalho entregue antes de aceitá-lo."
      }
    ],
    cta: "Descreva seu projeto",
    contact: "Fale sobre as suas necessidades"
  },
};

export default function PricingPage() {
  const { locale } = useTranslation();
  const { user } = useAuth();
  const c = COPY[locale];
  const labels = journeyCopy[locale];
  const roles = paymentRoles[locale];
  const offer = firstProjectOffer[locale];
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
      <section id="first-project" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-16 sm:px-6">
        <h2 className="font-display text-3xl font-semibold">{offer.title}</h2>
        <p className="mt-4 max-w-3xl text-lg leading-8">{offer.summary}</p>
        <p className="mt-3 max-w-3xl leading-7 text-ink-300">{offer.terms}</p>
      </section>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-16 sm:px-6 lg:grid-cols-3">
        {MARKETPLACE_INTENTS.map(intent => <section key={intent} className="flex flex-col border-t border-ink-700 pt-6">
          <h2 className="font-display text-2xl font-semibold">{roles[intent].title}</h2>
          <p className="my-4 flex-1 leading-7 text-ink-300">{roles[intent].body}</p>
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-signal-600 underline" href={user ? postAuthDestination(user.role, intent) : authIntentHref("register", intent)}>
            {labels[intent]}<ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </section>)}
      </div>
      <section id="enterprise" className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-medium">{c.includedTitle}</h2>
          <ul className="mt-8 space-y-4">{c.included.map(item => <li key={item} className="flex gap-3 text-ink-300"><Check className="mt-1 h-4 w-4 shrink-0 text-signal-400" />{item}</li>)}</ul>
          <Link href="/resources/documentation#billing" className="mt-5 block text-sm text-signal-400 hover:underline">{labels.docs}</Link>
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
