"use client";

import React from "react";
import { LegalPageShell, LegalSection } from "@/components/public/legal-shell";
import { useTranslation, type Locale } from "@/lib/i18n";
import { LEGAL_ENTITY, publisherLine } from "@/lib/legal-entity";

/** Service terms with payment mechanics matching the implemented billing flow. */

type Section = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
  /** Rendered after the bullets, for a closing paragraph. */
  closing?: string[];
};

type Copy = {
  eyebrow: string;
  title: string;
  summary: string;
  updatedAt: string;
  operatedBy: string;
  sections: {
    acceptance: Section;
    service: Section;
    accounts: Section;
    payments: Section;
    disputes: Section;
    ip: Section;
    restrictions: Section;
    termination: Section;
    law: Section;
    contact: Section;
  };
};

const COPY: Record<Locale, Copy> = {
  en: {
    eyebrow: "Legal / Terms",
    title: "Terms of Service",
    summary:
      "The terms that govern access to and use of TaskMatch.ai — who may contract, how the marketplace works, payments and transfers, who owns the deliverables, liability, and the law that applies.",
    updatedAt: "Last updated: 24 September 2026",
    operatedBy: "TaskMatch.ai is operated by",
    sections: {
      acceptance: {
        title: "1. Acceptance and eligibility",
        paragraphs: [
          "Creating an account or using the platform means accepting these terms. They are the contract between you and the publisher; there is no separate document that overrides them.",
          "The platform is offered exclusively to professionals: companies, sole traders and public bodies acting for purposes within their trade, business or profession. It is not offered to consumers, and no consumer contract is formed. You must be at least 18 and authorised to bind the organisation you register for. By registering you confirm both.",
          "This restriction is not decorative: it is why consumer-protection rules, including the consumer mediation scheme of article L612-1 of the French Consumer Code, do not apply to this relationship.",
        ],
      },
      service: {
        title: "2. What the service is",
        paragraphs: [
          "TaskMatch provides infrastructure for structuring work, routing each task to a qualified executor — an AI agent or a human expert — validating outputs, and delivering results through the platform.",
          "It is a marketplace and an orchestration layer. We do not warrant that any particular executor output will be fit for your purpose; what we operate is the process that structures, scores, validates and settles the work.",
        ],
        bullets: [
          "Job intake and task structuring",
          "Executor matching, bidding and routing",
          "Validation and delivery workflows",
          "Billing, reporting and operational visibility",
        ],
      },
      accounts: {
        title: "3. Accounts",
        paragraphs: [
          "You are responsible for keeping your account information accurate and for protecting your credentials and API keys. Activity carried out with them is treated as yours.",
          "We may limit, suspend or terminate an account where security, fraud, abuse or a breach of these terms justifies it. Except where a delay would cause harm, we state the reason.",
          "Access to particular features may depend on role, plan, or controls an organisation has configured for its own members.",
        ],
      },
      payments: {
        title: "4. Fees and payments",
        paragraphs: [
          "TaskMatch sets the price of a task and presents it before any work begins. Platform fees are those published on the pricing page at the time of the order. Prices are exclusive of VAT, which is added where applicable.",
          "New jobs are paid through Stripe Checkout before execution. Eligible developers receive Connect transfers after client acceptance. Stripe manages bank payouts separately; existing manual payment records remain explicitly identified.",
        ],
        bullets: [
          "Clients are responsible for lawful briefs, accurate requirements and a valid payment method.",
          "Executors are responsible for declaring their capabilities truthfully and for executing in compliance with the law.",
          "The platform enforces the workflow, validation and settlement rules described below as part of operating the service.",
        ],
      },
      disputes: {
        title: "5. Funding, validation and payment disputes",
        paragraphs: [
          "New jobs use Stripe Checkout to pay the server-priced quote before execution. TaskMatch starts work only after verifying payment with Stripe. This is platform funding, not a legal escrow service.",
          "Developer transfers and refunds follow these steps:",
        ],
        bullets: [
          "Payment: the quoted amount and currency are fixed by the server and paid through hosted Stripe Checkout. Closing or returning from Checkout is not proof of payment.",
          "Validation: delivered work is reviewed against the agreed success criteria. The client can request revisions before accepting delivery.",
          "Transfer: accepting completed work queues the agreed net amount for each eligible developer’s connected Stripe account. Incomplete onboarding can block a transfer. Credit to a Stripe balance does not establish that a bank payout has occurred.",
          "Review: charge disputes or externally initiated partial refunds pause further work and transfers for review. Acceptance is not automatic after a time window.",
        ],
        closing: [
          "Administrators can request a full refund of the remaining payment balance. Existing transfers must be reconciled or reversed first; the refund is shown as complete only after confirmation by Stripe.",
          "Existing jobs explicitly marked for manual settlement retain that arrangement. Contact TaskMatch for a delivery or payment dispute; the platform does not promise automatic dispute resolution.",
        ],
      },
      ip: {
        title: "6. Ownership of the work",
        paragraphs: [
          "You keep the rights in what you submit: briefs, documents and datasets remain yours, and we use them only to run and deliver the work you asked for.",
          "Once a task is paid, the client owns the deliverables produced for it, unless the parties agree otherwise in writing. Executors keep the right to reuse the general skills, techniques and know-how they applied — which is not a licence to reuse the client's content or specification.",
          "The TaskMatch name, interface, documentation and platform code remain ours.",
        ],
      },
      restrictions: {
        title: "7. Acceptable use and liability",
        paragraphs: [
          "You may not use the platform for unlawful purposes, submit malicious code, impersonate anyone, circumvent platform fees, misuse another user's data, or attempt to compromise or scrape the service.",
          "The platform is provided as it stands and as it is available. To the extent the law permits, our total liability for any claim is capped at the fees you paid to the platform in the twelve months preceding the event giving rise to it. Nothing in these terms limits liability that cannot lawfully be limited.",
          "You are responsible for claims arising from your own use of the platform or your breach of these terms.",
        ],
      },
      termination: {
        title: "8. Ending the relationship",
        paragraphs: [
          "You may close your account at any time. Closing an account does not cancel outstanding payment, refund or delivery obligations.",
          "We may terminate for breach of these terms, or without cause on thirty days' written notice. Suspension for security or fraud can take effect immediately, with the reason given as soon as it safely can be.",
          "Provisions that are meant to survive — fees due, ownership, liability, confidentiality, governing law — survive the end of the contract.",
        ],
      },
      law: {
        title: "9. Changes, governing law and jurisdiction",
        paragraphs: [
          "We may change these terms. Material changes take effect thirty days after we notify you by email and in the product; continuing to use the platform after that is acceptance. The version in force is always the one on this page, and it is dated.",
          "These terms are governed by French law.",
          "Any dispute is first brought through the internal process described in section 5. Failing an amicable resolution, and because this contract is concluded between professionals, the competent courts of Paris, France have exclusive jurisdiction.",
        ],
      },
      contact: {
        title: "10. Contact",
        paragraphs: [
          "Questions about these terms: legal@tauraco.ai. The publisher's full registration details are set out in the legal notice.",
        ],
      },
    },
  },

  fr: {
    eyebrow: "Mentions légales / Conditions",
    title: "Conditions générales d’utilisation",
    summary:
      "Les conditions qui régissent l’accès à TaskMatch.ai et son utilisation — qui peut contracter, comment fonctionne la place de marché, paiements et transferts, propriété des livrables, responsabilité et droit applicable.",
    updatedAt: "Dernière mise à jour : 24 septembre 2026",
    operatedBy: "TaskMatch.ai est exploité par",
    sections: {
      acceptance: {
        title: "1. Acceptation et éligibilité",
        paragraphs: [
          "Créer un compte ou utiliser la plateforme vaut acceptation des présentes conditions. Elles constituent le contrat entre vous et l’éditeur ; aucun autre document ne s’y substitue.",
          "La plateforme est réservée aux professionnels : sociétés, entrepreneurs individuels et personnes publiques agissant dans le cadre de leur activité. Elle n’est pas proposée aux consommateurs et aucun contrat de consommation n’est formé. Vous devez être majeur et habilité à engager l’organisation que vous inscrivez. Votre inscription vaut confirmation de ces deux points.",
          "Cette restriction n’est pas décorative : c’est elle qui écarte le droit de la consommation de cette relation, y compris le dispositif de médiation de la consommation de l’article L612-1 du code de la consommation.",
        ],
      },
      service: {
        title: "2. Ce qu’est le service",
        paragraphs: [
          "TaskMatch fournit l’infrastructure qui structure le travail, oriente chaque tâche vers un exécutant qualifié — agent IA ou expert humain —, valide les productions et livre les résultats via la plateforme.",
          "Il s’agit d’une place de marché et d’une couche d’orchestration. Nous ne garantissons pas qu’une production donnée sera adaptée à votre besoin ; ce que nous exploitons, c’est le processus qui structure, note, valide et règle le travail.",
        ],
        bullets: [
          "Réception des missions et structuration des tâches",
          "Appariement des exécutants, offres et routage",
          "Flux de validation et de livraison",
          "Facturation, reporting et visibilité opérationnelle",
        ],
      },
      accounts: {
        title: "3. Comptes",
        paragraphs: [
          "Vous êtes responsable de l’exactitude des informations de votre compte et de la protection de vos identifiants et clés d’API. Les actions effectuées avec eux vous sont imputées.",
          "Nous pouvons limiter, suspendre ou résilier un compte lorsque la sécurité, une fraude, un abus ou un manquement aux présentes conditions le justifient. Sauf si un délai causerait un préjudice, nous en indiquons le motif.",
          "L’accès à certaines fonctionnalités peut dépendre du rôle, de la formule souscrite ou des contrôles qu’une organisation a définis pour ses membres.",
        ],
      },
      payments: {
        title: "4. Frais et paiements",
        paragraphs: [
          "TaskMatch fixe le prix d’une tâche et le présente avant tout démarrage. Les frais de plateforme sont ceux publiés sur la page Tarifs au moment de la commande. Les prix s’entendent hors taxes, la TVA étant ajoutée le cas échéant.",
          "Les nouvelles missions sont payées via Stripe Checkout avant exécution. Les développeurs éligibles reçoivent des transferts Connect après acceptation du client. Stripe gère séparément les versements bancaires ; les anciens règlements manuels restent identifiés.",
        ],
        bullets: [
          "Le client répond de la licéité de ses briefs, de l’exactitude de ses exigences et de la validité de son moyen de paiement.",
          "L’exécutant répond de la sincérité des capacités qu’il déclare et de la conformité de son exécution à la loi.",
          "La plateforme applique les règles de flux, de validation et de règlement décrites ci-dessous dans le cadre de l’exploitation du service.",
        ],
      },
      disputes: {
        title: "5. Financement, validation et contestations de paiement",
        paragraphs: [
          "Les nouvelles missions utilisent Stripe Checkout pour régler le devis calculé par le serveur avant l’exécution. TaskMatch démarre le travail uniquement après vérification du paiement auprès de Stripe. Ce financement de la plateforme ne constitue pas un service de séquestre juridique.",
          "Les transferts aux développeurs et les remboursements suivent ces étapes :",
        ],
        bullets: [
          "Paiement : le montant et la devise du devis sont fixés par le serveur et réglés sur la page Stripe Checkout. Fermer cette page ou en revenir ne prouve pas le paiement.",
          "Validation : le travail livré est examiné selon les critères convenus. Le client peut demander des modifications avant d’accepter la livraison.",
          "Transfert : l’acceptation du travail terminé déclenche la mise en file du montant net convenu pour le compte Stripe connecté de chaque développeur éligible. Une inscription incomplète peut bloquer un transfert. Le crédit d’un solde Stripe ne confirme pas un versement bancaire.",
          "Examen : les contestations de paiement ou remboursements partiels initiés ailleurs suspendent la suite du travail et les transferts pour examen. L’acceptation n’est pas automatique après un délai.",
        ],
        closing: [
          "Les administrateurs peuvent demander le remboursement intégral du solde restant. Les transferts existants doivent d’abord être rapprochés ou annulés ; le remboursement n’est indiqué comme terminé qu’après confirmation de Stripe.",
          "Les missions existantes explicitement indiquées en règlement manuel conservent ce fonctionnement. Contactez TaskMatch en cas de litige de livraison ou de paiement ; la plateforme ne promet pas de résolution automatique.",
        ],
      },
      ip: {
        title: "6. Propriété du travail",
        paragraphs: [
          "Vous conservez les droits sur ce que vous soumettez : briefs, documents et jeux de données restent les vôtres, et nous ne les utilisons que pour exécuter et livrer le travail demandé.",
          "Une fois la tâche payée, le client est propriétaire des livrables produits pour elle, sauf accord écrit contraire. L’exécutant conserve le droit de réutiliser les savoir-faire, techniques et connaissances générales qu’il a mis en œuvre — ce qui n’autorise pas la réutilisation du contenu ni de la spécification du client.",
          "Le nom TaskMatch, l’interface, la documentation et le code de la plateforme restent notre propriété.",
        ],
      },
      restrictions: {
        title: "7. Usage acceptable et responsabilité",
        paragraphs: [
          "Il est interdit d’utiliser la plateforme à des fins illicites, d’y soumettre du code malveillant, d’usurper une identité, de contourner les frais de plateforme, de détourner les données d’un autre utilisateur ou de tenter de compromettre ou d’aspirer le service.",
          "La plateforme est fournie en l’état et selon sa disponibilité. Dans la limite permise par la loi, notre responsabilité totale au titre d’une réclamation est plafonnée aux sommes que vous avez versées à la plateforme au cours des douze mois précédant le fait générateur. Rien dans les présentes ne limite une responsabilité qui ne peut légalement l’être.",
          "Vous répondez des réclamations nées de votre propre usage de la plateforme ou de votre manquement aux présentes conditions.",
        ],
      },
      termination: {
        title: "8. Fin de la relation",
        paragraphs: [
          "Vous pouvez fermer votre compte à tout moment. La fermeture du compte n’annule pas les obligations de paiement, remboursement ou livraison en cours.",
          "Nous pouvons résilier en cas de manquement aux présentes conditions, ou sans motif moyennant un préavis écrit de trente jours. Une suspension pour raison de sécurité ou de fraude peut prendre effet immédiatement, le motif étant communiqué dès que cela est possible sans risque.",
          "Les stipulations destinées à survivre — sommes dues, propriété, responsabilité, confidentialité, droit applicable — survivent à la fin du contrat.",
        ],
      },
      law: {
        title: "9. Évolutions, droit applicable et juridiction",
        paragraphs: [
          "Nous pouvons modifier les présentes conditions. Les modifications substantielles prennent effet trente jours après notification par e-mail et dans le produit ; poursuivre l’utilisation de la plateforme au-delà vaut acceptation. La version en vigueur est toujours celle publiée sur cette page, et elle est datée.",
          "Les présentes conditions sont régies par le droit français.",
          "Tout litige est d’abord porté devant le processus interne décrit à la section 5. À défaut de résolution amiable, et le contrat étant conclu entre professionnels, les tribunaux compétents de Paris, France, sont seuls compétents.",
        ],
      },
      contact: {
        title: "10. Contact",
        paragraphs: [
          "Questions sur les présentes conditions : legal@tauraco.ai. Les mentions légales détaillent l’immatriculation complète de l’éditeur.",
        ],
      },
    },
  },

  es: {
    eyebrow: "Legal / Términos",
    title: "Términos del servicio",
    summary:
      "Los términos que rigen el acceso y el uso de TaskMatch.ai — quién puede contratar, cómo funciona el mercado, pagos y transferencias, propiedad de los entregables, responsabilidad y ley aplicable.",
    updatedAt: "Última actualización: 24 de septiembre de 2026",
    operatedBy: "TaskMatch.ai está operado por",
    sections: {
      acceptance: {
        title: "1. Aceptación y elegibilidad",
        paragraphs: [
          "Crear una cuenta o usar la plataforma implica aceptar estos términos. Constituyen el contrato entre tú y el editor; no hay otro documento que los sustituya.",
          "La plataforma se ofrece exclusivamente a profesionales: empresas, autónomos y entidades públicas que actúan en el marco de su actividad. No se ofrece a consumidores y no se forma ningún contrato de consumo. Debes ser mayor de edad y estar facultado para obligar a la organización que registras. Al registrarte confirmas ambos extremos.",
          "Esta restricción no es decorativa: es lo que deja fuera de esta relación el derecho de consumo, incluido el mecanismo de mediación de consumo del artículo L612-1 del Código de Consumo francés.",
        ],
      },
      service: {
        title: "2. Qué es el servicio",
        paragraphs: [
          "TaskMatch proporciona la infraestructura que estructura el trabajo, dirige cada tarea a un ejecutor cualificado — agente de IA o experto humano —, valida los resultados y los entrega a través de la plataforma.",
          "Es un mercado y una capa de orquestación. No garantizamos que un resultado concreto sea apto para tu propósito; lo que operamos es el proceso que estructura, puntúa, valida y liquida el trabajo.",
        ],
        bullets: [
          "Recepción de encargos y estructuración de tareas",
          "Emparejamiento de ejecutores, ofertas y enrutamiento",
          "Flujos de validación y entrega",
          "Facturación, informes y visibilidad operativa",
        ],
      },
      accounts: {
        title: "3. Cuentas",
        paragraphs: [
          "Eres responsable de mantener la información de tu cuenta exacta y de proteger tus credenciales y claves de API. La actividad realizada con ellas se te imputa.",
          "Podemos limitar, suspender o cancelar una cuenta cuando la seguridad, el fraude, el abuso o un incumplimiento de estos términos lo justifiquen. Salvo que la demora cause daño, indicamos el motivo.",
          "El acceso a determinadas funciones puede depender del rol, del plan o de los controles que una organización haya configurado para sus miembros.",
        ],
      },
      payments: {
        title: "4. Tarifas y pagos",
        paragraphs: [
          "TaskMatch fija el precio de una tarea y lo presenta antes de que empiece el trabajo. Las comisiones son las publicadas en la página de precios en el momento del pedido. Los precios no incluyen IVA, que se añade cuando corresponde.",
          "Los trabajos nuevos se pagan con Stripe Checkout antes de ejecutarse. Los desarrolladores elegibles reciben transferencias Connect tras la aceptación del cliente. Stripe gestiona los pagos bancarios por separado; los registros manuales existentes siguen identificados.",
        ],
        bullets: [
          "El cliente responde de la licitud de sus briefs, de la exactitud de sus requisitos y de la validez de su medio de pago.",
          "El ejecutor responde de la veracidad de las capacidades que declara y de ejecutar conforme a la ley.",
          "La plataforma aplica las reglas de flujo, validación y liquidación descritas abajo como parte de la operación del servicio.",
        ],
      },
      disputes: {
        title: "5. Financiación, validación y disputas de pago",
        paragraphs: [
          "Los trabajos nuevos usan Stripe Checkout para pagar el presupuesto calculado por el servidor antes de la ejecución. TaskMatch inicia el trabajo solo tras verificar el pago con Stripe. Se trata de financiación en la plataforma, no de un servicio jurídico de depósito en garantía.",
          "Las transferencias a desarrolladores y los reembolsos siguen estos pasos:",
        ],
        bullets: [
          "Pago: el servidor fija el importe y la moneda del presupuesto, que se paga en Stripe Checkout. Cerrar esa página o volver desde ella no demuestra que se haya pagado.",
          "Validación: el trabajo entregado se revisa según los criterios acordados. El cliente puede pedir cambios antes de aceptar la entrega.",
          "Transferencia: aceptar el trabajo completado pone en cola el importe neto acordado para la cuenta Stripe conectada de cada desarrollador elegible. Un registro incompleto puede bloquearla. Abonar un saldo Stripe no confirma un pago bancario.",
          "Revisión: las disputas de cargos o los reembolsos parciales iniciados externamente suspenden nuevos trabajos y transferencias para su revisión. La aceptación no se produce automáticamente al vencer un plazo.",
        ],
        closing: [
          "Los administradores pueden solicitar el reembolso íntegro del saldo restante. Las transferencias existentes deben conciliarse o revertirse primero; el reembolso solo se muestra completado tras la confirmación de Stripe.",
          "Los trabajos existentes marcados explícitamente para liquidación manual conservan ese acuerdo. Contacta con TaskMatch si existe una disputa de entrega o pago; la plataforma no promete una resolución automática.",
        ],
      },
      ip: {
        title: "6. Propiedad del trabajo",
        paragraphs: [
          "Conservas los derechos sobre lo que envías: briefs, documentos y conjuntos de datos siguen siendo tuyos, y solo los usamos para ejecutar y entregar el trabajo solicitado.",
          "Una vez pagada la tarea, el cliente es propietario de los entregables producidos para ella, salvo acuerdo escrito en contrario. El ejecutor conserva el derecho a reutilizar las habilidades, técnicas y conocimientos generales aplicados — lo que no autoriza a reutilizar el contenido ni la especificación del cliente.",
          "El nombre TaskMatch, la interfaz, la documentación y el código de la plataforma siguen siendo nuestros.",
        ],
      },
      restrictions: {
        title: "7. Uso aceptable y responsabilidad",
        paragraphs: [
          "No puedes usar la plataforma con fines ilícitos, enviar código malicioso, suplantar a nadie, eludir las comisiones, hacer un uso indebido de los datos de otro usuario, ni intentar comprometer o extraer masivamente el servicio.",
          "La plataforma se presta tal cual y según disponibilidad. En la medida en que la ley lo permita, nuestra responsabilidad total por cualquier reclamación se limita a las cantidades que hayas abonado a la plataforma en los doce meses anteriores al hecho que la origina. Nada en estos términos limita una responsabilidad que no pueda limitarse legalmente.",
          "Respondes de las reclamaciones derivadas de tu propio uso de la plataforma o de tu incumplimiento de estos términos.",
        ],
      },
      termination: {
        title: "8. Fin de la relación",
        paragraphs: [
          "Puedes cerrar tu cuenta en cualquier momento. Cerrar la cuenta no cancela las obligaciones pendientes de pago, reembolso o entrega.",
          "Podemos resolver el contrato por incumplimiento de estos términos, o sin causa con un preaviso escrito de treinta días. La suspensión por seguridad o fraude puede ser inmediata, indicando el motivo tan pronto como sea seguro hacerlo.",
          "Las cláusulas destinadas a subsistir — importes debidos, propiedad, responsabilidad, confidencialidad, ley aplicable — subsisten a la terminación.",
        ],
      },
      law: {
        title: "9. Cambios, ley aplicable y jurisdicción",
        paragraphs: [
          "Podemos modificar estos términos. Los cambios sustanciales entran en vigor treinta días después de notificarlos por correo y en el producto; seguir usando la plataforma después equivale a aceptarlos. La versión vigente es siempre la publicada en esta página, y está fechada.",
          "Estos términos se rigen por la ley francesa.",
          "Toda disputa se somete primero al proceso interno descrito en la sección 5. A falta de solución amistosa, y por tratarse de un contrato entre profesionales, los tribunales competentes de París, Francia, tienen jurisdicción exclusiva.",
        ],
      },
      contact: {
        title: "10. Contacto",
        paragraphs: [
          "Preguntas sobre estos términos: legal@tauraco.ai. El aviso legal detalla los datos de registro completos del editor.",
        ],
      },
    },
  },

  zh: {
    eyebrow: "法律 / 条款",
    title: "服务条款",
    summary:
      "规范 TaskMatch.ai 访问与使用的条款——谁可以订立合同、市场如何运作、付款与转账、交付物归属、责任范围以及适用法律。",
    updatedAt: "最后更新：2026 年 9 月 24 日",
    operatedBy: "TaskMatch.ai 的运营方为",
    sections: {
      acceptance: {
        title: "1. 接受与资格",
        paragraphs: [
          "创建账户或使用本平台即表示接受本条款。它们构成你与发布方之间的合同；不存在可以取代它们的其他文件。",
          "本平台仅面向专业主体：在其经营活动范围内行事的公司、个体经营者与公共机构。本平台不面向消费者，也不形成任何消费者合同。你须年满 18 周岁并有权代表你所注册的组织。注册即表示你确认上述两点。",
          "这一限制并非装饰：正是它使消费者保护规则不适用于本关系，包括法国消费法典第 L612-1 条的消费者调解机制。",
        ],
      },
      service: {
        title: "2. 服务是什么",
        paragraphs: [
          "TaskMatch 提供基础设施，用于结构化工作、将每个子任务分配给合格的执行方（AI 智能体或人类专家）、验证产出并通过平台交付结果。",
          "它是一个市场与编排层。我们不保证任何特定执行方的产出适合你的用途；我们运营的是对工作进行结构化、评分、验证与结算的流程。",
        ],
        bullets: ["任务受理与子任务结构化", "执行方匹配、报价与路由", "验证与交付流程", "计费、报表与运营可见性"],
      },
      accounts: {
        title: "3. 账户",
        paragraphs: [
          "你有责任保持账户信息准确，并保护你的凭据与 API 密钥。使用它们进行的操作视为你的行为。",
          "当安全、欺诈、滥用或违反本条款的情形足以正当化时，我们可以限制、暂停或终止账户。除非延迟会造成损害，我们会说明理由。",
          "特定功能的访问可能取决于角色、订阅方案，或组织为其成员配置的控制策略。",
        ],
      },
      payments: {
        title: "4. 费用与付款",
        paragraphs: [
          "TaskMatch 设定子任务价格，并在任何工作开始前予以呈现。平台费用以下单时定价页面公布的标准为准。价格不含增值税，适用时另行加收。",
          "新工作在执行前通过 Stripe Checkout 付款。客户验收后，符合条件的开发者通过 Connect 获得转账。银行付款由 Stripe 单独管理；现有人工结算记录仍明确标识。",
        ],
        bullets: [
          "客户对其需求说明的合法性、要求的准确性以及支付方式的有效性负责。",
          "执行方对其所声明能力的真实性以及合法合规地执行负责。",
          "平台在运营服务过程中执行下文所述的流程、验证与结算规则。",
        ],
      },
      disputes: {
        title: "5. 付款、验证与支付争议",
        paragraphs: [
          "新工作需在执行前，通过 Stripe Checkout 支付服务器计算的报价。TaskMatch 仅在向 Stripe 核实付款后启动工作。这属于平台收款，不是法律意义上的资金托管服务。",
          "开发者转账和退款遵循以下流程：",
        ],
        bullets: [
          "付款：报价金额和币种由服务器确定，并在 Stripe Checkout 页面支付。关闭支付页面或从该页面返回不代表付款成功。",
          "验证：按约定的验收标准审核交付内容。客户可以在验收前要求修改。",
          "转账：验收已完成工作后，将为每位符合条件的开发者创建约定净额的 Stripe 关联账户转账任务。开户未完成可能阻止转账。金额计入 Stripe 余额不代表银行已收到款项。",
          "审核：支付争议或外部发起的部分退款会暂停后续工作和转账，等待审核。工作不会因审核期限届满而自动验收。",
        ],
        closing: [
          "管理员可以申请退还剩余的全部可退款金额。已有转账必须先完成核对或撤销，只有 Stripe 确认后才显示退款完成。",
          "明确标记为人工结算的现有工作保留原有安排。交付或付款存在争议时请联系 TaskMatch；平台不承诺自动解决争议。",
        ],
      },
      ip: {
        title: "6. 工作成果的归属",
        paragraphs: [
          "你保留你所提交内容的权利：需求说明、文档与数据集仍属于你，我们仅将其用于执行与交付你所要求的工作。",
          "子任务付款后，除非双方另有书面约定，客户拥有为其产出的交付物。执行方保留复用其所运用的通用技能、技术与知识的权利——但这并不允许复用客户的内容或规格说明。",
          "TaskMatch 名称、界面、文档与平台代码仍归我们所有。",
        ],
      },
      restrictions: {
        title: "7. 可接受使用与责任",
        paragraphs: [
          "你不得将平台用于违法目的、提交恶意代码、冒充他人、规避平台费用、滥用其他用户的数据，或试图攻破或抓取本服务。",
          "本平台按现状及可用状态提供。在法律允许的范围内，我们就任何索赔承担的总责任以引发该索赔的事件发生前十二个月内你向平台支付的费用为上限。本条款中的任何内容均不限制依法不可限制的责任。",
          "因你自身使用平台或违反本条款而产生的索赔由你承担。",
        ],
      },
      termination: {
        title: "8. 关系的终止",
        paragraphs: [
          "你可以随时关闭账户。关闭账户不会取消尚未完成的付款、退款或交付义务。",
          "我们可因违反本条款而终止，或在提前三十天书面通知后无因终止。出于安全或欺诈原因的暂停可立即生效，并在安全可行时尽快说明理由。",
          "应当存续的条款——应付款项、权属、责任、保密、适用法律——在合同终止后继续有效。",
        ],
      },
      law: {
        title: "9. 变更、适用法律与管辖",
        paragraphs: [
          "我们可以修改本条款。重大变更在我们通过电子邮件与产品内通知后三十天生效；此后继续使用平台即表示接受。生效版本始终是本页所发布并注明日期的版本。",
          "本条款受法国法律管辖。",
          "任何争议应首先通过第 5 节所述的内部流程处理。协商不成时，鉴于本合同订立于专业主体之间，法国巴黎有管辖权的法院享有专属管辖权。",
        ],
      },
      contact: {
        title: "10. 联系方式",
        paragraphs: ["有关本条款的问题：legal@tauraco.ai。法律声明中载有发布方完整的注册信息。"],
      },
    },
  },
};

const SECTION_ORDER = Object.keys(COPY.en.sections) as Array<keyof Copy["sections"]>;

export default function TermsOfServicePage() {
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;

  const toc = SECTION_ORDER.map((id) => ({ id, label: c.sections[id].title }));

  return (
    <LegalPageShell
      eyebrow={c.eyebrow}
      title={c.title}
      summary={c.summary}
      updatedAt={c.updatedAt}
      toc={toc}
    >
      {SECTION_ORDER.map((id) => {
        const section = c.sections[id];
        return (
          <LegalSection key={id} id={id} title={section.title}>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.bullets ? (
              <ul className="ml-5 list-disc space-y-2">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
            {section.closing?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {/* The counterparty has to be identifiable from the contract itself,
                not only from a link to another page. */}
            {id === "contact" ? (
              <p>
                {c.operatedBy} <strong>{publisherLine()}</strong>
                {LEGAL_ENTITY.address ? <>{", "}{LEGAL_ENTITY.address.join(", ")}</> : null}.
              </p>
            ) : null}
          </LegalSection>
        );
      })}
    </LegalPageShell>
  );
}
