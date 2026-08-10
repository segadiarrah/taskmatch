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
  sentTitle: string;
  sentBody: string;
  another: string;
};

const COPY: Record<"en" | "fr" | "es" | "zh", Copy> = {
  en: {
    eyebrow: "Contact",
    title: "Talk to the",
    accent: "TaskMatch team.",
    description: "Product, partnership, support, or enterprise — send a message and it reaches us directly. We usually reply within one business day.",
    cards: [
      { title: "General", body: "Questions about the platform, the roadmap, or a partnership." },
      { title: "Support", body: "Operational issues, account help, or anything that is blocking you." },
      { title: "Enterprise", body: "Volume pricing, security reviews, SLAs, and custom deployments." },
      { title: "Documentation", body: "Prefer to self-serve? The docs and API reference cover the essentials." },
    ],
    asideTitle: "Where your message goes",
    asideBody1: "Every message from this form lands straight in the team inbox — no ticket maze, no autoresponder loop.",
    asideBody2: "Tell us what you are building and how you would put an execution layer to work — one that runs the job and returns a validated result, not one that only routes it.",
    formTitle: "Send a message",
    name: "Full name",
    email: "Email address",
    subject: "Subject",
    message: "How can we help?",
    send: "Send message",
    sending: "Sending…",
    errorMsg: "Could not send your message right now. You can also email sega@tauraco.ai directly.",
    sentTitle: "Message sent",
    sentBody: "Thanks — it is on its way to the team. We will reply to the email address you provided.",
    another: "Send another message",
  },
  fr: {
    eyebrow: "Contact",
    title: "Parlez à l’équipe",
    accent: "TaskMatch.",
    description: "Produit, partenariat, support ou entreprise — envoyez un message, il nous parvient directement. Nous répondons généralement sous un jour ouvré.",
    cards: [
      { title: "Général", body: "Questions sur la plateforme, la feuille de route ou un partenariat." },
      { title: "Support", body: "Problèmes opérationnels, aide sur votre compte, ou tout ce qui vous bloque." },
      { title: "Entreprise", body: "Tarifs au volume, revues de sécurité, SLA et déploiements sur mesure." },
      { title: "Documentation", body: "Vous préférez l’autonomie ? La doc et la référence API couvrent l’essentiel." },
    ],
    asideTitle: "Où va votre message",
    asideBody1: "Chaque message de ce formulaire arrive directement dans la boîte de l’équipe — pas de labyrinthe de tickets, pas de réponse automatique.",
    asideBody2: "Dites-nous ce que vous construisez et comment vous mettriez à profit une couche d’exécution : celle qui réalise le travail et renvoie un résultat validé, pas celle qui se contente de l’aiguiller.",
    formTitle: "Envoyer un message",
    name: "Nom complet",
    email: "Adresse e-mail",
    subject: "Objet",
    message: "Comment pouvons-nous aider ?",
    send: "Envoyer le message",
    sending: "Envoi…",
    errorMsg: "Impossible d’envoyer votre message pour le moment. Vous pouvez aussi écrire directement à sega@tauraco.ai.",
    sentTitle: "Message envoyé",
    sentBody: "Merci — il est en route vers l’équipe. Nous répondrons à l’adresse e-mail indiquée.",
    another: "Envoyer un autre message",
  },
  es: {
    eyebrow: "Contacto",
    title: "Habla con el equipo",
    accent: "de TaskMatch.",
    description: "Producto, alianzas, soporte o empresa — envía un mensaje y nos llega directamente. Solemos responder en un día hábil.",
    cards: [
      { title: "General", body: "Preguntas sobre la plataforma, la hoja de ruta o una alianza." },
      { title: "Soporte", body: "Problemas operativos, ayuda con tu cuenta o cualquier cosa que te bloquee." },
      { title: "Empresas", body: "Precios por volumen, revisiones de seguridad, SLA y despliegues a medida." },
      { title: "Documentación", body: "¿Prefieres el autoservicio? La documentación y la referencia de la API cubren lo esencial." },
    ],
    asideTitle: "A dónde va tu mensaje",
    asideBody1: "Cada mensaje de este formulario llega directo al buzón del equipo — sin laberinto de tickets ni respuestas automáticas.",
    asideBody2: "Cuéntanos qué estás construyendo y cómo aprovecharías una capa de ejecución: la que realiza el trabajo y devuelve un resultado validado, no la que solo lo enruta.",
    formTitle: "Enviar un mensaje",
    name: "Nombre completo",
    email: "Correo electrónico",
    subject: "Asunto",
    message: "¿Cómo podemos ayudar?",
    send: "Enviar mensaje",
    sending: "Enviando…",
    errorMsg: "No se pudo enviar tu mensaje ahora mismo. También puedes escribir directamente a sega@tauraco.ai.",
    sentTitle: "Mensaje enviado",
    sentBody: "Gracias — va en camino al equipo. Responderemos al correo que indicaste.",
    another: "Enviar otro mensaje",
  },
  zh: {
    eyebrow: "联系",
    title: "联系",
    accent: "TaskMatch 团队。",
    description: "产品、合作、支持或企业需求——发送信息，直达我们。我们通常在一个工作日内回复。",
    cards: [
      { title: "综合", body: "关于平台、路线图或合作的问题。" },
      { title: "支持", body: "运营问题、账户帮助，或任何阻碍你的事情。" },
      { title: "企业", body: "规模定价、安全评审、SLA 与定制部署。" },
      { title: "文档", body: "更想自助？文档与 API 参考涵盖要点。" },
    ],
    asideTitle: "你的信息去向何处",
    asideBody1: "本表单的每一条信息都直达团队邮箱——没有工单迷宫，没有自动回复循环。",
    asideBody2: "告诉我们你在构建什么，以及你会如何运用一个执行层：它真正完成任务并返回经过验证的结果，而不仅仅是转发任务。",
    formTitle: "发送信息",
    name: "全名",
    email: "电子邮箱",
    subject: "主题",
    message: "我们能为您做些什么？",
    send: "发送信息",
    sending: "发送中…",
    errorMsg: "暂时无法发送您的信息。您也可以直接发送邮件至 sega@tauraco.ai。",
    sentTitle: "信息已发送",
    sentBody: "谢谢——信息正在发往团队。我们会回复您填写的邮箱。",
    another: "再发一条信息",
  },
};

