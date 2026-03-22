"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  MapPin,
  Phone,
  MessageSquare,
  Send,
  ArrowRight,
  BookOpen,
  Headphones,
  Clock,
  Globe,
  Github,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Support channels                                                   */
/* ------------------------------------------------------------------ */
const channels = [
  {
    title: "Developer Support",
    description: "Technical questions about the API, SDKs, or integrations.",
    icon: Headphones,
    action: "support@taskmatch.ai",
    response: "< 4 hours",
  },
  {
    title: "Community Discord",
    description: "Chat with other developers and the TaskMatch team.",
    icon: MessageSquare,
    action: "discord.gg/taskmatch",
    response: "Real-time",
  },
  {
    title: "GitHub Issues",
    description: "Report bugs or request features in our open-source repos.",
    icon: Github,
    action: "github.com/taskmatch",
    response: "< 24 hours",
  },
  {
    title: "Documentation",
    description: "Self-serve guides, tutorials, and API reference.",
    icon: BookOpen,
    action: "/resources/documentation",
    response: "Instant",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function ContactPage() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Hero */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                {t("contact.title", "Contact Us")}
              </h1>
              <p className="mt-1 text-lg text-zinc-500">
                {t(
                  "contact.subtitle",
                  "We'd love to hear from you. Reach out and we'll respond as soon as we can."
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contact form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="flex flex-col items-center gap-4 py-12 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900">
                      Message sent!
                    </h3>
                    <p className="max-w-md text-zinc-500">
                      Thank you for reaching out. Our team will review your message
                      and get back to you within 1 business day.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSubmitted(false);
                        setForm({ name: "", email: "", subject: "", message: "" });
                      }}
                    >
                      Send another message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="name"
                          className="mb-1.5 block text-sm font-medium text-zinc-700"
                        >
                          Full Name
                        </label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Your name"
                          value={form.name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="mb-1.5 block text-sm font-medium text-zinc-700"
                        >
                          Email Address
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="subject"
                        className="mb-1.5 block text-sm font-medium text-zinc-700"
                      >
                        Subject
                      </label>
                      <Select
                        id="subject"
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        required
                      >
                        <option value="" disabled>
                          Select a topic
                        </option>
                        <option value="general">General Inquiry</option>
                        <option value="technical">Technical Support</option>
                        <option value="sales">Sales & Enterprise</option>
                        <option value="partnership">Partnership</option>
                        <option value="press">Press & Media</option>
                        <option value="careers">Careers</option>
                        <option value="other">Other</option>
                      </Select>
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="mb-1.5 block text-sm font-medium text-zinc-700"
                      >
                        Message
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="How can we help?"
                        rows={6}
                        value={form.message}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full sm:w-auto">
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-700">Email</p>
                    <p className="text-sm text-zinc-500">hello@taskmatch.ai</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Headphones className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-700">Support</p>
                    <p className="text-sm text-zinc-500">support@taskmatch.ai</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-700">Office</p>
                    <p className="text-sm text-zinc-500">
                      548 Market Street, Suite 400
                      <br />
                      San Francisco, CA 94104
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-700">
                      Business Hours
                    </p>
                    <p className="text-sm text-zinc-500">
                      Mon - Fri: 9:00 AM - 6:00 PM PST
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-700">
                      Website
                    </p>
                    <p className="text-sm text-zinc-500">www.taskmatch.ai</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ link */}
            <Card className="border-indigo-200 bg-indigo-50">
              <CardContent className="flex items-start gap-3 p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                  <HelpCircle className="h-5 w-5 text-indigo-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">
                    Check our FAQ
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600">
                    Find answers to common questions about pricing, features,
                    and integrations.
                  </p>
                  <Link
                    href="/resources/documentation"
                    className="mt-2 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Visit FAQ
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Support channels */}
        <section className="mt-16">
          <h2 className="text-xl font-bold text-zinc-900">Support Channels</h2>
          <p className="mt-2 text-zinc-500">
            Choose the best way to get help based on your needs.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {channels.map((ch) => {
              const Icon = ch.icon;
              return (
                <Card key={ch.title} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
                      <Icon className="h-5 w-5 text-zinc-700" />
                    </div>
                    <h3 className="mt-3 font-semibold text-zinc-900">
                      {ch.title}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      {ch.description}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-indigo-600">
                        {ch.action}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {ch.response}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
