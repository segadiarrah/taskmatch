"use client";

import React from "react";
import { LegalPageShell, LegalSection } from "@/components/public/legal-shell";
import { useTranslation, type Locale } from "@/lib/i18n";
import {
  LEGAL_ENTITY,
  formatSiren,
  formatSiret,
  isHostPublished,
  isRegistrationPublished,
  publisherLine,
} from "@/lib/legal-entity";

/**
 * Mentions légales — mandatory for any French-published online service under
 * LCEN art. 6 III-1: publisher identity and registration, director of
 * publication, and how to reach the host.
 *
 * Entity facts come from `@/lib/legal-entity`. Where a registration detail
 * has not been supplied, the page says so explicitly instead of printing a
 * plausible placeholder, because an inaccurate mandatory notice is a worse
 * outcome than an acknowledged gap.
 */

type Copy = {
  eyebrow: string;
  title: string;
  summary: string;
  updatedAt: string;
  s: {
    publisher: string;
    registration: string;
    host: string;
    contact: string;
    property: string;
    mediation: string;
  };
  body: {
    publishedBy: string;
    director: string;
    registrationPending: string;
    hostIntro: string;
    hostPending: string;
    contactIntro: string;
    property: string;
    mediationIntro: string;
    mediationPending: string;
    phone: string;
    role: { infrastructure: string; proxy: string };
  };
};

