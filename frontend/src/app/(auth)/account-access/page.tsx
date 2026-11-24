"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "@/components/public/localized-link";
import { useTranslation } from "@/lib/i18n";
import { apiPost } from "@/lib/api";

const copy = {
  en: { reset: "Reset your password", verify: "Verify your email", email: "Email address", password: "New password (at least 8 characters)", send: "Send a link", confirm: "Confirm", requested: "If this account is eligible, a message will arrive in your inbox.", completed: "Your account has been updated.", failure: "The link has expired or the service is unavailable. Request a new link or contact support.", login: "Sign in", support: "Contact support" },
  fr: { reset: "Réinitialiser le mot de passe", verify: "Vérifier votre adresse e-mail", email: "Adresse e-mail", password: "Nouveau mot de passe (8 caractères minimum)", send: "Envoyer un lien", confirm: "Confirmer", requested: "Si ce compte est éligible, vous recevrez un message.", completed: "Votre compte a été mis à jour.", failure: "Le lien a expiré ou le service est indisponible. Demandez un nouveau lien ou contactez l’assistance.", login: "Se connecter", support: "Contacter l’assistance" },
  es: { reset: "Restablecer contraseña", verify: "Verificar tu correo", email: "Correo electrónico", password: "Nueva contraseña (mínimo 8 caracteres)", send: "Enviar un enlace", confirm: "Confirmar", requested: "Si la cuenta cumple los requisitos, recibirás un mensaje.", completed: "Tu cuenta se ha actualizado.", failure: "El enlace ha caducado o el servicio no está disponible. Solicita otro enlace o contacta con soporte.", login: "Iniciar sesión", support: "Contactar con soporte" },
  pt: { reset: "Redefinir a senha", verify: "Verificar seu e-mail", email: "E-mail", password: "Nova senha (mínimo de 8 caracteres)", send: "Enviar link", confirm: "Confirmar", requested: "Se a conta for elegível, você receberá uma mensagem.", completed: "Sua conta foi atualizada.", failure: "O link expirou ou o serviço está indisponível. Solicite outro link ou entre em contato com o suporte.", login: "Entrar", support: "Contatar o suporte" },
  zh: { reset: "重置密码", verify: "验证电子邮箱", email: "电子邮箱", password: "新密码（至少 8 个字符）", send: "发送链接", confirm: "确认", requested: "如果账户符合条件，您将收到一封邮件。", completed: "您的账户已更新。", failure: "链接已过期或服务不可用。请重新申请链接或联系支持团队。", login: "登录", support: "联系支持团队" },
};

export default function AccountAccess() {
  const { locale } = useTranslation();
  const { reset, verify, email, password, send, confirm, requested, completed, failure, login, support } = copy[locale];
  const [purpose, setPurpose] = useState<"verify" | "reset">("reset");
  const [token, setToken] = useState("");
  const [result, setResult] = useState<"idle" | "pending" | "requested" | "completed" | "error">("idle");

  useEffect(() => {
    const url = new URL(window.location.href);
    setPurpose(url.searchParams.get("action") === "verify" ? "verify" : "reset");
    if (url.hash) {
      setToken(url.hash.slice(1));
      window.history.replaceState(window.history.state, "", url.pathname + url.search);
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setResult("pending");
    try {
      if (token) {
        await apiPost("/v1/auth/account-email/confirm", { token, purpose, ...(purpose === "reset" ? { password: form.get("password") } : {}) });
        setResult("completed");
        setToken("");
      } else {
        await apiPost("/v1/auth/account-email/request", { email: form.get("email"), purpose });
        setResult("requested");
      }
    } catch { setResult("error"); }
  }
  const inputClass = "block mt-2 w-full rounded-md border border-input bg-background p-3";
  return <main className="space-y-5">
    <h1 className="font-display text-2xl">{purpose === "verify" ? verify : reset}</h1>
    {result === "completed" || result === "requested" ? <p role="status">{result === "completed" ? completed : requested}</p>
      : <form onSubmit={submit} className="space-y-4">
          {!token && <label className="block">{email}<input className={inputClass} type="email" name="email" autoComplete="email" required /></label>}
          {token && purpose === "reset" && <label className="block">{password}<input className={inputClass} type="password" name="password" autoComplete="new-password" minLength={8} maxLength={128} required /></label>}
          <button className="rounded-md bg-signal-500 px-4 py-2 text-ink-950" type="submit" disabled={result === "pending"}>{token ? confirm : send}</button>
          {result === "error" && <p role="alert">{failure}</p>}
        </form>}
    <nav className="flex flex-wrap gap-4 underline"><Link href="/login">{login}</Link><Link href="/company/contact">{support}</Link></nav>
  </main>;
}
