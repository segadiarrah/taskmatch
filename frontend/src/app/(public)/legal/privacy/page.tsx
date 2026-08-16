"use client";

import React from "react";
import { LegalPageShell, LegalSection } from "@/components/public/legal-shell";
import { useTranslation, type Locale } from "@/lib/i18n";
import { LEGAL_ENTITY, publisherLine } from "@/lib/legal-entity";

/**
 * Privacy policy.
 *
 * This page previously described the processing in the conditional mood —
 * "retention periods vary", "transfers should be handled under appropriate
 * safeguards", "TaskMatch may act as a controller". None of that tells a data
 * subject anything, and GDPR art. 13 asks for the opposite: who the controller
 * is, on which legal basis each purpose rests, for how long, to whom the data
 * goes, and where to complain. It also omitted the automated decisions that are
 * the whole product.
 *
 * The controller's identity is read from `@/lib/legal-entity`, the same record
 * the mentions légales render, so the two pages cannot disagree about who
 * operates the service.
 *
 * On retention: only the accounting period is stated as a fixed duration,
 * because that one is imposed by article L123-22 of the French Commercial Code
 * and is a fact rather than a policy choice. Note that it is ten years, not the
 * seven the previous boilerplate claimed — seven is a figure from elsewhere.
 * The other categories are given as criteria, which art. 13(2)(a) allows,
 * rather than as durations the platform cannot yet guarantee it enforces.
 */

type Section = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type Copy = {
  eyebrow: string;
  title: string;
  summary: string;
  updatedAt: string;
  controllerIntro: string;
  sections: {
    controller: Section;
    data: Section;
    purposes: Section;
    automated: Section;
    recipients: Section;
    retention: Section;
    transfers: Section;
    rights: Section;
    cookies: Section;
    contact: Section;
  };
};

const CNIL_EN =
  "Commission Nationale de l’Informatique et des Libertés (CNIL), 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, France — cnil.fr";

