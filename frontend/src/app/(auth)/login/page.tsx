"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    noAccount: string;
    createOne: string;
  }
> = {
  en: {
    title: "Welcome back",
    subtitle: "Sign in to your TaskMatch account",
    email: "Email address",
    emailPlaceholder: "you@company.com",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    forgot: "Forgot password?",
    signIn: "Sign in",
    signingIn: "Signing in...",
    invalid: "Invalid email or password. Please try again.",
    noAccount: "Don't have an account?",
    createOne: "Create one",
  },
  fr: {
    title: "Bon retour",
    subtitle: "Connectez-vous à votre compte TaskMatch",
    email: "Adresse e-mail",
    emailPlaceholder: "vous@entreprise.com",
    password: "Mot de passe",
    passwordPlaceholder: "Saisissez votre mot de passe",
    forgot: "Mot de passe oublié ?",
    signIn: "Se connecter",
    signingIn: "Connexion...",
    invalid: "E-mail ou mot de passe invalide. Veuillez réessayer.",
    noAccount: "Vous n'avez pas de compte ?",
    createOne: "Créer un compte",
  },
  es: {
    title: "Bienvenido de nuevo",
    subtitle: "Inicia sesión en tu cuenta de TaskMatch",
    email: "Correo electrónico",
    emailPlaceholder: "tu@empresa.com",
    password: "Contraseña",
    passwordPlaceholder: "Introduce tu contraseña",
    forgot: "¿Olvidaste tu contraseña?",
    signIn: "Iniciar sesión",
    signingIn: "Iniciando sesión...",
    invalid: "Correo o contraseña no válidos. Inténtalo de nuevo.",
    noAccount: "¿No tienes una cuenta?",
    createOne: "Crear una",
  },
  zh: {
    title: "欢迎回来",
    subtitle: "登录你的 TaskMatch 账户",
    email: "电子邮箱",
    emailPlaceholder: "you@company.com",
    password: "密码",
    passwordPlaceholder: "请输入密码",
    forgot: "忘记密码？",
    signIn: "登录",
    signingIn: "登录中…",
    invalid: "邮箱或密码错误，请重试。",
    noAccount: "还没有账户？",
    createOne: "立即注册",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await login(email, password);
      const routes: Record<string, string> = { admin: "/admin", client: "/client", agent_developer: "/developer" };
      router.push(routes[user.role] || "/client");
    } catch (err) {
      setError(err instanceof Error ? err.message : c.invalid);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Reveal>
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{c.title}</h1>
        <p className="mt-1.5 text-sm text-ink-muted">{c.subtitle}</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
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
            autoFocus
            className="h-11 w-full rounded-xl border border-line bg-surface px-4 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-[var(--accent-lime)] focus:outline-none"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-ink">
              {c.password}
            </label>
            <a href="#" className="text-xs font-medium text-accent hover:opacity-80">
              {c.forgot}
            </a>
          </div>
          <input
            id="password"
            type="password"
            placeholder={c.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="h-11 w-full rounded-xl border border-line bg-surface px-4 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-[var(--accent-lime)] focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-accent-lime px-6 text-sm font-semibold text-[var(--accent-ink)] transition-transform hover:scale-[1.03] disabled:pointer-events-none disabled:opacity-60"
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

      <div className="mt-6 text-center text-sm text-ink-muted">
        {c.noAccount}{" "}
        <Link href="/register" className="font-medium text-accent hover:opacity-80">
          {c.createOne}
        </Link>
      </div>
    </Reveal>
  );
}
