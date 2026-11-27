"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { apiGet, apiPut } from "@/lib/api";
import { activityCopy } from "@/lib/activity-copy";
import { useTranslation } from "@/lib/i18n";
import { formatStatus } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Category = "signup" | "profile" | "mission" | "agent_task" | "application" | "assignment" | "delivery" | "validation" | "payment" | "connection";
interface Activity {
  track: string; categories: Category[]; steps: Record<string, boolean>; agent_id: string | null; muted: Category[];
  events: { id: string; category: Category; at: string; state: string; href: string; title: string }[];
}
type Labels = typeof activityCopy[keyof typeof activityCopy];

function RequestDemo({ c }: { c: Labels }) {
  const [within, setWithin] = useState<boolean | null>(null);
  function check(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setWithin(Math.round(Number(data.get("amount")) * 100) <= Math.round(Number(data.get("limit")) * 100));
  }
  return <details className="rounded-md border border-ink-700 p-4" id="local-demo">
    <summary className="cursor-pointer font-medium">{c.demo}</summary>
    <p className="mt-2 text-sm text-ink-400">{c.demoHint}</p>
    <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={check} onChange={() => setWithin(null)}>
      <label className="sm:col-span-2">{c.request}<Input name="request" minLength={3} maxLength={240} required /></label>
      <label>{c.limit}<Input type="number" name="limit" min="0.01" step="0.01" max="1000000" required /></label>
      <label>{c.amount}<Input type="number" name="amount" min="0.01" step="0.01" max="1000000" required /></label>
      <Button type="submit" className="justify-self-start">{c.preview}</Button>
    </form>
    {within !== null && <p role="status" className="mt-3">{within ? c.within : c.exceeds}</p>}
  </details>;
}

function Activation({ data, c }: { data: Activity; c: Labels }) {
  const example = "/#project-example";
  const work = "/human-tasks?view=work";
  const agents = "/human-tasks?view=agents";
  const detail = data.agent_id ? "/developer/agents/" + data.agent_id : "/developer/agents/new";
  type Step = [string, string, boolean?];
  const tracks: Record<string, Step[]> = {
    project: [[c.brief, "/client/jobs/new", data.steps.brief], [c.example, example], [c.project, "/client/jobs/new", data.steps.project]],
    work: [[c.setupProfile, work, data.steps.profile], [c.skills, work, data.steps.skills], [c.missions, work], [c.preferences, work, data.steps.preferences]],
    executor: [[c.agent, "/developer/agents/new", data.steps.agent], [c.connect, detail, data.steps.connect], [c.capabilities, detail, data.steps.capabilities], [c.tasks, "/developer/tasks"]],
    mission: [[c.identity, "/human-tasks?view=request", data.steps.identity], [c.budget, "/human-tasks?view=request"], [c.demo, "#local-demo"]],
    agent: [[c.identity, agents, data.steps.identity], [c.mandate, agents, data.steps.mandate], [c.budget, agents, data.steps.budget], [c.demo, "#local-demo"]],
  };
  const list = tracks[data.track] || tracks.project;
  return <section className="space-y-3 rounded-lg border border-ink-700 p-5">
    <h2 className="font-display text-xl font-semibold">{c.checklist}</h2>
    <ul>{list.map(([label, href, done]) => <li key={label} className="flex items-center gap-3 py-1">
      {done ? <Check aria-label={c.done} className="w-4 text-success" /> : <Circle aria-hidden="true" className="w-4 text-ink-400" />}
      <Link href={href} className="inline-flex min-h-10 items-center font-medium text-signal-600 underline">{label}</Link>
    </li>)}</ul>
    {(data.track === "mission" || data.track === "agent") && <RequestDemo c={c} />}
  </section>;
}

export default function ActivityPage() {
  const { locale } = useTranslation();
  const c = activityCopy[locale];
  const [data, setData] = useState<Activity | null>(null);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState<Category[]>([]);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setFailed(false);
    try {
      const value = await apiGet<Activity>("/v1/account/activity");
      setData(value); setMuted(value.muted);
    } catch { setFailed(true); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function save() {
    setBusy(true); setSaved(false); setFailed(false);
    try {
      await apiPut("/v1/account/activity/preferences", { muted });
      await load(); setSaved(true);
    } catch { setFailed(true); }
    finally { setBusy(false); }
  }
  const timestamp = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  return <div className="mx-auto max-w-4xl space-y-6">
    <h1 className="font-display text-3xl font-semibold">{c.title}</h1>
    {failed && <div role="alert">{c.error} <Button onClick={load} variant="outline">{c.retry}</Button></div>}
    {!data && !failed && <p role="status">{c.load}</p>}
    {data && <>
      <Activation data={data} c={c} />
      <section className="rounded-lg border border-ink-700 p-5"><h2 className="font-display text-xl font-semibold">{c.feed}</h2>
        {data.events.length ? <ul className="mt-3 divide-y divide-ink-700">{data.events.map(event => <li key={event.id} className="py-3">
          <Link className="font-semibold text-signal-600 underline" href={event.href}>{c[event.category]}</Link>
          {event.title && <p className="text-sm">{event.title}</p>}
          <p className="text-xs text-ink-400">{event.state && <span className="mr-2">{formatStatus(event.state, locale)}</span>}<time dateTime={event.at}>{timestamp.format(new Date(event.at))}</time></p>
        </li>)}</ul> : <p className="mt-3 text-ink-400">{c.empty}</p>}
      </section>
      <details className="rounded-lg border border-ink-700 p-5">
        <summary className="cursor-pointer font-semibold">{c.prefs}</summary>
        <fieldset disabled={busy} className="my-4 grid gap-2 sm:grid-cols-2">
          {data.categories.map(key => <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={!muted.includes(key)}
            onChange={e => { setSaved(false); setMuted(previous => e.target.checked ? previous.filter(item => item !== key) : [...previous, key]); }} />{c[key]}</label>)}
        </fieldset>
        <Button disabled={busy} onClick={save}>{c.save}</Button>{saved && <p className="mt-2" role="status">{c.saved}</p>}
      </details>
    </>}
  </div>;
}
