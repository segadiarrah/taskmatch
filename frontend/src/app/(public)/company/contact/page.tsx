"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, CheckCircle2, Mail, MessageSquare, Phone } from "lucide-react";
import { CardGrid, PageHero } from "@/components/public/page-shell";
import { Reveal } from "@/components/public/motion";
import { useTranslation } from "@/lib/i18n";

type Copy = {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  cards: { title: string; body: string }[];
  asideTitle: string;
  asideBody1: string;
  asideBody2: string;
  formTitle: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  send: string;
  sending: string;
  errorMsg: string;
  rateLimited: string;
  required: string;
  invalidEmail: string;
  sentTitle: string;
  sentBody: string;
  another: string;
};

const COPY: Record<"en" | "fr" | "es" | "zh" | "pt", Copy> = {
  en: {
    eyebrow: "Contact",
    title: "Talk to the",
    accent: "TaskMatch team.",
    description: "Ask the team about TaskMatch, partnerships, support or enterprise projects.",
    cards: [
      { title: "General", body: "Questions about the platform, the roadmap, or a partnership." },
      { title: "Support", body: "Operational issues, account help, or anything that is blocking you." },
      { title: "Enterprise", body: "Discuss mission scope, execution requirements and operational questions." },
      { title: "Documentation", body: "Prefer to self-serve? The docs and API reference cover the essentials." },
    ],
    asideTitle: "Where your message goes",
    asideBody1: "This form queues your message for the TaskMatch team.",
    asideBody2: "Tell us what you are building and how you would put an execution layer to work — one that runs the job and returns a validated result, not one that only routes it.",
    formTitle: "Send a message",
    name: "Full name",
    email: "Email address",
    subject: "Subject",
    message: "How can we help?",
    send: "Send message",
    sending: "Sending…",
    errorMsg: "We could not save your message. Please try again later.",
    rateLimited: "Too many messages. Please try again later.",
    sentTitle: "Message queued",
    sentBody: "Your message is saved for delivery to the team. Replies will go to the email address you entered.",
    another: "Send another message",
    required: "Complete all fields before sending your message.",
    invalidEmail: "Enter a valid email address.",
  },
  fr: {
    eyebrow: "Contact",
    title: "Parlez à l’équipe",
    accent: "TaskMatch.",
    description: "Contactez l’équipe au sujet de TaskMatch, d’un partenariat, d’une demande d’assistance ou d’un projet d’entreprise.",
    cards: [
      { title: "Général", body: "Questions sur la plateforme, la feuille de route ou un partenariat." },
      { title: "Support", body: "Problèmes opérationnels, aide sur votre compte, ou tout ce qui vous bloque." },
      { title: "Entreprise", body: "Échangez sur le périmètre des missions, les besoins d’exécution et les questions opérationnelles." },
      { title: "Documentation", body: "Vous préférez l’autonomie ? La doc et la référence API couvrent l’essentiel." },
    ],
    asideTitle: "Où va votre message",
    asideBody1: "Ce formulaire met votre message en file pour l’équipe TaskMatch.",
    asideBody2: "Dites-nous ce que vous construisez et comment vous mettriez à profit une couche d’exécution : celle qui réalise le travail et renvoie un résultat validé, pas celle qui se contente de l’aiguiller.",
    formTitle: "Envoyer un message",
    name: "Nom complet",
    email: "Adresse e-mail",
    subject: "Objet",
    message: "Comment pouvons-nous aider ?",
    send: "Envoyer le message",
    sending: "Envoi…",
    errorMsg: "Votre message n’a pas pu être enregistré. Réessayez plus tard.",
    rateLimited: "Trop de messages. Réessayez plus tard.",
    sentTitle: "Message en file d’envoi",
    sentBody: "Votre message est enregistré pour transmission à l’équipe. La réponse sera adressée à l’e-mail que vous avez indiqué.",
    another: "Envoyer un autre message",
    required: "Remplissez tous les champs avant d’envoyer votre message.",
    invalidEmail: "Saisissez une adresse e-mail valide.",
  },
  es: {
    eyebrow: "Contacto",
    title: "Habla con el equipo",
    accent: "de TaskMatch.",
    description: "Contacta con el equipo sobre TaskMatch, alianzas, soporte o proyectos empresariales.",
    cards: [
      { title: "General", body: "Preguntas sobre la plataforma, la hoja de ruta o una alianza." },
      { title: "Soporte", body: "Problemas operativos, ayuda con tu cuenta o cualquier cosa que te bloquee." },
      { title: "Empresas", body: "Habla del alcance de las misiones, los requisitos de ejecución y las cuestiones operativas." },
      { title: "Documentación", body: "¿Prefieres el autoservicio? La documentación y la referencia de la API cubren lo esencial." },
    ],
    asideTitle: "A dónde va tu mensaje",
    asideBody1: "Este formulario pone tu mensaje en cola para el equipo de TaskMatch.",
    asideBody2: "Cuéntanos qué estás construyendo y cómo aprovecharías una capa de ejecución: la que realiza el trabajo y devuelve un resultado validado, no la que solo lo enruta.",
    formTitle: "Enviar un mensaje",
    name: "Nombre completo",
    email: "Correo electrónico",
    subject: "Asunto",
    message: "¿Cómo podemos ayudar?",
    send: "Enviar mensaje",
    sending: "Enviando…",
    errorMsg: "No pudimos guardar tu mensaje. Inténtalo de nuevo más tarde.",
    rateLimited: "Demasiados mensajes. Inténtalo más tarde.",
    sentTitle: "Mensaje en cola",
    sentBody: "Tu mensaje está guardado para su envío al equipo. Las respuestas llegarán a la dirección indicada.",
    another: "Enviar otro mensaje",
    required: "Completa todos los campos antes de enviar tu mensaje.",
    invalidEmail: "Introduce un correo electrónico válido.",
  },
  zh: {
    eyebrow: "联系",
    title: "联系",
    accent: "TaskMatch 团队。",
    description: "就 TaskMatch、合作、支持或企业项目联系团队。",
    cards: [
      { title: "综合", body: "关于平台、路线图或合作的问题。" },
      { title: "支持", body: "运营问题、账户帮助，或任何阻碍你的事情。" },
      { title: "企业", body: "讨论项目范围、执行要求和运营问题。" },
      { title: "文档", body: "更想自助？文档与 API 参考涵盖要点。" },
    ],
    asideTitle: "你的信息去向何处",
    asideBody1: "此表单会将您的消息加入 TaskMatch 团队的发送队列。",
    asideBody2: "告诉我们你在构建什么，以及你会如何运用一个执行层：它真正完成任务并返回经过验证的结果，而不仅仅是转发任务。",
    formTitle: "发送信息",
    name: "全名",
    email: "电子邮箱",
    subject: "主题",
    message: "我们能为您做些什么？",
    send: "发送信息",
    sending: "发送中…",
    errorMsg: "暂时无法保存消息，请稍后重试。",
    rateLimited: "消息过多，请稍后重试。",
    sentTitle: "消息已加入发送队列",
    sentBody: "您的消息已保存并等待发送给团队。回复将发送至您填写的邮箱。",
    another: "再发一条信息",
    required: "请填写所有字段后再发送信息。",
    invalidEmail: "请输入有效的邮箱地址。",
  },
  pt: {
    eyebrow: "Contato",
    title: "Fale com a equipe",
    accent: "TaskMatch.",
    description: "Contacte a equipa sobre o TaskMatch, parcerias, apoio ou projetos empresariais.",
    cards: [
      {
        title: "Geral",
        body: "Questões sobre a plataforma, os próximos desenvolvimentos ou uma parceria."
      },
      {
        title: "Apoio",
        body: "Problemas operacionais, ajuda com a conta ou algo que esteja a impedir o seu trabalho."
      },
      {
        title: "Empresas",
        body: "Fale sobre o âmbito das missões, os requisitos de execução e as questões operacionais."
      },
      {
        title: "Documentação",
        body: "Prefere encontrar a resposta por conta própria? A documentação e a referência da API cobrem o essencial."
      }
    ],
    asideTitle: "Para onde vai a sua mensagem",
    asideBody1: "Este formulário coloca a sua mensagem na fila para a equipa TaskMatch.",
    asideBody2: "Conte-nos o que está criando e como utilizaria uma camada de execução que realiza o trabalho e devolve um resultado validado, em vez de apenas o encaminhar.",
    formTitle: "Enviar uma mensagem",
    name: "Nome completo",
    email: "Endereço de e-mail",
    subject: "Assunto",
    message: "Como podemos ajudar?",
    send: "Enviar mensagem",
    sending: "Enviando…",
    errorMsg: "Não foi possível registar a mensagem. Tente novamente mais tarde.",
    rateLimited: "Demasiadas mensagens. Tente novamente mais tarde.",
    sentTitle: "Mensagem em fila",
    sentBody: "A sua mensagem foi guardada para envio à equipa. As respostas serão enviadas para o e-mail que indicou.",
    another: "Enviar outra mensagem",
    required: "Preencha todos os campos antes de enviar a mensagem.",
    invalidEmail: "Digite um endereço de e-mail válido.",
  },
};

