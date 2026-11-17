"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authIntentHref, parsePublicIntent, postAuthDestination } from "@/lib/public-intent";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTranslation, type Locale } from "@/lib/i18n";
import { Reveal } from "@/components/public/motion";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

const COPY: Record<
  Locale,
  {
    title: string;
    subtitle: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    forgot: string;
    signIn: string;
    signingIn: string;
    invalid: string;
    inactive: string;
    failed: string;
    required: string;
    rateLimited: string;
    noAccount: string;
    createOne: string;
  }
> = {
  en: {
    title: "Welcome back",
    subtitle: "Sign in to your TaskMatch account",
    email: "Email or admin username",
    emailPlaceholder: "you@company.com",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    forgot: "Need help signing in?",
    signIn: "Sign in",
    signingIn: "Signing in...",
    invalid: "Invalid email or password. Please try again.",
    noAccount: "Don't have an account?",
    createOne: "Create one",
    inactive: "Your account is deactivated. Contact support.",
    failed: "Could not sign in. Please try again.",
    rateLimited: "Too many attempts. Please wait and try again.",
    required: "Enter your email or admin username and password.",
  },
  fr: {
    title: "Bon retour",
    subtitle: "Connectez-vous à votre compte TaskMatch",
    email: "E-mail ou identifiant administrateur",
    emailPlaceholder: "vous@entreprise.com",
    password: "Mot de passe",
    passwordPlaceholder: "Saisissez votre mot de passe",
    forgot: "Besoin d’aide pour vous connecter ?",
    signIn: "Se connecter",
    signingIn: "Connexion...",
    invalid: "E-mail ou mot de passe invalide. Veuillez réessayer.",
    noAccount: "Vous n'avez pas de compte ?",
    createOne: "Créer un compte",
    inactive: "Votre compte est désactivé. Contactez l’assistance.",
    failed: "Connexion impossible. Veuillez réessayer.",
    rateLimited: "Trop de tentatives. Patientez avant de réessayer.",
    required: "Saisissez votre e-mail ou identifiant administrateur et votre mot de passe.",
  },
  es: {
    title: "Bienvenido de nuevo",
    subtitle: "Inicia sesión en tu cuenta TaskMatch",
    email: "Correo o usuario administrador",
    emailPlaceholder: "tu@empresa.com",
    password: "Contraseña",
    passwordPlaceholder: "Introduce tu contraseña",
    forgot: "¿Necesitas ayuda para entrar?",
    signIn: "Iniciar sesión",
    signingIn: "Iniciando sesión...",
    invalid: "Correo o contraseña no válidos. Inténtalo de nuevo.",
    noAccount: "¿No tienes una cuenta?",
    createOne: "Crear una",
    inactive: "Tu cuenta está desactivada. Contacta con soporte.",
    failed: "No se pudo iniciar sesión. Inténtalo de nuevo.",
    rateLimited: "Demasiados intentos. Espera y vuelve a intentarlo.",
    required: "Introduce tu correo o usuario administrador y tu contraseña.",
  },
  zh: {
    title: "欢迎回来",
    subtitle: "登录你的 TaskMatch 账户",
    email: "邮箱或管理员用户名",
    emailPlaceholder: "you@company.com",
    password: "密码",
    passwordPlaceholder: "请输入密码",
    forgot: "需要登录帮助？",
    signIn: "登录",
    signingIn: "登录中…",
    invalid: "邮箱或密码错误，请重试。",
    noAccount: "还没有账户？",
    createOne: "立即注册",
    inactive: "您的账户已停用。请联系支持团队。",
    failed: "无法登录，请重试。",
    rateLimited: "尝试次数过多，请稍后重试。",
    required: "请输入邮箱或管理员用户名以及密码。",
  },
  pt: {
    title: "Bem-vindo de volta",
    subtitle: "Entre na sua conta TaskMatch",
    email: "E-mail ou nome de administrador",
    emailPlaceholder: "voce@empresa.com",
    password: "Senha",
    passwordPlaceholder: "Digite a sua senha",
    forgot: "Precisa de ajuda para entrar?",
    signIn: "Entrar",
    signingIn: "Entrando…",
    invalid: "E-mail ou senha inválidos. Tente novamente.",
    noAccount: "Ainda não tem uma conta?",
    createOne: "Criar uma conta",
    inactive: "A sua conta está desativada. Contate a equipe de suporte.",
    failed: "Não foi possível entrar. Tente novamente.",
    rateLimited: "Demasiadas tentativas. Aguarde e tente novamente.",
    required: "Preencha o e-mail ou nome de administrador e a senha.",
  },
};

function LoginForm() {
  const intent = parsePublicIntent(useSearchParams().get("intent"));
  const router = useRouter();
  const { login, user } = useAuth();
  const { locale } = useTranslation();
  const c = COPY[locale];
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

    if (!email.trim() || !password) {
      setError(c.required);
      return;
    }
    setIsLoading(true);

    try {
      const user = await login(email, password);
      router.push(postAuthDestination(user.role, intent));
    } catch (err) {
      const detail = err instanceof ApiError && err.body && typeof err.body === "object" && "detail" in err.body ? err.body.detail : undefined;
      setError(err instanceof ApiError
        ? detail === "Account is deactivated" ? c.inactive
          : err.status === 401 || detail === "Incorrect email or password" ? c.invalid
            : err.status === 429 ? c.rateLimited : c.failed
        : c.failed);
    } finally {
      setIsLoading(false);
    }
  };

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

      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-200">
            {c.email}
          </label>
          <input
            id="email"
            type="text"
            placeholder={c.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
            className="w-full rounded-md border border-input bg-ink-950/60 px-4 py-3 text-sm text-ink-50 placeholder:text-ink-600 focus:border-signal-500 focus:outline-none focus:ring-1 focus:ring-signal-500"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-ink-200">
              {c.password}
            </label>
            <Link href="/company/contact" className="font-mono text-xs text-signal-400 hover:underline">
              {c.forgot}
            </Link>
          </div>
          <input
            id="password"
            type="password"
            placeholder={c.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-input bg-ink-950/60 px-4 py-3 text-sm text-ink-50 placeholder:text-ink-600 focus:border-signal-500 focus:outline-none focus:ring-1 focus:ring-signal-500"
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
              {c.signingIn}
            </>
          ) : (
            <>
              {c.signIn}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-ink-400">
        {c.noAccount}{" "}
        <Link href={authIntentHref("register", intent)} className="font-medium text-signal-400 hover:underline">
          {c.createOne}
        </Link>
      </div>
    </Reveal>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
