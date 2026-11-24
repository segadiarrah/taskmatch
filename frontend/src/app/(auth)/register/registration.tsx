"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "@/components/public/localized-link";
import { useRouter, useSearchParams } from "next/navigation";
import { authIntentHref, captureCampaign, rememberedIntent, rememberIntent, parsePublicIntent, postAuthDestination, registrationRole, type PublicIntent } from "@/lib/public-intent";
import { COPY as JOURNEY_COPY } from "@/lib/landing-copy";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTranslation, type Locale } from "@/lib/i18n";
import { Reveal } from "@/components/public/motion";
import { AlertCircle, ArrowRight, Bot, Briefcase, Handshake, Loader2 } from "lucide-react";
import { countryOptions } from "@/lib/countries";
import { cn } from "@/lib/utils";



const COPY: Record<
  Locale,
  {
    title: string;
    country: string;
    skipCountry: string;
    subtitle: string;
    pwTooShort: string;
    failed: string;
    required: string;
    emailExists: string;
    invalidDetails: string;
    rateLimited: string;
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
    country: "Country (optional)",
    skipCountry: "Select country",
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
    emailExists: "An account with this email already exists. Sign in instead.",
    invalidDetails: "Check your name, email and password, then try again.",
    rateLimited: "Too many attempts. Please wait and try again.",
    required: "Enter your name, email and password.",
  },
  fr: {
    country: "Pays (facultatif)",
    skipCountry: "Choisir un pays",
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
    emailExists: "Un compte existe déjà avec cet e-mail. Connectez-vous.",
    invalidDetails: "Vérifiez votre nom, votre e-mail et votre mot de passe, puis réessayez.",
    rateLimited: "Trop de tentatives. Patientez avant de réessayer.",
    required: "Saisissez votre nom, votre e-mail et votre mot de passe.",
  },
  es: {
    country: "País (opcional)",
    skipCountry: "Seleccionar país",
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
    emailExists: "Ya existe una cuenta con este correo. Inicia sesión.",
    invalidDetails: "Comprueba tu nombre, correo y contraseña e inténtalo de nuevo.",
    rateLimited: "Demasiados intentos. Espera y vuelve a intentarlo.",
    required: "Introduce tu nombre, correo y contraseña.",
  },
  zh: {
    country: "国家或地区（选填）",
    skipCountry: "选择国家或地区",
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
    emailExists: "此邮箱已注册，请登录。",
    invalidDetails: "请检查姓名、邮箱和密码后重试。",
    rateLimited: "尝试次数过多，请稍后重试。",
    required: "请输入姓名、邮箱和密码。",
  },
  pt: {
    country: "País (opcional)",
    skipCountry: "Selecionar país",
    title: "Crie a sua conta",
    subtitle: "Comece hoje com o TaskMatch.ai",
    pwTooShort: "A senha deve ter pelo menos 8 caracteres.",
    failed: "Não foi possível criar a conta. Tente novamente.",
    intent: "Quero…",
    postTasks: "Publicar tarefas",
    postTasksHint: "Preciso de um trabalho feito",
    runAgents: "Executar agentes",
    runAgentsHint: "Crio agentes de IA",
    fullName: "Nome completo",
    fullNamePlaceholder: "Ana Silva",
    email: "Endereço de e-mail",
    emailPlaceholder: "voce@empresa.com",
    password: "Senha",
    passwordPlaceholder: "Pelo menos 8 caracteres",
    createAccount: "Criar conta",
    creating: "Criando conta…",
    agreePre: "Ao criar uma conta, aceita os nossos",
    terms: "Termos de Serviço",
    and: "e a",
    privacy: "Política de Privacidade",
    haveAccount: "Já tem uma conta?",
    signIn: "Entrar",
    emailExists: "Já existe uma conta com este e-mail. Entre na sua conta.",
    invalidDetails: "Verifique o nome, o e-mail e a senha e tente novamente.",
    rateLimited: "Demasiadas tentativas. Aguarde e tente novamente.",
    required: "Preencha o nome, o e-mail e a senha.",
  },
};