const cardIcons = [Mail, MessageSquare, Phone, BookOpen];
const inputClass =
  "rounded-lg border-input bg-ink-900/60 px-4 py-3 text-sm text-foreground placeholder:text-ink-500 focus:border-signal-500 focus:outline-none focus:ring-1 focus:ring-signal-500 focus-visible:border-signal-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal-500";

export default function ContactPage() {
  const { locale } = useTranslation();
  const c = COPY[locale];

  const [website, setWebsite] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  return (
    <div className="min-h-screen bg-ink-950 text-ink-50">
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title}
        accent={c.accent}
        description={c.description}
        icon={Mail}
      />

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <CardGrid items={c.cards.map((card, i) => ({ ...card, icon: cardIcons[i] }))} />
            <Reveal delay={120} className="mt-6 rounded-lg border border-ink-700 bg-ink-900 p-6">
              <h2 className="text-xl font-semibold text-ink-50">{c.asideTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-ink-300">{c.asideBody1}</p>
              <a className="text-sm text-signal-400 underline" href="mailto:sega@tauraco.ai">sega@tauraco.ai</a>
              <p className="mt-3 text-sm leading-7 text-ink-300">{c.asideBody2}</p>
            </Reveal>
          </div>

          <Reveal delay={80} className="rounded-lg border border-ink-700 bg-ink-900 p-8 shadow-panel">
            {submitted ? (
              <div role="status" className="flex flex-col items-center py-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-success/40 bg-success/10">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <h2 className="mt-5 font-display text-2xl font-medium text-ink-50">{c.sentTitle}</h2>
                <p className="mt-3 max-w-md text-sm leading-7 text-ink-300">{c.sentBody}</p>
                <button
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-md border border-ink-600 bg-transparent px-6 text-sm font-medium text-ink-100 transition-colors hover:border-ink-400 hover:bg-ink-800"
                  onClick={() => setSubmitted(false)}
                >
                  {c.another}
                </button>
              </div>
            ) : (
              <form
                noValidate
                className="space-y-5"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError(null);
                  if (Object.values(form).some(value => !value.trim())) {
                    setError(c.required);
                    return;
                  }
                  if (!e.currentTarget.querySelector<HTMLInputElement>('input[type="email"]')?.validity.valid) {
                    setError(c.invalidEmail);
                    return;
                  }
                  setSubmitting(true);
                  try {
                    const response = await fetch("/api/v1/contact", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ...form, website }),
                    });
                    if (response.status === 202 && (await response.json()).status === "queued") {
                      setSubmitted(true);
                      setForm({ name: "", email: "", subject: "", message: "" });
                    } else {
                      setError(response.status === 429 ? c.rateLimited : c.errorMsg);
                    }
                  } catch {
                    setError(c.errorMsg);
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                <h2 className="font-display text-3xl font-medium text-ink-50">{c.formTitle}</h2>
                <Input
                  placeholder={c.name}
                  aria-label={c.name}
                  maxLength={200}
                  className={`${inputClass} h-12`}
                  required
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder={c.email}
                  aria-label={c.email}
                  maxLength={320}
                  type="email"
                  className={`${inputClass} h-12`}
                  required
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                />
                <Input
                  placeholder={c.subject}
                  aria-label={c.subject}
                  maxLength={300}
                  className={`${inputClass} h-12`}
                  required
                  value={form.subject}
                  onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                />
                <Textarea
                  placeholder={c.message}
                  aria-label={c.message}
                  maxLength={8000}
                  rows={7}
                  className={inputClass}
                  required
                  value={form.message}
                  onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                />
                <input name="website" type="text" hidden tabIndex={-1} autoComplete="off" aria-hidden="true"
                  value={website} onChange={event => setWebsite(event.target.value)} />
                {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center rounded-md bg-signal-500 px-7 text-sm font-semibold text-ink-950 transition-all hover:bg-signal-400 hover:shadow-glow-sm disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? c.sending : c.send}
                </button>
              </form>
            )}
          </Reveal>
        </div>
      </section>
    </div>
  );
}