const cardIcons = [Mail, MessageSquare, Phone, BookOpen];
const inputClass =
  "rounded-lg border-input bg-ink-900/60 px-4 py-3 text-sm text-foreground placeholder:text-ink-500 focus:border-signal-500 focus:outline-none focus:ring-1 focus:ring-signal-500 focus-visible:border-signal-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal-500";

export default function ContactPage() {
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;

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
              <p className="mt-3 text-sm leading-7 text-ink-300">{c.asideBody2}</p>
            </Reveal>
          </div>

          <Reveal delay={80} className="rounded-lg border border-ink-700 bg-ink-900 p-8 shadow-panel">
            {submitted ? (
              <div className="flex flex-col items-center py-10 text-center">
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
                className="space-y-5"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSubmitting(true);
                  setError(null);
                  let ok = false;
                  // Primary: our backend delivers to sega@tauraco.ai via SMTP (Brevo).
                  try {
                    const response = await fetch("/api/v1/contact", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(form),
                    });
                    ok = response.ok;
                  } catch {
                    ok = false;
                  }
                  // Fallback: FormSubmit (also delivers to sega@tauraco.ai).
                  if (!ok) {
                    try {
                      const fallback = await fetch("https://formsubmit.co/ajax/sega@tauraco.ai", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Accept: "application/json" },
                        body: JSON.stringify({
                          ...form,
                          _subject: `[TaskMatch Contact] ${form.subject}`,
                          _template: "table",
                          _captcha: "false",
                        }),
                      });
                      ok = fallback.ok;
                    } catch {
                      ok = false;
                    }
                  }
                  if (ok) {
                    setSubmitted(true);
                    setForm({ name: "", email: "", subject: "", message: "" });
                  } else {
                    setError(c.errorMsg);
                  }
                  setSubmitting(false);
                }}
              >
                <h2 className="font-display text-3xl font-medium text-ink-50">{c.formTitle}</h2>
                <Input
                  placeholder={c.name}
                  className={`${inputClass} h-12`}
                  required
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder={c.email}
                  type="email"
                  className={`${inputClass} h-12`}
                  required
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                />
                <Input
                  placeholder={c.subject}
                  className={`${inputClass} h-12`}
                  required
                  value={form.subject}
                  onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                />
                <Textarea
                  placeholder={c.message}
                  rows={7}
                  className={inputClass}
                  required
                  value={form.message}
                  onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                />
                {error ? <p className="text-sm text-danger">{error}</p> : null}
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