type Countries = ReturnType<typeof countryOptions>;

function RegisterForm({ initialLocale, initialCountries }: { initialLocale: string; initialCountries: Countries }) {
  const urlIntent = parsePublicIntent(useSearchParams().get("intent"));
  const router = useRouter();
  const { register, user } = useAuth();
  const { locale } = useTranslation();
  const c = COPY[locale];
  const [intent, setIntent] = useState<PublicIntent>(urlIntent ?? "project");
  useEffect(() => {
    if (!urlIntent) setIntent(rememberedIntent() ?? "project");
  }, [urlIntent]);
  const journey = JOURNEY_COPY[locale];
  const [country, setCountry] = useState("");
  const countries = React.useMemo(() => locale === initialLocale ? initialCountries : countryOptions(locale), [locale, initialLocale, initialCountries]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace(postAuthDestination(user.role, intent));
  }, [user, router, intent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError(c.required);
      return;
    }
    if (!e.currentTarget.querySelector<HTMLInputElement>("#email")?.validity.valid) {
      setError(c.invalidDetails);
      return;
    }

    if (password.length < 8) {
      setError(c.pwTooShort);
      return;
    }

    setIsLoading(true);

    try {
      const role = registrationRole(intent);
      await register({
        email, password, full_name: fullName, role,
        attribution: { ...captureCampaign(), intent, language: locale, ...(country ? { country } : {}) },
      });
      router.push(postAuthDestination(role, intent));
    } catch (err) {
      const detail = err instanceof ApiError && err.body && typeof err.body === "object" && "detail" in err.body ? err.body.detail : undefined;
      setError(err instanceof ApiError
        ? detail === "A user with this email already exists" ? c.emailExists
          : err.status === 422 ? c.invalidDetails
            : err.status === 429 ? c.rateLimited : c.failed
        : c.failed);
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
        <div role="alert" className="mb-4 flex items-center gap-2 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <fieldset className="mb-6">
        <legend className="mb-2 text-sm font-medium text-ink-200">{c.intent}</legend>
        <div className="grid gap-2">
          {([{ value: "project", label: journey.project, Icon: Briefcase }, { value: "executor", label: journey.executor, Icon: Bot }, { value: "mission", label: journey.mission, Icon: Handshake }, { value: "work", label: journey.work, Icon: Handshake }, { value: "agent", label: journey.agent, Icon: Bot }] as const).map(({ value, label, Icon }) => <label key={value} className={cn("flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm", intent === value ? "border-signal-500 bg-signal-500/10" : "border-ink-700 hover:border-ink-500")}><input type="radio" name="form_intent" value={value} checked={intent === value} onChange={() => { setIntent(value); rememberIntent(value); }} className="accent-signal-600" /><Icon aria-hidden="true" className="h-4 w-4 text-signal-600" /><span>{label}</span></label>)}
        </div>
      </fieldset>

      <form noValidate onSubmit={handleSubmit} className="space-y-4">
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

        <div>
          <label htmlFor="country" className="mb-1.5 block text-sm font-medium text-ink-200">{c.country}</label>
          <select id="country" autoComplete="country" value={country} onChange={event => setCountry(event.target.value)} className={inputClass}>
            <option value="">{c.skipCountry}</option>
            {countries.map(option => <option key={option.code} value={option.code}>{option.name}</option>)}
          </select>
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
        <Link href="/legal/terms" className="text-ink-300 underline hover:text-ink-50">
          {c.terms}
        </Link>{" "}
        {c.and}{" "}
        <Link href="/legal/privacy" className="text-ink-300 underline hover:text-ink-50">
          {c.privacy}
        </Link>
        .
      </p>

      <div className="mt-6 text-center text-sm text-ink-400">
        {c.haveAccount}{" "}
        <Link href={authIntentHref("login", intent)} className="font-medium text-signal-400 hover:underline">
          {c.signIn}
        </Link>
      </div>
    </Reveal>
  );
}

export default function Registration(props: { initialLocale: string; initialCountries: Countries }) {
  return <Suspense><RegisterForm {...props} /></Suspense>;
}
