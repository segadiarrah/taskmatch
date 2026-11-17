"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Handshake, ArrowUpRight, CheckCircle2, Clock3 } from "lucide-react";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Category { labels?: Record<string,string>; required_capabilities?: string[]; id: string; execution_mode: string; evidence: string[]; authorizations: string[] }
interface Mission {
  task_id: string; parent_job_id: string; title: string; objective: string; instructions: string;
  status: string; policy_status: string; task_category: string; expected_duration: number;
  actions?: {can_submit:boolean;can_review:boolean;can_fund:boolean;can_accept:boolean}; evidence_requirements: string[]; budget: { amount_minor: number }; principal_id: string;
}
interface Opportunity { task_id: string; title: string; objective: string; worker_amount_minor: number; expected_duration: number }
interface Worker { country: string; languages: string[]; timezone: string; skills: string[]; available: boolean;
  data_consent: boolean; service_area: string; desired_rate_minor: number; payment_eligible: boolean }
interface Submission { id: string; summary: string; output_json: Record<string,string>; status: string }

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-2 text-sm font-medium text-ink-200">{label}{children}</label>;
}

export default function HumanTasksPage() {
  const { user } = useAuth();
  const { t, locale } = useTranslation();
  const [tab, setTab] = useState<"request"|"work">("request");
  const [missions, setMissions] = useState<Mission[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [worker, setWorker] = useState<Worker|null>(null);
  const [selected, setSelected] = useState<Mission|null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const operationKey = useRef<string|null>(null);
  const operationBody = useRef<string|null>(null);
  const [category, setCategory] = useState("translation_review");
  const [evidence, setEvidence] = useState<Record<string,string>>({});

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [tasks, taxonomy, profile, available] = await Promise.all([
        apiGet<{items:Mission[]}>("/v1/human-tasks"),
        apiGet<{categories:Category[]}>("/v1/human-tasks/taxonomy"),
        apiGet<Worker|null>("/v1/workers/me"),
        apiGet<{items:Opportunity[]}>("/v1/human-tasks/opportunities"),
      ]);
      setMissions(tasks.items); setCategories(taxonomy.categories); setWorker(profile); setOpportunities(available.items);
    } catch (e) { setError(e instanceof Error ? e.message : t("human.error")); }
    finally { setLoading(false); }
  }, [t]);
  useEffect(() => { void load(); }, [load]);

  async function act(action: () => Promise<void>) {
    setBusy(true); setError(""); setNotice("");
    try { await action(); setNotice(t("human.saved")); }
    catch (e) { setError(e instanceof Error ? e.message : t("human.error")); }
    finally { setBusy(false); }
  }
  async function open(id: string) {
    const [task, deliveries] = await Promise.all([
      apiGet<Mission>(`/v1/human-tasks/${id}`), apiGet<Submission[]>(`/v1/tasks/${id}/submissions`),
    ]);
    setSelected(task); setSubmissions(deliveries); setEvidence({});
  }
  function createRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    void act(async () => {
      const p = await apiPost<{id:string}>("/v1/principals",{kind:"individual", display_name:user?.full_name || "TaskMatch"});
      const c = categories.find(x=>x.id===category);
      if (!c) throw new Error(t("human.error"));
      const body = {schema_version:"tm.human-task.v1", principal_id:p.id, requester_type:"HUMAN_REQUESTER",
        title:form.get("form_title"), objective:form.get("form_objective"), instructions:form.get("form_instructions"),
        task_category:category, execution_mode:"remote", language:form.get("form_language"),
        required_capabilities:c.required_capabilities || [category], deadline:new Date(String(form.get("form_deadline"))).toISOString(),
        expected_duration:30, budget:{amount_minor:Math.round(Number(form.get("form_budget"))*100),currency:"EUR"},
        evidence_requirements:c.evidence, authorizations:c.authorizations};
      // Keep the same operation key on uncertain failures, but bind edited content to a new key.
      const serialized = JSON.stringify(body);
      if (operationBody.current !== serialized) { operationKey.current=crypto.randomUUID(); operationBody.current=serialized; }
      await apiPost("/v1/human-tasks",body,{headers:{"Idempotency-Key":operationKey.current!}});
      operationKey.current=null; operationBody.current=null; await load();
    });
  }
  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form=new FormData(event.currentTarget);
    void act(async()=> {
      const profile = await apiPut<Worker>("/v1/workers/me",{
        country:String(form.get("form_country")).toUpperCase(), languages:String(form.get("form_languages")).split(",").map(x=>x.trim()).filter(Boolean),
        timezone:form.get("form_timezone"), service_area:form.get("service_area"),
        skills:String(form.get("form_skills")).split(",").map(x=>x.trim()).filter(Boolean),
        desired_rate_minor:Math.round(Number(form.get("form_rate"))*100), available:form.has("form_available"), data_consent:form.has("form_consent"),
      }); setWorker(profile);
    });
  }
  const money = (minor:number) => new Intl.NumberFormat(undefined,{style:"currency",currency:"EUR"}).format(minor/100);
  const panel="rounded-xl border border-ink-800 bg-white p-5 sm:p-7";
  return <main className="mx-auto w-full max-w-6xl space-y-7 p-4 sm:p-8">
    <header className="grid gap-4 border-b border-ink-800 pb-7 sm:grid-cols-[1fr_auto] sm:items-end">
      <div><div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-signal-600"><Handshake size={18}/> {"TaskMatch"}<span aria-hidden="true"> / 02</span></div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("human.title")}</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-ink-400">{t("human.intro")}</p></div>
      <div className="flex gap-2"><Button variant={tab==="request"?"default":"outline"} onClick={()=>setTab("request")}>{t("human.request")}</Button>
        <Button variant={tab==="work"?"default":"outline"} onClick={()=>setTab("work")}>{t("human.work")}</Button></div>
    </header>
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}<Button variant="outline" className="ml-3" onClick={()=>void load()}>{t("human.retry")}</Button></div>}
    {notice && <p role="status" className="flex items-center gap-2 text-sm text-signal-700"><CheckCircle2 size={16}/>{notice}</p>}
    {loading ? <p>{t("human.loading")}</p> : <>
    {tab==="request" ? <section className="grid gap-7 lg:grid-cols-[1.3fr_1fr]">
      <form onSubmit={createRequest} className={`${panel} grid gap-5`}>
        <h2 className="text-xl font-semibold">{t("human.request")}</h2>
        <Field label={t("human.titleField")}><Input name="form_title" required minLength={3} maxLength={512}/></Field>
        <Field label={t("human.objective")}><Textarea name="form_objective" required minLength={5} maxLength={4000}/></Field>
        <Field label={t("human.instructions")}><Textarea name="form_instructions" required minLength={5} maxLength={16000}/></Field>
        <Field label={t("human.category")}><select className="h-10 rounded-lg border border-ink-700 bg-white px-3" value={category} onChange={e=>setCategory(e.target.value)}>
          {categories.filter(c=>c.execution_mode==="remote").map(c=><option key={c.id} value={c.id}>{c.labels?.[locale] || c.id.replaceAll("_"," ")}</option>)}</select></Field>
        <div className="grid gap-5 sm:grid-cols-2"><Field label={t("human.language")}><Input name="form_language" defaultValue="fr" required pattern="[a-z]{2,3}"/></Field>
          <Field label={t("human.budget")}><Input name="form_budget" type="number" min="1.10" step="0.01" defaultValue="11" required/></Field></div>
        <Field label={t("human.deadline")}><Input name="form_deadline" type="datetime-local" required/></Field>
        <p className="text-xs leading-5 text-ink-400">{t("human.pending")}</p>
        <Button disabled={busy} type="submit">{t("human.create")}<ArrowUpRight size={16} className="ml-2"/></Button>
      </form>
      <div className="space-y-5"><div className={panel}><h2 className="mb-4 text-xl font-semibold">{t("human.mine")}</h2>
        {!missions.length && <p className="text-sm text-ink-400">{t("human.empty")}</p>}
        {missions.map(m=><button key={m.task_id} onClick={()=>void act(()=>open(m.task_id))} className="flex w-full items-start justify-between gap-3 border-b border-ink-800 py-4 text-left last:border-0"><span className="text-sm font-medium">{m.title}<span className="mt-1 block text-xs text-ink-400">{m.policy_status} · {m.status}</span></span><ArrowUpRight size={16}/></button>)}
      </div><p className="px-1 text-xs leading-5 text-ink-400">{t("human.physical")}</p></div>
    </section> : <section className="grid gap-7 lg:grid-cols-[1fr_1.2fr]">
      <form key={worker?.country || "new"} onSubmit={saveProfile} className={`${panel} grid gap-5`}>
        <div><h2 className="text-xl font-semibold">{t("human.profile")}</h2><p className="mt-2 text-sm text-ink-400">{t("human.free")}</p></div>
        <div className="grid gap-4 sm:grid-cols-2"><Field label={t("human.country")}><Input name="form_country" defaultValue={worker?.country || "FR"} required pattern="[A-Za-z]{2}"/></Field>
          <Field label={t("human.language")}><Input name="form_languages" defaultValue={worker?.languages.join(", ") || "fr"} required/></Field></div>
        <Field label={t("human.timezone")}><Input name="form_timezone" defaultValue={worker?.timezone || "Europe/Paris"} required/></Field>
        <Field label={t("human.skills")}><Input name="form_skills" defaultValue={worker?.skills.join(", ")} required/></Field>
        <Field label={t("human.area")}><Input name="service_area" defaultValue={worker?.service_area}/></Field>
        <Field label={t("human.rate")}><Input name="form_rate" type="number" min="0" step=".01" defaultValue={(worker?.desired_rate_minor || 0)/100}/></Field>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="form_available" className="mt-1" defaultChecked={worker?.available ?? true}/>{t("human.available")}</label>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="form_consent" className="mt-1" defaultChecked={worker?.data_consent ?? false}/>{t("human.consent")}</label>
        <Button disabled={busy} type="submit">{t("human.save")}</Button>
        <p className="text-xs leading-5 text-ink-400">{t(worker?.payment_eligible?"human.eligible":"human.notEligible")}</p>
        <Button type="button" variant="outline" disabled={busy || !worker} onClick={()=>void act(async()=>{const result=await apiPost<{url:string}>("/v1/billing/connect/onboarding",{country:worker?.country});window.location.assign(result.url);})}>{t("human.payments")}</Button>
        <Button type="button" variant="ghost" disabled={busy || !worker} onClick={()=>void act(async()=>{await apiPost("/v1/billing/connect/sync");await load();})}>{t("human.sync")}</Button>
      </form>
      <div className={panel}><h2 className="mb-5 text-xl font-semibold">{t("human.opportunities")}</h2>
        {!opportunities.length && <p className="text-sm text-ink-400">{t("human.empty")}</p>}
        {opportunities.map(o=><article key={o.task_id} className="space-y-3 border-b border-ink-800 py-5 first:pt-0 last:border-0">
          <div className="flex justify-between gap-4"><h3 className="font-medium">{o.title}</h3><span className="font-mono text-signal-700">{money(o.worker_amount_minor)}</span></div>
          <p className="text-sm leading-6 text-ink-400">{o.objective}</p><p className="flex items-center gap-2 text-xs text-ink-400"><Clock3 size={14}/>{o.expected_duration} {t("human.duration")}</p>
          <Button disabled={busy || !worker?.payment_eligible} onClick={()=>void act(async()=>{await apiPost(`/v1/human-tasks/${o.task_id}/claim`);await load();await open(o.task_id);})}>{t("human.claim")}</Button>
        </article>)}
        <h2 className="mb-3 mt-8 text-xl font-semibold">{t("human.mine")}</h2>
        {missions.map(m=><button key={m.task_id} className="block py-3 text-left text-sm underline underline-offset-4" onClick={()=>void act(()=>open(m.task_id))}>{m.title}</button>)}
      </div>
    </section>}
    {selected && <section className={`${panel} space-y-5`}>
      <div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-semibold">{selected.title}</h2><p className="mt-2 text-xs text-ink-400">{t("human.status")}: {selected.policy_status} / {selected.status}</p></div><Button variant="ghost" onClick={()=>setSelected(null)}>{t("human.back")}</Button></div>
      <p className="whitespace-pre-wrap text-sm leading-6">{selected.instructions}</p>
      {selected.actions?.can_fund && <Button disabled={busy} onClick={()=>void act(async()=>{const r=await apiPost<{checkout_url:string}>(`/v1/billing/jobs/${selected.parent_job_id}/checkout`);window.location.assign(r.checkout_url);})}>{t("human.checkout")}</Button>}
      {user?.role==="admin" && selected.policy_status==="pending" && <form className="grid gap-4" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void act(async()=>{await apiPost(`/v1/human-tasks/${selected.task_id}/publish`,{authorizations_verified:true,qualifications_verified:true,notes:f.get("form_notes")});await open(selected.task_id);await load();});}}>
        <h3 className="font-semibold">{t("human.review")}</h3><Field label={t("human.notes")}><Textarea name="form_notes" required minLength={5}/></Field>
        <label className="flex gap-3 text-sm"><input type="checkbox" required/>{t("human.checked")}</label><Button disabled={busy}>{t("human.publish")}</Button>
      </form>}
      {selected.actions?.can_submit && <form className="grid gap-4" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void act(async()=>{await apiPost(`/v1/human-tasks/${selected.task_id}/result`,{summary:f.get("form_summary"),evidence});await open(selected.task_id);await load();});}}>
        <Field label={t("human.summary")}><Textarea name="form_summary" required minLength={5}/></Field>
        {selected.evidence_requirements.map(key=><Field key={key} label={t("human.evidence") + " · " + key}><Textarea required value={evidence[key]||""} onChange={e=>setEvidence({...evidence,[key]:e.target.value})}/></Field>)}
        <Button disabled={busy}>{t("human.submit")}</Button>
      </form>}
      {submissions.map(s=><article className="space-y-3 border-t border-ink-800 pt-5" key={s.id}><h3 className="font-medium">{s.summary}</h3>
        {Object.entries(s.output_json).map(([key,value])=><p key={key} className="whitespace-pre-wrap break-words text-sm"><strong>{key}</strong> — {String(value)}</p>)}
        {selected.actions?.can_review && (s.status==="submitted" || s.status==="under_review") && <div className="space-y-3"><p className="text-xs text-ink-400">{t("human.reviewNotice")}</p><div className="flex flex-wrap gap-3">
          {Object.values({value:"approved",id:"rework_requested"}).map(decision=><Button key={decision} disabled={busy} variant={decision==="approved"?"default":"outline"} onClick={()=>void act(async()=>{await apiPost(`/v1/submissions/${s.id}/reviews`,{submission_id:s.id,decision});await open(selected.task_id);await load();})}>{decision==="approved"?t("human.approve"):t("human.rework")}</Button>)}</div></div>}
      </article>)}
      {selected.actions?.can_accept && <Button disabled={busy} onClick={()=>void act(async()=>{await apiPost(`/v1/jobs/${selected.parent_job_id}/accept`);await open(selected.task_id);await load();})}>{t("human.accept")}</Button>}
    </section>}
    </>}
  </main>;
}
