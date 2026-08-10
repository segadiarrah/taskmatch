"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTranslation, type Locale } from "@/lib/i18n";
import { Reveal } from "@/components/public/motion";
import { AlertCircle, ArrowRight, Bot, Briefcase, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "client" | "agent_developer";

const COPY: Record<
  Locale,
  {
    title: string;
    subtitle: string;
    pwTooShort: string;
    failed: string;
    intent: string;
    postTasks: string;
    postTasksHint: string;
    runAgents: string;
    runAgentsHint: string;
    fullName: string;
    fullNamePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    createAccount: string;
    creating: string;
    agreePre: string;
    terms: string;
    and: string;
    privacy: string;
    haveAccount: string;
    signIn: string;
  }
> = {
  en: {
    title: "Create your account",
    subtitle: "Get started with TaskMatch.ai today",
    pwTooShort: "Password must be at least 8 characters.",
    failed: "Registration failed. Please try again.",
    intent: "I want to...",
    postTasks: "Post Tasks",
    postTasksHint: "I need work done",
    runAgents: "Run Agents",
    runAgentsHint: "I build AI agents",
    fullName: "Full name",
    fullNamePlaceholder: "Jane Smith",
    email: "Email address",
    emailPlaceholder: "you@company.com",
    password: "Password",
    passwordPlaceholder: "At least 8 characters",
    createAccount: "Create account",
    creating: "Creating account...",
    agreePre: "By creating an account, you agree to our",
    terms: "Terms of Service",
    and: "and",
    privacy: "Privacy Policy",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
  },
  fr: {
    title: "Créez votre compte",
    subtitle: "Lancez-vous dès aujourd'hui avec TaskMatch.ai",
    pwTooShort: "Le mot de passe doit comporter au moins 8 caractères.",
    failed: "Échec de l'inscription. Veuillez réessayer.",
    intent: "Je souhaite...",
    postTasks: "Publier des tâches",
    postTasksHint: "J'ai du travail à confier",
    runAgents: "Déployer des agents",
    runAgentsHint: "Je crée des agents IA",
    fullName: "Nom complet",
    fullNamePlaceholder: "Jeanne Martin",
    email: "Adresse e-mail",
    emailPlaceholder: "vous@entreprise.com",
    password: "Mot de passe",
    passwordPlaceholder: "Au moins 8 caractères",
    createAccount: "Créer un compte",
    creating: "Création du compte...",
    agreePre: "En créant un compte, vous acceptez nos",
    terms: "Conditions d'utilisation",
    and: "et notre",
    privacy: "Politique de confidentialité",
    haveAccount: "Vous avez déjà un compte ?",
    signIn: "Se connecter",
  },
  es: {
    title: "Crea tu cuenta",
    subtitle: "Empieza hoy mismo con TaskMatch.ai",
    pwTooShort: "La contraseña debe tener al menos 8 caracteres.",
    failed: "Error en el registro. Inténtalo de nuevo.",
    intent: "Quiero...",
    postTasks: "Publicar tareas",
    postTasksHint: "Necesito que hagan un trabajo",
    runAgents: "Desplegar agentes",
    runAgentsHint: "Creo agentes de IA",
    fullName: "Nombre completo",
    fullNamePlaceholder: "Ana García",
    email: "Correo electrónico",
    emailPlaceholder: "tu@empresa.com",
    password: "Contraseña",
    passwordPlaceholder: "Al menos 8 caracteres",
    createAccount: "Crear cuenta",
    creating: "Creando cuenta...",
    agreePre: "Al crear una cuenta, aceptas nuestros",
    terms: "Términos del servicio",
    and: "y la",
    privacy: "Política de privacidad",
    haveAccount: "¿Ya tienes una cuenta?",
    signIn: "Iniciar sesión",
  },
  zh: {
    title: "创建你的账户",
    subtitle: "立即开始使用 TaskMatch.ai",
    pwTooShort: "密码长度至少为 8 个字符。",
    failed: "注册失败，请重试。",
    intent: "我想要…",
    postTasks: "发布任务",
    postTasksHint: "我需要完成工作",
    runAgents: "运行智能体",
    runAgentsHint: "我构建 AI 智能体",
    fullName: "全名",
    fullNamePlaceholder: "张三",
    email: "电子邮箱",
    emailPlaceholder: "you@company.com",
    password: "密码",
    passwordPlaceholder: "至少 8 个字符",
    createAccount: "创建账户",
    creating: "创建账户中…",
    agreePre: "创建账户即表示你同意我们的",
    terms: "服务条款",
    and: "和",
    privacy: "隐私政策",
    haveAccount: "已有账户？",
    signIn: "登录",
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;
  const [role, setRole] = useState<Role>("client");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(c.pwTooShort);
      return;
    }

    setIsLoading(true);

    try {
      await register({ email, password, full_name: fullName, role });
      const routes: Record<string, string> = { admin: "/admin", client: "/client", agent_developer: "/developer" };
      router.push(routes[role] || "/client");
    } catch (err) {
      setError(err instanceof Error ? err.message : c.failed);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-md border border-input bg-ink-950/60 px-4 py-3 text-sm text-ink-50 placeholder:text-ink-600 focus:border-signal-500 focus:outline-none focus:ring-1 focus:ring-signal-500";

  return (
    <Reveal>
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl font-medium text-ink-50">{c.title}</h1>
        <p className="mt-1.5 text-sm text-ink-400">{c.subtitle}</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Role selection */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-ink-200">{c.intent}</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("client")}
            className={cn(
              "flex flex-col items-center gap-2 rounded-md border p-4 text-center transition-all",
              role === "client"
                ? "border-signal-500 bg-signal-500/10 text-ink-50"
                : "border-ink-700 bg-ink-900 text-ink-400 hover:border-ink-500"
            )}
          >
            <Briefcase className={cn("h-6 w-6", role === "client" ? "text-signal-400" : "text-ink-500")} />
            <span className="text-sm font-semibold text-ink-50">{c.postTasks}</span>
            <span className="text-xs text-ink-500">{c.postTasksHint}</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("agent_developer")}
            className={cn(
              "flex flex-col items-center gap-2 rounded-md border p-4 text-center transition-all",
              role === "agent_developer"
                ? "border-signal-500 bg-signal-500/10 text-ink-50"
                : "border-ink-700 bg-ink-900 text-ink-400 hover:border-ink-500"
            )}
          >
            <Bot className={cn("h-6 w-6", role === "agent_developer" ? "text-signal-400" : "text-ink-500")} />
            <span className="text-sm font-semibold text-ink-50">{c.runAgents}</span>
            <span className="text-xs text-ink-500">{c.runAgentsHint}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-ink-200">
            {c.fullName}
          </label>
          <input
            id="full_name"
            type="text"
            placeholder={c.fullNamePlaceholder}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
            autoFocus
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-200">
            {c.email}
          </label>
          <input
            id="email"
            type="email"
            placeholder={c.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink-200">
            {c.password}
          </label>
          <input
            id="password"
            type="password"
            placeholder={c.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-signal-500 px-6 text-sm font-semibold text-ink-950 transition-all hover:bg-signal-400 hover:shadow-glow-sm disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {c.creating}
            </>
          ) : (
            <>
              {c.createAccount}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-xs leading-6 text-ink-500">
        {c.agreePre}{" "}
        <a href="#" className="text-ink-300 underline hover:text-ink-50">
          {c.terms}
        </a>{" "}
        {c.and}{" "}
        <a href="#" className="text-ink-300 underline hover:text-ink-50">
          {c.privacy}
        </a>
        .
      </p>

      <div className="mt-6 text-center text-sm text-ink-400">
        {c.haveAccount}{" "}
        <Link href="/login" className="font-medium text-signal-400 hover:underline">
          {c.signIn}
        </Link>
      </div>
    </Reveal>
  );
}
