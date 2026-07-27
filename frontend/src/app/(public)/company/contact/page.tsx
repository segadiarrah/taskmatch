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
    title: "A contact page that feels",
    accent: "as polished as the rest.",
    description: "Cleaner, sharper, and more credible — fewer generic UI patterns and a stronger brand fit.",
    cards: [
      { title: "General", body: "Use the contact form for product, partnership, or general requests." },
      { title: "Support", body: "Use the same form for support and operational issues." },
      { title: "Enterprise", body: "Commercial and sales conversations are routed through the form." },
      { title: "Documentation", body: "Technical resources and API reference remain available in the docs area." },
    ],
    asideTitle: "Useful contact framing",
    asideBody1: "This page makes it clearer where a message should go and gives the interaction a more premium, higher-trust feel.",
    asideBody2: "It also creates a clearer split between commercial, support, documentation, and broader company contact.",
    formTitle: "Send a message",
    name: "Full name",
    email: "Email address",
    subject: "Subject",
    message: "How can we help?",
    send: "Send inquiry",
    sending: "Sending…",
    errorMsg: "Unable to send your message right now.",
    sentTitle: "Message sent",
    sentBody: "The confirmation state has been aligned with the same premium visual system.",
    another: "Send another message",
  },
  fr: {
    eyebrow: "Contact",
    title: "Une page contact aussi",
    accent: "soignée que le reste.",
    description: "Plus nette, plus claire et plus crédible — moins de motifs d’interface génériques, une identité plus forte.",
    cards: [
      { title: "Général", body: "Utilisez le formulaire pour les demandes produit, partenariat ou générales." },
      { title: "Support", body: "Utilisez le même formulaire pour le support et les problèmes opérationnels." },
      { title: "Entreprise", body: "Les échanges commerciaux et ventes passent par le formulaire." },
      { title: "Documentation", body: "Les ressources techniques et la référence API restent disponibles dans la section docs." },
    ],
    asideTitle: "Cadrer votre message",
    asideBody1: "Cette page clarifie où votre message doit aller et rend l’interaction plus premium et plus fiable.",
    asideBody2: "Elle distingue aussi plus nettement le commercial, le support, la documentation et le contact général.",
    formTitle: "Envoyer un message",
    name: "Nom complet",
    email: "Adresse e-mail",
    subject: "Objet",
    message: "Comment pouvons-nous aider ?",
    send: "Envoyer la demande",
    sending: "Envoi…",
    errorMsg: "Impossible d’envoyer votre message pour le moment.",
    sentTitle: "Message envoyé",
    sentBody: "L’état de confirmation a été aligné sur le même système visuel premium.",
    another: "Envoyer un autre message",
  },
  es: {
    eyebrow: "Contacto",
    title: "Una página de contacto tan",
    accent: "pulida como el resto.",
    description: "Más limpia, más nítida y más creíble — menos patrones de interfaz genéricos y una identidad más fuerte.",
    cards: [
      { title: "General", body: "Usa el formulario para solicitudes de producto, alianzas o generales." },
      { title: "Soporte", body: "Usa el mismo formulario para soporte y problemas operativos." },
      { title: "Empresas", body: "Las conversaciones comerciales y de ventas se enrutan por el formulario." },
      { title: "Documentación", body: "Los recursos técnicos y la referencia de la API siguen disponibles en la sección de docs." },
    ],
    asideTitle: "Encuadrar tu mensaje",
    asideBody1: "Esta página aclara a dónde debe ir tu mensaje y da a la interacción una sensación más premium y de mayor confianza.",
    asideBody2: "También separa con más claridad lo comercial, el soporte, la documentación y el contacto general.",
    formTitle: "Enviar un mensaje",
    name: "Nombre completo",
    email: "Correo electrónico",
    subject: "Asunto",
    message: "¿Cómo podemos ayudar?",
    send: "Enviar consulta",
    sending: "Enviando…",
    errorMsg: "No se pudo enviar tu mensaje en este momento.",
    sentTitle: "Mensaje enviado",
    sentBody: "El estado de confirmación se ha alineado con el mismo sistema visual premium.",
    another: "Enviar otro mensaje",
  },
  zh: {
    eyebrow: "联系",
    title: "一个与其余部分同样",
    accent: "精致的联系页面。",
    description: "更干净、更利落、更可信——更少的通用界面套路,更强的品牌契合。",
    cards: [
      { title: "综合", body: "产品、合作或一般咨询请使用联系表单。" },
      { title: "支持", body: "支持与运营问题请使用同一表单。" },
      { title: "企业", body: "商务与销售沟通均通过表单转接。" },
      { title: "文档", body: "技术资源与 API 参考仍可在文档区查阅。" },
    ],
    asideTitle: "如何组织你的信息",
    asideBody1: "该页面让信息的去向更清晰,并让互动更具高端与可信之感。",
    asideBody2: "它也更清晰地区分了商务、支持、文档与公司整体联系。",
    formTitle: "发送信息",
    name: "全名",
    email: "电子邮箱",
    subject: "主题",
    message: "我们能为您做些什么?",
    send: "发送咨询",
    sending: "发送中…",
    errorMsg: "暂时无法发送您的信息。",
    sentTitle: "信息已发送",
    sentBody: "确认状态已与同一套高端视觉系统保持一致。",
    another: "再发一条信息",
  },
};

const cardIcons = [Mail, MessageSquare, Phone, BookOpen];
const inputClass =
  "rounded-2xl border-line bg-canvas text-ink placeholder:text-ink-faint focus-visible:ring-1 focus-visible:ring-[var(--accent-lime)] focus-visible:ring-offset-0";

export default function ContactPage() {
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  return (
    <div className="min-h-screen bg-canvas">
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
            <Reveal delay={120} className="mt-6 rounded-2xl border border-line bg-surface p-6">
              <h2 className="text-xl font-semibold text-ink">{c.asideTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-ink-muted">{c.asideBody1}</p>
              <p className="mt-3 text-sm leading-7 text-ink-muted">{c.asideBody2}</p>
            </Reveal>
          </div>

          <Reveal delay={80} className="rounded-3xl border border-line-strong bg-surface p-8 card-glow">
            {submitted ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-white/5">
                  <CheckCircle2 className="h-8 w-8 text-accent" />
                </div>
                <h2 className="mt-5 font-display text-2xl font-semibold text-ink">{c.sentTitle}</h2>
                <p className="mt-3 max-w-md text-sm leading-7 text-ink-muted">{c.sentBody}</p>
                <button
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-line-strong px-6 text-sm font-medium text-ink transition-colors hover:bg-white/5"
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
                  try {
                    const response = await fetch("https://formsubmit.co/ajax/sega@tauraco.ai", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Accept: "application/json" },
                      body: JSON.stringify({
                        ...form,
                        _subject: `[TaskMatch Contact] ${form.subject}`,
                        _template: "table",
                        _captcha: "false",
                      }),
                    });
                    if (!response.ok) throw new Error("send failed");
                    setSubmitted(true);
                    setForm({ name: "", email: "", subject: "", message: "" });
                  } catch {
                    setError(c.errorMsg);
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">{c.formTitle}</h2>
                <Input
                  placeholder={c.name}
                  className={inputClass}
                  required
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder={c.email}
                  type="email"
                  className={inputClass}
                  required
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                />
                <Input
                  placeholder={c.subject}
                  className={inputClass}
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
                {error ? <p className="text-sm text-red-400">{error}</p> : null}
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-accent-lime px-7 text-sm font-semibold text-[var(--accent-ink)] transition-transform hover:scale-[1.03] disabled:opacity-60"
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
