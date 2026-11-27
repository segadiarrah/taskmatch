"use client";

import { useTranslation } from "@/lib/i18n";
import { COPY as journeys } from "@/lib/landing-copy";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface WeeklyRegistrationCounts {
  start: string;
  end: string;
  total: number;
  by_role: Record<"client" | "agent_developer", number>;
  by_intent: Record<"project" | "work" | "executor" | "mission" | "agent" | "unknown", number>;
  excluded: Record<"admin" | "test" | "seed" | "demo" | "unknown", number>;
}

const COPY = {
  en: { title: "Public registrations this week", week: "Week starting (UTC)", total: "Public accounts", roles: "Account type", intents: "Registration intent", excluded: "Excluded accounts", client: "Client", agent_developer: "Developer", admin: "Administrator", test: "Test", seed: "Provisioned fixture", demo: "Demo", unknown: "Unknown", note: "Includes new public signups. Historical accounts with unknown provenance are excluded." },
  fr: { title: "Inscriptions publiques cette semaine", week: "Semaine du (UTC)", total: "Comptes publics", roles: "Type de compte", intents: "Intention à l’inscription", excluded: "Comptes exclus", client: "Client", agent_developer: "Développeur", admin: "Administrateur", test: "Test", seed: "Compte préchargé", demo: "Démonstration", unknown: "Inconnu", note: "Les nouvelles inscriptions publiques sont comptées. Les comptes historiques d’origine inconnue sont exclus." },
  es: { title: "Registros públicos de esta semana", week: "Semana del (UTC)", total: "Cuentas públicas", roles: "Tipo de cuenta", intents: "Intención al registrarse", excluded: "Cuentas excluidas", client: "Cliente", agent_developer: "Desarrollador", admin: "Administrador", test: "Prueba", seed: "Cuenta precargada", demo: "Demostración", unknown: "Desconocido", note: "Se incluyen los nuevos registros públicos. Se excluyen las cuentas históricas de origen desconocido." },
  pt: { title: "Inscrições públicas desta semana", week: "Semana de (UTC)", total: "Contas públicas", roles: "Tipo de conta", intents: "Intenção no registo", excluded: "Contas excluídas", client: "Cliente", agent_developer: "Programador", admin: "Administrador", test: "Teste", seed: "Conta pré-carregada", demo: "Demonstração", unknown: "Desconhecido", note: "Inclui novos registos públicos. As contas históricas de origem desconhecida são excluídas." },
  zh: { title: "本周公开注册", week: "周开始日期（UTC）", total: "公开注册账户", roles: "账户类型", intents: "注册意图", excluded: "排除的账户", client: "客户", agent_developer: "开发者", admin: "管理员", test: "测试", seed: "预置账户", demo: "演示", unknown: "未知", note: "统计新公开注册的账户。来源不明的历史账户不计入。" },
};

function Counts({ title, items }: { title: string; items: { label: string; count: string }[] }) {
  return <section>
    <h3 className="font-medium text-ink-200">{title}</h3>
    <dl className="mt-2 space-y-1 text-sm">
      {items.map(item => <div key={item.label} className="flex justify-between gap-4">
        <dt className="text-ink-400">{item.label}</dt><dd className="font-mono text-ink-200">{item.count}</dd>
      </div>)}
    </dl>
  </section>;
}

export function WeeklyRegistrations({ data }: { data: WeeklyRegistrationCounts }) {
  const { locale } = useTranslation();
  const c = COPY[locale];
  const labels = { ...journeys[locale], ...c };
  const number = new Intl.NumberFormat(locale);
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" });
  const items = (counts: Record<string, number>) => Object.entries(counts).map(([key, value]) => ({
    label: String(labels[key as keyof typeof labels] ?? c.unknown), count: number.format(value),
  }));
  return <Card data-testid="weekly-registrations">
    <CardHeader>
      <CardTitle>{c.title}</CardTitle>
      <CardDescription>{c.week} {date.format(new Date(data.start))}</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="mb-4"><strong className="mr-2 font-display text-3xl">{number.format(data.total)}</strong>{c.total}</p>
      <div className="grid gap-6 sm:grid-cols-3">
        <Counts title={c.roles} items={items(data.by_role)} />
        <Counts title={c.intents} items={items(data.by_intent)} />
        <Counts title={c.excluded} items={items(data.excluded)} />
      </div>
      <p className="mt-4 text-xs text-ink-400">{c.note}</p>
    </CardContent>
  </Card>;
}