const COPY: Record<Locale, Copy> = {
  en: {
    eyebrow: "Legal / Notice",
    title: "Legal notice",
    summary:
      "Who publishes TaskMatch.ai, under which registration, where it is hosted, and how to reach the people responsible.",
    updatedAt: "Last updated: August 2026",
    s: {
      publisher: "1. Publisher",
      registration: "2. Registration",
      host: "3. Hosting",
      contact: "4. Contact",
      property: "5. Intellectual property",
      mediation: "6. Professional use and disputes",
    },
    body: {
      publishedBy: "TaskMatch.ai is published by",
      director: "Director of publication:",
      registrationPending:
        "The registration details of the publishing entity are being finalised and will be published here as soon as they are effective. We prefer to state this than to display particulars that would not match a registered entity.",
      hostIntro: "The service is hosted by:",
      hostPending:
        "The service runs on dedicated infrastructure located in the European Union. The hosting provider's full particulars will be published here shortly.",
      contactIntro:
        "For legal or contractual questions, and for any notice relating to content published on this site:",
      property:
        "The TaskMatch.ai name, the platform interface, its source code, and the documentation are the property of the publisher. Deliverables produced through the platform belong to the client who commissioned them, on the terms set out in the Terms of Service.",
      mediationIntro:
        "TaskMatch.ai is offered exclusively to professionals — businesses, sole traders and public bodies acting for business purposes. It is not offered to consumers, and no consumer contract is formed.",
      mediationPending:
        "Because the service contracts only with professionals, the consumer mediation scheme of article L612-1 of the French Consumer Code does not apply. Disputes are first addressed directly with us; failing an amicable resolution, the competent French courts have jurisdiction.",
      phone: "Telephone:",
      role: {
        infrastructure: "infrastructure and data storage",
        proxy: "proxy and traffic delivery",
      },
    },
  },
  fr: {
    eyebrow: "Mentions légales",
    title: "Mentions légales",
    summary:
      "Qui édite TaskMatch.ai, sous quelle immatriculation, où le service est hébergé, et comment joindre les responsables.",
    updatedAt: "Dernière mise à jour : août 2026",
    s: {
      publisher: "1. Éditeur",
      registration: "2. Immatriculation",
      host: "3. Hébergement",
      contact: "4. Contact",
      property: "5. Propriété intellectuelle",
      mediation: "6. Usage professionnel et litiges",
    },
    body: {
      publishedBy: "TaskMatch.ai est édité par",
      director: "Directeur de la publication :",
      registrationPending:
        "Les éléments d’immatriculation de la société éditrice sont en cours de finalisation et seront publiés ici dès qu’ils seront effectifs. Nous préférons l’écrire ainsi plutôt que d’afficher une mention qui ne correspondrait pas à une entité immatriculée.",
      hostIntro: "Le service est hébergé par :",
      hostPending:
        "Le service fonctionne sur une infrastructure dédiée située dans l’Union européenne. Les coordonnées complètes de l’hébergeur seront publiées ici prochainement.",
      contactIntro:
        "Pour toute question juridique ou contractuelle, et pour toute notification relative à un contenu publié sur ce site :",
      property:
        "La dénomination TaskMatch.ai, l’interface de la plateforme, son code source et la documentation sont la propriété de l’éditeur. Les livrables produits via la plateforme appartiennent au client qui les a commandés, dans les conditions prévues par les conditions d’utilisation.",
      mediationIntro:
        "TaskMatch.ai est proposé exclusivement à des professionnels — entreprises, entrepreneurs individuels et organismes publics agissant dans le cadre de leur activité. Le service n’est pas proposé aux consommateurs et aucun contrat de consommation n’est conclu.",
      mediationPending:
        "Le service ne contractant qu’avec des professionnels, le dispositif de médiation de la consommation prévu à l’article L612-1 du Code de la consommation ne s’applique pas. Les litiges sont d’abord traités directement avec nous ; à défaut de résolution amiable, les tribunaux français compétents sont saisis.",
      phone: "Téléphone :",
      role: {
        infrastructure: "infrastructure et stockage des données",
        proxy: "proxy et acheminement du trafic",
      },
    },
  },
  es: {
    eyebrow: "Legal / Aviso",
    title: "Aviso legal",
    summary:
      "Quién publica TaskMatch.ai, bajo qué registro, dónde está alojado y cómo contactar con los responsables.",
    updatedAt: "Última actualización: agosto de 2026",
    s: {
      publisher: "1. Editor",
      registration: "2. Registro",
      host: "3. Alojamiento",
      contact: "4. Contacto",
      property: "5. Propiedad intelectual",
      mediation: "6. Uso profesional y litigios",
    },
    body: {
      publishedBy: "TaskMatch.ai es publicado por",
      director: "Director de la publicación:",
      registrationPending:
        "Los datos registrales de la entidad editora están en proceso de finalización y se publicarán aquí en cuanto sean efectivos. Preferimos indicarlo así antes que mostrar datos que no correspondan a una entidad registrada.",
      hostIntro: "El servicio está alojado por:",
      hostPending:
        "El servicio funciona sobre infraestructura dedicada situada en la Unión Europea. Los datos completos del proveedor de alojamiento se publicarán aquí en breve.",
      contactIntro:
        "Para cuestiones jurídicas o contractuales, y para cualquier notificación relativa a un contenido publicado en este sitio:",
      property:
        "La denominación TaskMatch.ai, la interfaz de la plataforma, su código fuente y la documentación son propiedad del editor. Los entregables producidos a través de la plataforma pertenecen al cliente que los encargó, en las condiciones previstas en los términos del servicio.",
      mediationIntro:
        "TaskMatch.ai se ofrece exclusivamente a profesionales — empresas, autónomos y organismos públicos que actúan en el marco de su actividad. No se ofrece a consumidores y no se celebra ningún contrato de consumo.",
      mediationPending:
        "Dado que el servicio solo contrata con profesionales, el régimen de mediación de consumo del artículo L612-1 del Código de Consumo francés no resulta aplicable. Los litigios se tratan primero directamente con nosotros; a falta de acuerdo amistoso, son competentes los tribunales franceses.",
      phone: "Teléfono:",
      role: {
        infrastructure: "infraestructura y almacenamiento de datos",
        proxy: "proxy y entrega de tráfico",
      },
    },
  },
  zh: {
    eyebrow: "法律 / 声明",
    title: "法律声明",
    summary: "TaskMatch.ai 由谁发布、注册信息、托管地点，以及如何联系责任人。",
    updatedAt: "最后更新：2026 年 8 月",
    s: {
      publisher: "1. 发布方",
      registration: "2. 注册信息",
      host: "3. 托管",
      contact: "4. 联系方式",
      property: "5. 知识产权",
      mediation: "6. 专业用途与争议",
    },
    body: {
      publishedBy: "TaskMatch.ai 由以下主体发布：",
      director: "出版负责人：",
      registrationPending:
        "发布主体的注册信息正在完成中，一经生效将在此公布。我们宁可如此说明，也不愿展示与任何已注册实体不符的信息。",
      hostIntro: "本服务由以下服务商托管：",
      hostPending:
        "本服务运行在位于欧盟的专用基础设施上。托管服务商的完整信息将于近期在此公布。",
      contactIntro: "如有法律或合同问题，以及与本站所发布内容有关的任何通知：",
      property:
        "TaskMatch.ai 名称、平台界面、源代码及文档归发布方所有。通过平台产出的交付物归委托该工作的客户所有，具体以服务条款为准。",
      mediationIntro:
        "TaskMatch.ai 仅面向专业主体提供——即在其经营活动范围内行事的企业、个体经营者和公共机构。本服务不面向消费者，亦不构成消费者合同。",
      mediationPending:
        "由于本服务仅与专业主体订约，法国《消费法典》第 L612-1 条的消费者调解机制不适用。争议应先与我们直接处理；协商不成的，由法国有管辖权的法院管辖。",
      phone: "电话：",
      role: {
        infrastructure: "基础设施与数据存储",
        proxy: "代理与流量分发",
      },
    },
  },
};

