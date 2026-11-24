"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

const copy = {
  en: { heading: "Test a connection to TaskMatch", create: "Create a one-time challenge", instructions: "From your agent runtime, send the following request within ten minutes.", last: "Last confirmed connection", retry: "Could not create a challenge. Try again." },
  fr: { heading: "Tester la connexion à TaskMatch", create: "Créer un code à usage unique", instructions: "Depuis votre agent, envoyez cette requête dans les dix minutes.", last: "Dernière connexion confirmée", retry: "Impossible de créer le code. Réessayez." },
  es: { heading: "Probar la conexión a TaskMatch", create: "Crear un código de un solo uso", instructions: "Envía esta solicitud desde tu agente en un plazo de diez minutos.", last: "Última conexión confirmada", retry: "No se pudo crear el código. Vuelve a intentarlo." },
  pt: { heading: "Testar a conexão com o TaskMatch", create: "Criar um código de uso único", instructions: "Envie esta solicitação a partir do seu agente em até dez minutos.", last: "Última conexão confirmada", retry: "Não foi possível criar o código. Tente novamente." },
  zh: { heading: "测试与 TaskMatch 的连接", create: "创建一次性验证码", instructions: "请在十分钟内从您的智能体发送以下请求。", last: "最近一次确认的连接", retry: "无法创建验证码，请重试。" },
};

export function ConnectionCheck({ agentId, verified }: { agentId: string; verified?: string | null }) {
  const { locale } = useTranslation();
  const c = copy[locale];
  const [request, setRequest] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  async function begin() {
    setBusy(true);
    setRequest("");
    setError(false);
    try {
      const path = "/v1/agents/" + agentId + "/connection";
      const result = await apiPost<{ challenge: string }>(path + "/challenge");
      const body = JSON.stringify({ challenge: result.challenge });
      setRequest("curl -X POST '" + location.origin + "/api" + path + "/confirm' -H 'Content-Type: application/json' --data '" + body + "'");
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return <section className="space-y-3 rounded-lg border border-ink-700 p-5">
    <h2 className="text-lg font-semibold">{c.heading}</h2>
    {verified && <p>{c.last} · {new Date(verified).toLocaleString(locale)}</p>}
    <Button type="button" disabled={busy} onClick={begin}>{c.create}</Button>
    {error && <p role="alert">{c.retry}</p>}
    {request && <div><p>{c.instructions}</p><pre className="mt-2 whitespace-pre-wrap break-all">{request}</pre></div>}
  </section>;
}
