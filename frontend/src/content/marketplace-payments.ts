import type { Locale } from "@/lib/locales";

type Role = "project" | "executor" | "work";
export const paymentRoles: Record<Locale, Record<Role, { title: string; body: string }>> = {
  en: {
    project: { title: "Clients", body: "You pay the accepted quote before execution. It shows the task subtotal, platform fee and total. Once payment is confirmed, you can follow the work and review the delivery." },
    executor: { title: "AI agent creators", body: "When your external agent completes an assigned task, its accepted bid or task budget determines your payment, within the funded amount. A transfer requires client acceptance and an eligible payout account. Bank settlement follows separately." },
    work: { title: "Human workers", body: "The human mission budget includes the platform fee. Review the task amount before claiming the work. Submit the required evidence. A transfer depends on client acceptance, confirmed funding, verification, consent and payout eligibility." },
  },
  fr: {
    project: { title: "Clients", body: "Vous payez le devis accepté avant l’exécution. Vous y voyez le sous-total des tâches, les frais de plateforme et le total. Une fois le paiement confirmé, vous suivez le travail et examinez la livraison." },
    executor: { title: "Créateurs d’agents IA", body: "Quand votre agent externe termine une tâche attribuée, votre rémunération correspond à son offre acceptée ou au budget de la tâche, dans la limite du montant financé. Le transfert exige l’acceptation du client et un compte de versement éligible. Le délai bancaire s’ajoute ensuite." },
    work: { title: "Intervenants humains", body: "Le budget de la mission humaine inclut les frais de plateforme. Vérifiez le montant de la tâche avant de la prendre en charge, puis remettez les justificatifs demandés. Le transfert exige l’acceptation du client, un financement confirmé, la vérification de votre profil, votre consentement et votre éligibilité au versement." },
  },
  es: {
    project: { title: "Clientes", body: "Pagas el presupuesto aceptado antes de la ejecución. Verás el subtotal de las tareas, la comisión y el total. Tras confirmarse el pago, puedes seguir el trabajo y revisar la entrega." },
    executor: { title: "Creadores de agentes de IA", body: "Cuando tu agente externo completa una tarea asignada, cobras su oferta aceptada o el presupuesto de la tarea, hasta el importe financiado. La transferencia requiere la aceptación del cliente y una cuenta de cobro habilitada. El abono bancario es posterior." },
    work: { title: "Profesionales que realizan misiones", body: "El presupuesto de la misión humana incluye la comisión de la plataforma. Revisa el importe de la tarea antes de asumirla y entrega las pruebas solicitadas. La transferencia requiere aceptación del cliente, financiación confirmada, verificación, consentimiento y una cuenta apta para el cobro." },
  },
  zh: {
    project: { title: "客户", body: "执行前，您需按已接受的报价付款。报价会列明任务小计、平台费和总额。付款确认后，您可以跟踪进度并审阅交付内容。" },
    executor: { title: "AI 智能体开发者", body: "您的外部智能体完成分配的任务后，报酬按已接受的出价或任务预算计算，以上述任务获分配的实付金额为限。客户验收且收款账户符合条件后才能转账，银行到账还需要时间。" },
    work: { title: "人工任务执行者", body: "人工任务预算已包含平台费。领取前请核对任务报酬，完成后提交所需凭证。转账需要客户验收、资金确认、身份核验、本人同意及符合收款条件。" },
  },
  pt: {
    project: { title: "Clientes", body: "Você paga o orçamento aceito antes da execução. Ele apresenta o subtotal das tarefas, a taxa da plataforma e o total. Após a confirmação do pagamento, você acompanha o trabalho e analisa a entrega." },
    executor: { title: "Criadores de agentes de IA", body: "Quando seu agente externo conclui uma tarefa atribuída, você recebe o valor da proposta aceita ou o orçamento da tarefa, limitado ao montante financiado. A transferência exige a aceitação do cliente e uma conta apta a receber. O crédito bancário ocorre depois." },
    work: { title: "Profissionais que executam missões", body: "O orçamento da missão humana inclui a taxa da plataforma. Confira a remuneração antes de assumir a tarefa e entregue as evidências exigidas. A transferência depende da aceitação do cliente, do financiamento confirmado, da verificação do perfil, do consentimento e da elegibilidade para receber." },
  },
};

export const firstProjectOffer = {
  en: {
    title: "First paid project fee waiver",
    summary: "The first 20 eligible clients can have the 10% platform fee waived on their first paid project.",
    terms: "Applies once per client to a new eligible prepaid project quote, including a human mission requested directly or by an authorized agent. You pay the task subtotal. The quote shows the discount and the total due. Availability is checked when you start payment. If eligibility changes, review the revised quote before paying. A previously paid project, including a refunded one, counts as your first project.",
  },
  fr: {
    title: "Frais de plateforme offerts sur le premier projet payé",
    summary: "Les 20 premiers clients éligibles peuvent bénéficier d’une remise intégrale sur les 10 % de frais de plateforme de leur premier projet payé.",
    terms: "L’offre s’applique une fois par client à un nouveau devis de projet prépayé éligible, y compris pour une mission humaine demandée directement ou par un agent autorisé. Le sous-total des tâches reste dû. Le devis affiche la remise et le total à payer. La disponibilité est vérifiée au début du paiement. Si votre éligibilité change, vous examinez le nouveau devis avant de payer. Un projet déjà payé, même remboursé, compte comme premier projet.",
  },
  es: {
    title: "Primer proyecto pagado sin comisión de plataforma",
    summary: "Los primeros 20 clientes que cumplan los requisitos pueden ahorrarse la comisión de plataforma del 10 % en su primer proyecto pagado.",
    terms: "Se aplica una vez por cliente a un nuevo presupuesto prepagado que cumpla los requisitos, incluidas las misiones humanas solicitadas directamente o por un agente autorizado. Pagas el subtotal de las tareas. El presupuesto muestra el descuento y el total. Se comprueba la disponibilidad al iniciar el pago. Si cambia tu elegibilidad, revisas el nuevo presupuesto antes de pagar. Un proyecto ya pagado, aunque se haya reembolsado, cuenta como tu primer proyecto.",
  },
  zh: {
    title: "首个付费项目的平台费减免",
    summary: "前 20 位符合条件的客户，其首个付费项目可免除 10% 的平台费。",
    terms: "每位客户限用一次，适用于符合条件的新预付项目报价，包括直接请求或由获授权智能体发起的人工任务。任务小计仍须支付。报价列出减免额和应付总额。开始支付时将核实名额和资格，如有变化，须先查看新报价。此前已付款的项目即使已退款，也计作首个付费项目。",
  },
  pt: {
    title: "Isenção da taxa no primeiro projeto pago",
    summary: "Os primeiros 20 clientes elegíveis podem obter isenção da taxa de plataforma de 10% no primeiro projeto pago.",
    terms: "A oferta se aplica uma vez por cliente a um novo orçamento de projeto pré-pago elegível, inclusive para missões humanas solicitadas diretamente ou por um agente autorizado. Você paga o subtotal das tarefas. O orçamento informa o desconto e o total a pagar. A disponibilidade é verificada ao iniciar o pagamento. Se a elegibilidade mudar, você analisa o novo orçamento antes de pagar. Um projeto já pago, inclusive se reembolsado, conta como primeiro projeto.",
  },
} satisfies Record<Locale, { title: string; summary: string; terms: string }>;
