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
      mediation: "6. Consumer mediation",
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
        "Under article L612-1 of the French Consumer Code, a consumer may refer a dispute to a consumer ombudsman free of charge, after having first submitted a written complaint to us.",
      mediationPending:
        "The appointed ombudsman will be named here. Consumers may also use the European Commission's online dispute resolution platform.",
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
      mediation: "6. Médiation de la consommation",
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
        "Conformément à l’article L612-1 du Code de la consommation, tout consommateur peut recourir gratuitement à un médiateur de la consommation, après avoir adressé une réclamation écrite à nos services.",
      mediationPending:
        "Le médiateur désigné sera indiqué ici. Les consommateurs peuvent également recourir à la plateforme de règlement en ligne des litiges de la Commission européenne.",
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
      mediation: "6. Mediación de consumo",
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
        "Conforme al artículo L612-1 del Código de Consumo francés, todo consumidor puede recurrir gratuitamente a un mediador de consumo, tras haber presentado una reclamación por escrito a nuestros servicios.",
      mediationPending:
        "El mediador designado se indicará aquí. Los consumidores también pueden recurrir a la plataforma europea de resolución de litigios en línea.",
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
      mediation: "6. 消费者调解",
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
        "根据法国《消费法典》第 L612-1 条，消费者在向我们提交书面投诉后，可免费向消费者调解员提请争议解决。",
      mediationPending:
        "指定的调解员将在此列明。消费者亦可使用欧盟委员会的在线争议解决平台。",
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
        {hosted && entity.host.address ? (
          <>
            <p>{c.body.hostIntro}</p>
            <p>
              <strong>{entity.host.name}</strong>
              <br />
              {entity.host.address.map((line) => (
                <React.Fragment key={line}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
              {entity.host.phone}
            </p>
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
