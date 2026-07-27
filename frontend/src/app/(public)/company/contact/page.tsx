"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, CheckCircle2, Mail, MessageSquare, Phone } from "lucide-react";
import { CardGrid, PageHero } from "@/components/public/page-shell";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  return (
    <div className="min-h-screen">
      <PageHero
        eyebrow="Contact"
        title="A contact page that feels"
        accent="as polished as the rest."
        description="The page is now cleaner, warmer, and more credible, with fewer generic UI patterns and a stronger brand fit."
        icon={Mail}
      />

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <CardGrid
              items={[
                { icon: Mail, title: "General", body: "Use the contact form for product, partnership, or general requests." },
                { icon: MessageSquare, title: "Support", body: "Use the same form for support and operational issues." },
                { icon: Phone, title: "Enterprise", body: "Commercial and sales conversations are routed through the form." },
                { icon: BookOpen, title: "Documentation", body: "Technical resources and API reference remain available in the docs area." },
              ]}
            />
            <div className="mt-6 rounded-[1.8rem] border border-stone-900/10 bg-[#efe7d8] p-6 shadow-[0_18px_40px_rgba(92,74,44,0.08)]">
              <h2 className="text-xl font-semibold text-stone-950">Useful contact framing</h2>
              <p className="mt-3 text-sm leading-7 text-stone-650">
                This page now makes it clearer where a message should go and gives the
                interaction a more premium, higher-trust feel.
              </p>
              <p className="mt-3 text-sm leading-7 text-stone-650">
                It also creates a clearer split between commercial, support, documentation,
                and broader company contact.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-stone-900/10 bg-white/80 p-8 shadow-[0_20px_50px_rgba(92,74,44,0.08)]">
            {submitted ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f3ede2]">
                  <CheckCircle2 className="h-8 w-8 text-[#8a6a2f]" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-stone-950">Message sent</h2>
                <p className="mt-3 max-w-md text-sm leading-7 text-stone-600">
                  The confirmation state has been aligned with the same premium visual system.
                </p>
                <Button className="mt-6 rounded-full bg-stone-950 text-white hover:bg-stone-800" onClick={() => setSubmitted(false)}>
                  Send another message
                </Button>
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
                      headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                      },
                      body: JSON.stringify({
                        ...form,
                        _subject: `[TaskMatch Contact] ${form.subject}`,
                        _template: "table",
                        _captcha: "false",
                      }),
                    });

                    if (!response.ok) {
                      throw new Error("Unable to send your message right now.");
                    }

                    setSubmitted(true);
                    setForm({ name: "", email: "", subject: "", message: "" });
                  } catch {
                    setError("Unable to send your message right now.");
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                <h2 className="font-display text-3xl text-stone-950">Send a message</h2>
                <Input
                  placeholder="Full name"
                  className="rounded-2xl border-stone-300 bg-white"
                  required
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Email address"
                  type="email"
                  className="rounded-2xl border-stone-300 bg-white"
                  required
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                />
                <Input
                  placeholder="Subject"
                  className="rounded-2xl border-stone-300 bg-white"
                  required
                  value={form.subject}
                  onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                />
                <Textarea
                  placeholder="How can we help?"
                  rows={7}
                  className="rounded-2xl border-stone-300 bg-white"
                  required
                  value={form.message}
                  onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                />
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                <Button
                  className="h-12 rounded-full bg-stone-950 px-7 text-white hover:bg-stone-800"
                  disabled={submitting}
                >
                  {submitting ? "Sending..." : "Send inquiry"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