export default function LegalNoticePage() {
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;
  const entity = LEGAL_ENTITY;
  const registered = isRegistrationPublished(entity);
  const hosted = isHostPublished(entity);

  const toc = [
    { id: "publisher", label: c.s.publisher },
    { id: "registration", label: c.s.registration },
    { id: "host", label: c.s.host },
    { id: "contact", label: c.s.contact },
    { id: "property", label: c.s.property },
    { id: "mediation", label: c.s.mediation },
  ];

  return (
    <LegalPageShell
      eyebrow={c.eyebrow}
      title={c.title}
      summary={c.summary}
      updatedAt={c.updatedAt}
      toc={toc}
    >
      <LegalSection id="publisher" title={c.s.publisher}>
        <p>
          {c.body.publishedBy} <strong>{publisherLine(entity)}</strong>.
        </p>
        {registered && entity.address && (
          <p>
            {entity.address.map((line) => (
              <React.Fragment key={line}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </p>
        )}
        <p>
          {c.body.director} {entity.publicationDirector}
        </p>
      </LegalSection>

      <LegalSection id="registration" title={c.s.registration}>
        {registered ? (
          <ul className="list-disc space-y-1 pl-5">
            {entity.legalForm && <li>{entity.legalForm}</li>}
            {entity.siren && <li>SIREN {formatSiren(entity.siren)}</li>}
            {entity.siret && <li>SIRET {formatSiret(entity.siret)}</li>}
            {entity.rcsCity && entity.siren && (
              <li>
                RCS {entity.rcsCity} {formatSiren(entity.siren)}
              </li>
            )}
            {entity.vatNumber && <li>TVA {entity.vatNumber}</li>}
          </ul>
        ) : (
          <p>{c.body.registrationPending}</p>
        )}
      </LegalSection>

      <LegalSection id="host" title={c.s.host}>
        {hosted ? (
          <>
            <p>{c.body.hostIntro}</p>
            {entity.hosts.map((host) => (
              <p key={host.name}>
                <strong>{host.name}</strong> — {c.body.role[host.role]}
                <br />
                {host.address.map((line) => (
                  <React.Fragment key={line}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
                {host.registration}
                {host.phone && (
                  <>
                    <br />
                    {c.body.phone} {host.phone}
                  </>
                )}
              </p>
            ))}
          </>
        ) : (
          <p>{c.body.hostPending}</p>
        )}
      </LegalSection>

      <LegalSection id="contact" title={c.s.contact}>
        <p>
          {c.body.contactIntro}{" "}
          <a
            href={`mailto:${entity.email.legal}`}
            className="text-signal-600 hover:underline"
          >
            {entity.email.legal}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="property" title={c.s.property}>
        <p>{c.body.property}</p>
      </LegalSection>

      <LegalSection id="mediation" title={c.s.mediation}>
        <p>{c.body.mediationIntro}</p>
        <p>{c.body.mediationPending}</p>
      </LegalSection>
    </LegalPageShell>
  );
}