const COPY: Record<Locale, Copy> = {
  en: {
    eyebrow: "Legal / Privacy",
    title: "Privacy Policy",
    summary:
      "Who controls your personal data on TaskMatch.ai, what we process and why, on which legal basis, for how long, who else sees it, and the rights you can exercise — including over decisions the platform makes automatically.",
    updatedAt: "Last updated: 13 August 2026",
    controllerIntro: "The controller for the processing described below is",
    sections: {
      controller: {
        title: "1. Controller and scope",
        paragraphs: [
          "This policy covers the TaskMatch.ai platform, its website, its API and the support channels attached to them. It applies to clients, to agent developers, and to the human experts who execute work through the platform.",
          "No data protection officer has been appointed: the processing does not meet the criteria of article 37 GDPR. Privacy requests are handled directly by the publisher at privacy@tauraco.ai.",
          "Content that a client uploads into a job — documents, datasets, briefs — is processed on that client's instructions. For that content TaskMatch acts as a processor and the client remains the controller.",
        ],
      },
      data: {
        title: "2. What we process",
        paragraphs: ["We process the following categories:"],
        bullets: [
          "Account data: name, email address, hashed password, role, organisation.",
          "Profile data for agent developers: capabilities, skill tags, track record, payout details.",
          "Job and task data: briefs, specifications, deliverables, bids, validation results and delivery records.",
          "Billing data: invoices, payout records, and the payment token held by our payment processor — card numbers never reach our servers.",
          "Technical data: IP address, browser, session and authentication metadata, and the platform audit log.",
          "Support data: the messages you send us and our replies.",
        ],
      },
      purposes: {
        title: "3. Purposes and legal bases",
        paragraphs: [
          "Each purpose rests on one basis under article 6 GDPR. Where a purpose rests on consent, refusing it costs you nothing else on the platform.",
        ],
        bullets: [
          "Operating the platform — creating accounts, structuring jobs, matching, executing and validating tasks, delivering work: performance of the contract (art. 6(1)(b)).",
          "Billing, payouts and accounting records: legal obligation (art. 6(1)(c)).",
          "Platform security, fraud prevention, abuse investigation and the audit log: our legitimate interest in a marketplace that can be trusted, balanced against your rights (art. 6(1)(f)).",
          "Improving matching and validation quality from operational records: our legitimate interest (art. 6(1)(f)). You may object at any time.",
          "Optional product announcements: your consent (art. 6(1)(a)), withdrawable at any time.",
        ],
      },
      automated: {
        title: "4. Automated decisions",
        paragraphs: [
          "The platform makes automated decisions, and we would rather state it plainly than bury it. Briefs are decomposed into tasks automatically, candidate executors are scored and ranked automatically, and deliverables are checked against acceptance criteria automatically.",
          "Where an executor is a human expert, ranking affects whether they are offered paid work. That is a decision with a significant effect on a person within the meaning of article 22 GDPR, and it is not left to run unattended: the scoring inputs are recorded for every decision, a ranking can be reviewed by a human on request, and you may contest the outcome and ask for it to be reconsidered.",
          "To exercise that, write to privacy@tauraco.ai with the task or bid reference. We will tell you which factors drove the decision.",
        ],
      },
      recipients: {
        title: "5. Who receives the data",
        paragraphs: [
          "We do not sell personal data, and we do not share it for anyone else's advertising. It reaches only:",
        ],
        bullets: [
          "Other platform users, to the extent the work requires it — a client sees the profile and submissions of the executor assigned to their task.",
          "Stripe, our payment processor, for payments and payouts.",
          "OVH SAS, which hosts the servers in France, and Cloudflare, Inc., which terminates public traffic. Both are named in the legal notice.",
          "Public authorities, where the law requires it and to the extent it requires.",
        ],
      },
      retention: {
        title: "6. How long we keep it",
        paragraphs: [
          "Accounting and invoicing records are kept for ten years from the close of the financial year, as required by article L123-22 of the French Commercial Code. That period is not ours to shorten.",
          "For every other category we keep data for as long as the account is open and the purpose lasts, then for the period needed to settle disputes, meet a legal obligation, or preserve evidence of a delivery. When none of that applies any more, the data is deleted or anonymised.",
          "One limit worth knowing: the platform audit log is append-only by design, because a marketplace that can rewrite its own record of who decided what is not auditable. An erasure request covering decisions already recorded there cannot be met by rewriting them. We will tell you what can be removed and what cannot, rather than promise otherwise.",
        ],
      },
      transfers: {
        title: "7. Where the data is",
        paragraphs: [
          "The application, its database and its object storage run on servers located in France, in the European Union.",
          "Cloudflare, which fronts public traffic, is established outside the European Union. That transfer is covered by the European Commission's standard contractual clauses. Stripe processes payment data under its own European entity.",
        ],
      },
      rights: {
        title: "8. Your rights",
        paragraphs: [
          "Under the GDPR you may request access to your data, correction of inaccurate data, erasure, restriction of processing, portability, and you may object to processing based on our legitimate interest. Where processing rests on consent, you may withdraw it at any time without affecting what was done before.",
          "Write to privacy@tauraco.ai, or use the data rights panel in your account settings. We answer within one month. We may ask you to confirm your identity first, and we may have to limit a request where it would expose another user's data or where the law requires us to keep the record.",
          "If our answer does not satisfy you, you may lodge a complaint with the French supervisory authority: " +
            CNIL_EN +
            ". If you live in another EU country, you may complain to your own supervisory authority instead.",
        ],
      },
      cookies: {
        title: "9. Cookies and local storage",
        paragraphs: [
          "The site sets no cookies at all. Your session token and your language preference are kept in your browser's local storage, which never leaves your device except when you send the token back to authenticate a request. Both are strictly necessary to operate the service, and neither requires consent. There is no analytics, no advertising and no third-party tracker on this site.",
          "If that changes, consent will be requested before anything is stored, and this section will say what and why.",
        ],
      },
      contact: {
        title: "10. Contact",
        paragraphs: [
          "Privacy questions and rights requests: privacy@tauraco.ai. Security reports: security@tauraco.ai. Anything else legal: legal@tauraco.ai.",
          "Material changes to this policy are announced at least 30 days before they take effect, by email and in the product.",
        ],
      },
    },
  },

  fr: {
    eyebrow: "Mentions légales / Confidentialité",
    title: "Politique de confidentialité",
    summary:
      "Qui est responsable de vos données personnelles sur TaskMatch.ai, ce que nous traitons et pourquoi, sur quelle base légale, combien de temps, qui d’autre y accède, et les droits que vous pouvez exercer — y compris sur les décisions que la plateforme prend automatiquement.",
    updatedAt: "Dernière mise à jour : 13 août 2026",
    controllerIntro: "Le responsable du traitement décrit ci-dessous est",
    sections: {
      controller: {
        title: "1. Responsable du traitement et champ d’application",
        paragraphs: [
          "Cette politique couvre la plateforme TaskMatch.ai, son site, son API et les canaux de support qui s’y rattachent. Elle s’applique aux clients, aux développeurs d’agents et aux experts humains qui exécutent des travaux via la plateforme.",
          "Aucun délégué à la protection des données n’a été désigné : les traitements ne remplissent pas les critères de l’article 37 du RGPD. Les demandes sont traitées directement par l’éditeur à privacy@tauraco.ai.",
          "Les contenus qu’un client dépose dans une mission — documents, jeux de données, briefs — sont traités sur ses instructions. Pour ces contenus, TaskMatch agit comme sous-traitant et le client reste responsable de traitement.",
        ],
      },
      data: {
        title: "2. Ce que nous traitons",
        paragraphs: ["Nous traitons les catégories suivantes :"],
        bullets: [
          "Données de compte : nom, adresse électronique, mot de passe haché, rôle, organisation.",
          "Données de profil des développeurs d’agents : capacités, compétences, historique de performance, coordonnées de versement.",
          "Données de mission et de tâche : briefs, spécifications, livrables, offres, résultats de validation et traces de livraison.",
          "Données de facturation : factures, versements et le jeton de paiement détenu par notre prestataire — aucun numéro de carte n’atteint nos serveurs.",
          "Données techniques : adresse IP, navigateur, métadonnées de session et d’authentification, journal d’audit de la plateforme.",
          "Données de support : les messages que vous nous adressez et nos réponses.",
        ],
      },
      purposes: {
        title: "3. Finalités et bases légales",
        paragraphs: [
          "Chaque finalité repose sur une base de l’article 6 du RGPD. Lorsqu’une finalité repose sur le consentement, la refuser ne vous coûte rien d’autre sur la plateforme.",
        ],
        bullets: [
          "Faire fonctionner la plateforme — création de compte, structuration des missions, appariement, exécution et validation des tâches, livraison : exécution du contrat (art. 6.1.b).",
          "Facturation, versements et pièces comptables : obligation légale (art. 6.1.c).",
          "Sécurité de la plateforme, prévention de la fraude, traitement des abus et journal d’audit : notre intérêt légitime à une place de marché digne de confiance, mis en balance avec vos droits (art. 6.1.f).",
          "Amélioration de la qualité de l’appariement et de la validation à partir des traces d’exploitation : intérêt légitime (art. 6.1.f). Vous pouvez vous y opposer à tout moment.",
          "Annonces produit facultatives : votre consentement (art. 6.1.a), retirable à tout moment.",
        ],
      },
      automated: {
        title: "4. Décisions automatisées",
        paragraphs: [
          "La plateforme prend des décisions automatisées, et nous préférons le dire franchement plutôt que de l’enfouir. Les briefs sont décomposés en tâches automatiquement, les exécutants candidats sont notés et classés automatiquement, et les livrables sont contrôlés automatiquement au regard des critères d’acceptation.",
          "Lorsque l’exécutant est un expert humain, ce classement détermine s’il se voit proposer un travail rémunéré. C’est une décision produisant un effet significatif sur une personne au sens de l’article 22 du RGPD, et elle n’est pas laissée sans surveillance : les éléments de notation sont consignés pour chaque décision, un classement peut être réexaminé par une personne sur demande, et vous pouvez contester le résultat et en demander le réexamen.",
          "Pour l’exercer, écrivez à privacy@tauraco.ai en indiquant la référence de la tâche ou de l’offre. Nous vous indiquerons les facteurs qui ont pesé sur la décision.",
        ],
      },
      recipients: {
        title: "5. Qui reçoit les données",
        paragraphs: [
          "Nous ne vendons aucune donnée personnelle et n’en partageons aucune à des fins publicitaires. Elles ne parviennent qu’à :",
        ],
        bullets: [
          "Les autres utilisateurs, dans la mesure où le travail l’exige — un client voit le profil et les remises de l’exécutant affecté à sa tâche.",
          "Stripe, notre prestataire de paiement, pour les encaissements et les versements.",
          "OVH SAS, qui héberge les serveurs en France, et Cloudflare, Inc., qui assure la terminaison du trafic public. Tous deux sont nommés dans les mentions légales.",
          "Les autorités publiques, lorsque la loi l’impose et dans la mesure où elle l’impose.",
        ],
      },
      retention: {
        title: "6. Combien de temps",
        paragraphs: [
          "Les pièces comptables et les factures sont conservées dix ans à compter de la clôture de l’exercice, comme l’exige l’article L123-22 du code de commerce. Cette durée ne nous appartient pas.",
          "Pour toutes les autres catégories, nous conservons les données tant que le compte est ouvert et que la finalité dure, puis le temps nécessaire pour régler un litige, satisfaire une obligation légale ou conserver la preuve d’une livraison. Lorsque plus rien de cela ne s’applique, les données sont supprimées ou anonymisées.",
          "Une limite à connaître : le journal d’audit est conçu en ajout seul, parce qu’une place de marché capable de réécrire sa propre trace de qui a décidé quoi n’est pas auditable. Une demande d’effacement portant sur des décisions déjà consignées ne peut pas être satisfaite par une réécriture. Nous vous dirons ce qui peut être retiré et ce qui ne le peut pas, plutôt que de promettre l’inverse.",
        ],
      },
      transfers: {
        title: "7. Où sont les données",
        paragraphs: [
          "L’application, sa base de données et son stockage objet fonctionnent sur des serveurs situés en France, dans l’Union européenne.",
          "Cloudflare, qui assure la façade du trafic public, est établi hors de l’Union européenne. Ce transfert est encadré par les clauses contractuelles types de la Commission européenne. Stripe traite les données de paiement via son entité européenne.",
        ],
      },
      rights: {
        title: "8. Vos droits",
        paragraphs: [
          "Le RGPD vous permet de demander l’accès à vos données, la rectification des données inexactes, leur effacement, la limitation du traitement, leur portabilité, et de vous opposer aux traitements fondés sur notre intérêt légitime. Lorsqu’un traitement repose sur le consentement, vous pouvez le retirer à tout moment sans remettre en cause ce qui a été fait avant.",
          "Écrivez à privacy@tauraco.ai ou utilisez le panneau de gestion des droits dans les réglages de votre compte. Nous répondons dans le mois. Nous pouvons vous demander de confirmer votre identité, et devoir limiter une demande lorsqu’elle exposerait les données d’un autre utilisateur ou lorsque la loi nous impose de conserver la trace.",
          "Si notre réponse ne vous satisfait pas, vous pouvez introduire une réclamation auprès de l’autorité de contrôle française : " +
            CNIL_EN +
            ". Si vous résidez dans un autre pays de l’Union, vous pouvez saisir votre propre autorité de contrôle.",
        ],
      },
      cookies: {
        title: "9. Cookies et stockage local",
        paragraphs: [
          "Le site ne dépose aucun cookie. Votre jeton de session et votre préférence de langue sont conservés dans le stockage local de votre navigateur, qui ne quitte jamais votre appareil, sauf lorsque vous renvoyez le jeton pour authentifier une requête. L’un et l’autre sont strictement nécessaires au fonctionnement du service et ne requièrent donc pas de consentement. Aucune mesure d’audience, aucune publicité, aucun traceur tiers sur ce site.",
          "Si cela change, le consentement sera recueilli avant tout enregistrement, et cette section dira quoi et pourquoi.",
        ],
      },
      contact: {
        title: "10. Contact",
        paragraphs: [
          "Questions et demandes relatives aux données : privacy@tauraco.ai. Signalements de sécurité : security@tauraco.ai. Autres questions juridiques : legal@tauraco.ai.",
          "Toute modification substantielle de cette politique est annoncée au moins 30 jours avant son entrée en vigueur, par e-mail et dans le produit.",
        ],
      },
    },
  },

  es: {
    eyebrow: "Legal / Privacidad",
    title: "Política de privacidad",
    summary:
      "Quién es el responsable de tus datos personales en TaskMatch.ai, qué tratamos y por qué, con qué base jurídica, durante cuánto tiempo, quién más accede y qué derechos puedes ejercer — incluidas las decisiones que la plataforma toma automáticamente.",
    updatedAt: "Última actualización: 13 de agosto de 2026",
    controllerIntro: "El responsable del tratamiento descrito a continuación es",
    sections: {
      controller: {
        title: "1. Responsable y ámbito",
        paragraphs: [
          "Esta política cubre la plataforma TaskMatch.ai, su sitio web, su API y los canales de soporte asociados. Se aplica a clientes, a desarrolladores de agentes y a los expertos humanos que ejecutan trabajo a través de la plataforma.",
          "No se ha designado delegado de protección de datos: los tratamientos no cumplen los criterios del artículo 37 del RGPD. Las solicitudes las gestiona directamente el editor en privacy@tauraco.ai.",
          "El contenido que un cliente sube a un encargo — documentos, conjuntos de datos, briefs — se trata siguiendo sus instrucciones. Para ese contenido TaskMatch actúa como encargado del tratamiento y el cliente sigue siendo el responsable.",
        ],
      },
      data: {
        title: "2. Qué tratamos",
        paragraphs: ["Tratamos las siguientes categorías:"],
        bullets: [
          "Datos de cuenta: nombre, correo electrónico, contraseña cifrada, rol, organización.",
          "Datos de perfil de los desarrolladores de agentes: capacidades, competencias, historial y datos de pago.",
          "Datos de encargos y tareas: briefs, especificaciones, entregables, ofertas, resultados de validación y registros de entrega.",
          "Datos de facturación: facturas, pagos y el token de pago que conserva nuestro procesador — ningún número de tarjeta llega a nuestros servidores.",
          "Datos técnicos: dirección IP, navegador, metadatos de sesión y autenticación, y el registro de auditoría de la plataforma.",
          "Datos de soporte: los mensajes que nos envías y nuestras respuestas.",
        ],
      },
      purposes: {
        title: "3. Finalidades y bases jurídicas",
        paragraphs: [
          "Cada finalidad se apoya en una base del artículo 6 del RGPD. Cuando una finalidad se basa en el consentimiento, rechazarla no te cuesta nada más en la plataforma.",
        ],
        bullets: [
          "Operar la plataforma — crear cuentas, estructurar encargos, emparejar, ejecutar y validar tareas, entregar el trabajo: ejecución del contrato (art. 6.1.b).",
          "Facturación, pagos y registros contables: obligación legal (art. 6.1.c).",
          "Seguridad de la plataforma, prevención del fraude, investigación de abusos y registro de auditoría: nuestro interés legítimo en un mercado fiable, ponderado con tus derechos (art. 6.1.f).",
          "Mejorar la calidad del emparejamiento y de la validación a partir de registros operativos: interés legítimo (art. 6.1.f). Puedes oponerte en cualquier momento.",
          "Avisos de producto opcionales: tu consentimiento (art. 6.1.a), revocable en cualquier momento.",
        ],
      },
      automated: {
        title: "4. Decisiones automatizadas",
        paragraphs: [
          "La plataforma toma decisiones automatizadas, y preferimos decirlo claramente antes que enterrarlo. Los briefs se descomponen en tareas de forma automática, los ejecutores candidatos se puntúan y ordenan de forma automática, y los entregables se comprueban automáticamente frente a los criterios de aceptación.",
          "Cuando el ejecutor es un experto humano, esa clasificación determina si se le ofrece trabajo remunerado. Es una decisión con efectos significativos sobre una persona en el sentido del artículo 22 del RGPD, y no se deja sin supervisión: los factores de puntuación quedan registrados en cada decisión, una clasificación puede ser revisada por una persona si se solicita, y puedes impugnar el resultado y pedir que se reconsidere.",
          "Para ejercerlo, escribe a privacy@tauraco.ai indicando la referencia de la tarea o de la oferta. Te indicaremos qué factores pesaron en la decisión.",
        ],
      },
      recipients: {
        title: "5. Quién recibe los datos",
        paragraphs: [
          "No vendemos datos personales ni los compartimos con fines publicitarios de terceros. Solo llegan a:",
        ],
        bullets: [
          "Otros usuarios, en la medida en que el trabajo lo exija — un cliente ve el perfil y las entregas del ejecutor asignado a su tarea.",
          "Stripe, nuestro procesador de pagos, para cobros y pagos.",
          "OVH SAS, que aloja los servidores en Francia, y Cloudflare, Inc., que termina el tráfico público. Ambos figuran en el aviso legal.",
          "Autoridades públicas, cuando la ley lo exige y en la medida en que lo exige.",
        ],
      },
      retention: {
        title: "6. Durante cuánto tiempo",
        paragraphs: [
          "Los documentos contables y las facturas se conservan diez años desde el cierre del ejercicio, según exige el artículo L123-22 del Código de Comercio francés. Ese plazo no depende de nosotros.",
          "Para el resto de categorías conservamos los datos mientras la cuenta esté activa y la finalidad subsista, y después el tiempo necesario para resolver un litigio, cumplir una obligación legal o preservar la prueba de una entrega. Cuando nada de eso se aplica ya, los datos se eliminan o se anonimizan.",
          "Un límite que conviene conocer: el registro de auditoría es de solo adición por diseño, porque un mercado capaz de reescribir su propio registro de quién decidió qué no es auditable. Una solicitud de supresión sobre decisiones ya registradas no puede atenderse reescribiéndolas. Te diremos qué puede retirarse y qué no, en lugar de prometer lo contrario.",
        ],
      },
      transfers: {
        title: "7. Dónde están los datos",
        paragraphs: [
          "La aplicación, su base de datos y su almacenamiento de objetos funcionan en servidores situados en Francia, en la Unión Europea.",
          "Cloudflare, que actúa como fachada del tráfico público, está establecida fuera de la Unión Europea. Esa transferencia se ampara en las cláusulas contractuales tipo de la Comisión Europea. Stripe trata los datos de pago a través de su entidad europea.",
        ],
      },
      rights: {
        title: "8. Tus derechos",
        paragraphs: [
          "El RGPD te permite solicitar el acceso a tus datos, la rectificación de los inexactos, su supresión, la limitación del tratamiento, su portabilidad, y oponerte a los tratamientos basados en nuestro interés legítimo. Cuando un tratamiento se basa en el consentimiento, puedes retirarlo en cualquier momento sin afectar a lo ya realizado.",
          "Escribe a privacy@tauraco.ai o usa el panel de derechos en los ajustes de tu cuenta. Respondemos en el plazo de un mes. Podemos pedirte que confirmes tu identidad, y podemos tener que limitar una solicitud cuando expondría datos de otro usuario o cuando la ley nos obliga a conservar el registro.",
          "Si nuestra respuesta no te satisface, puedes presentar una reclamación ante la autoridad de control francesa: " +
            CNIL_EN +
            ". Si resides en otro país de la Unión, puedes dirigirte a tu propia autoridad de control.",
        ],
      },
      cookies: {
        title: "9. Cookies y almacenamiento local",
        paragraphs: [
          "El sitio no instala ninguna cookie. Tu token de sesión y tu preferencia de idioma se guardan en el almacenamiento local del navegador, que nunca sale de tu dispositivo salvo cuando reenvías el token para autenticar una petición. Ambos son estrictamente necesarios para operar el servicio y no requieren consentimiento. No hay analítica, ni publicidad, ni rastreadores de terceros en este sitio.",
          "Si eso cambia, se pedirá el consentimiento antes de instalar nada, y esta sección dirá qué y por qué.",
        ],
      },
      contact: {
        title: "10. Contacto",
        paragraphs: [
          "Preguntas y solicitudes sobre datos: privacy@tauraco.ai. Avisos de seguridad: security@tauraco.ai. Otras cuestiones legales: legal@tauraco.ai.",
          "Cualquier cambio sustancial de esta política se anuncia al menos 30 días antes de su entrada en vigor, por correo y en el producto.",
        ],
      },
    },
  },

  zh: {
    eyebrow: "法律 / 隐私",
    title: "隐私政策",
    summary:
      "谁是 TaskMatch.ai 上你个人数据的控制者，我们处理什么、为何处理、依据哪项合法性基础、保存多久、还有谁能看到，以及你可以行使的权利——包括针对平台自动作出的决定。",
    updatedAt: "最后更新：2026 年 8 月 13 日",
    controllerIntro: "以下所述处理活动的数据控制者为",
    sections: {
      controller: {
        title: "1. 控制者与适用范围",
        paragraphs: [
          "本政策涵盖 TaskMatch.ai 平台及其网站、API 与相关支持渠道，适用于客户、智能体开发者，以及通过平台执行工作的人类专家。",
          "我们未指定数据保护官：相关处理活动不符合 GDPR 第 37 条的标准。隐私请求由发布方直接在 privacy@tauraco.ai 处理。",
          "客户上传至任务中的内容——文档、数据集、需求说明——按其指示处理。就该内容而言，TaskMatch 作为受托处理者，客户仍为控制者。",
        ],
      },
      data: {
        title: "2. 我们处理什么",
        paragraphs: ["我们处理以下类别的数据："],
        bullets: [
          "账户数据：姓名、电子邮箱、经哈希处理的密码、角色、所属组织。",
          "智能体开发者的资料数据：能力、技能标签、履约记录、收款信息。",
          "任务与子任务数据：需求说明、规格、交付物、报价、验证结果与交付记录。",
          "计费数据：发票、付款记录，以及由支付服务商保管的支付令牌——卡号从不进入我们的服务器。",
          "技术数据：IP 地址、浏览器、会话与认证元数据，以及平台审计日志。",
          "支持数据：你发给我们的消息与我们的回复。",
        ],
      },
      purposes: {
        title: "3. 处理目的与合法性基础",
        paragraphs: [
          "每一项目的都对应 GDPR 第 6 条的一项基础。若某项目的以同意为基础，拒绝并不会影响你在平台上的其他权益。",
        ],
        bullets: [
          "运营平台——创建账户、结构化任务、匹配、执行与验证子任务、交付成果：履行合同（第 6.1.b 条）。",
          "计费、付款与会计凭证：法定义务（第 6.1.c 条）。",
          "平台安全、防欺诈、滥用调查与审计日志：我们对可信市场的合法利益，并与你的权利相权衡（第 6.1.f 条）。",
          "基于运营记录改进匹配与验证质量：合法利益（第 6.1.f 条）。你可随时提出反对。",
          "可选的产品通知：你的同意（第 6.1.a 条），可随时撤回。",
        ],
      },
      automated: {
        title: "4. 自动化决策",
        paragraphs: [
          "平台会作出自动化决策，我们宁愿直说，也不愿把它藏起来。需求说明会被自动拆解为子任务，候选执行方会被自动评分与排序，交付物也会被自动对照验收标准进行检查。",
          "当执行方是人类专家时，该排序决定其是否获得有偿工作机会。这属于 GDPR 第 22 条意义上对个人产生重大影响的决定，因此并未放任不管：每次决策的评分要素都会被记录，排序可应请求由人工复核，你也可以对结果提出异议并要求重新考虑。",
          "行使该权利请写信至 privacy@tauraco.ai 并附上子任务或报价编号。我们会告知影响该决定的具体因素。",
        ],
      },
      recipients: {
        title: "5. 谁会收到数据",
        paragraphs: ["我们不出售个人数据，也不为他人的广告目的共享数据。数据仅会到达："],
        bullets: [
          "其他平台用户，且以工作所需为限——客户可以看到被指派执行方的资料与提交内容。",
          "我们的支付服务商 Stripe，用于收款与付款。",
          "在法国托管服务器的 OVH SAS，以及负责终止公共流量的 Cloudflare, Inc.。两者均已在法律声明中列明。",
          "公共机关，在法律要求时并以其要求为限。",
        ],
      },
      retention: {
        title: "6. 保存多久",
        paragraphs: [
          "会计凭证与发票自会计年度结束起保存十年，这是法国商法典第 L123-22 条的要求，该期限不由我们决定。",
          "其他所有类别的数据，在账户开立且处理目的存续期间保存，之后再保留处理争议、履行法定义务或保全交付证据所需的时间。当上述情形均不再适用时，数据将被删除或匿名化。",
          "有一点需要知晓：平台审计日志按设计只可追加，因为一个能够改写自身「谁决定了什么」记录的市场是无法审计的。针对已记录决策的删除请求无法通过改写来满足。我们会告诉你哪些可以移除、哪些不能，而不是作出相反的承诺。",
        ],
      },
      transfers: {
        title: "7. 数据存放在哪里",
        paragraphs: [
          "应用程序、数据库与对象存储运行在位于法国（欧盟境内）的服务器上。",
          "承担公共流量前端的 Cloudflare 设立于欧盟境外，该传输受欧盟委员会标准合同条款保护。Stripe 通过其欧洲实体处理支付数据。",
        ],
      },
      rights: {
        title: "8. 你的权利",
        paragraphs: [
          "根据 GDPR，你可以请求访问你的数据、更正不准确的数据、删除数据、限制处理、获取数据可携副本，并可对基于我们合法利益的处理提出反对。若处理以同意为基础，你可随时撤回，且不影响撤回前已进行的处理。",
          "请写信至 privacy@tauraco.ai，或使用账户设置中的数据权利面板。我们会在一个月内答复。我们可能要求你先确认身份；当请求会暴露其他用户的数据、或法律要求我们保留记录时，我们可能不得不作出限制。",
          "如果你对我们的答复不满意，可以向法国监管机构投诉：" +
            CNIL_EN +
            "。如果你居住在欧盟其他国家，也可以向所在国的监管机构投诉。",
        ],
      },
      cookies: {
        title: "9. Cookie 与本地存储",
        paragraphs: [
          "本站不设置任何 cookie。你的会话令牌与语言偏好保存在浏览器的本地存储中，除非你回传令牌以认证请求，否则它们不会离开你的设备。两者都是运行本服务所必需的，因此无需征得同意。本站没有任何分析、广告或第三方追踪器。",
          "若情况发生变化，我们会在设置任何 cookie 之前征求同意，并在本节说明内容与原因。",
        ],
      },
      contact: {
        title: "10. 联系方式",
        paragraphs: [
          "数据相关问题与权利请求：privacy@tauraco.ai。安全报告：security@tauraco.ai。其他法律事宜：legal@tauraco.ai。",
          "本政策的重大变更会在生效前至少 30 天通过电子邮件与产品内通知。",
        ],
      },
    },
  },
};

const SECTION_ORDER = [
  "controller",
  "data",
  "purposes",
  "automated",
  "recipients",
  "retention",
  "transfers",
  "rights",
  "cookies",
  "contact",
] as const;

export default function PrivacyPolicyPage() {
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
            {/* The controller has to be identified, not alluded to — and from the
                same record the mentions légales use, so the two cannot drift. */}
            {id === "controller" ? (
              <p>
                {c.controllerIntro} <strong>{publisherLine()}</strong>
                {LEGAL_ENTITY.address ? `, ${LEGAL_ENTITY.address.join(", ")}` : ""}.
              </p>
            ) : null}
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
          </LegalSection>
        );
      })}
    </LegalPageShell>
  );
}
