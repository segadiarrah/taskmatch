"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { stripeUrl } from "@/lib/billing";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { workflowCopy } from "@/lib/workflow-copy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RequestForm } from "./request-form";
import { Field, LoadError, StateTag, type Action, type Category, type Mission } from "./shared";

interface Step { task_id:string; title:string; status:string; kind:string; depends_on:string[] }
export function WorkflowTools({task,busy,act,onChanged}:{task:Mission;busy:boolean;act:Action;onChanged:()=>void}) {
  const { locale }=useTranslation(); const c=workflowCopy[locale]; const {user}=useAuth();
  const [steps,setSteps]=useState<Step[]>([]); const [categories,setCategories]=useState<Category[]>([]);
  const [mode,setMode]=useState<"human"|"ai"|"amend"|null>(null); const [error,setError]=useState("");
  const [prerequisites,setPrerequisites]=useState<string[]>([]); const [version,setVersion]=useState(0);
  useEffect(()=>{let live=true;
    Promise.all([apiGet<{items:Step[]}>(`/v1/jobs/${task.parent_job_id}/steps`),apiGet<{categories:Category[]}>("/v1/human-tasks/taxonomy")])
      .then(([s,t])=>{if(live){setSteps(s.items);setCategories(t.categories);setPrerequisites(s.items.find(x=>x.task_id===task.task_id)?.depends_on||[]);setError("");}})
      .catch(e=>{if(live)setError(e instanceof Error?e.message:c.unavailable);});
    return()=>{live=false;};
  },[task.task_id,task.parent_job_id,c.unavailable,version]);
  return <section className="space-y-5 border-t border-ink-800 pt-5">
    <h3 className="font-semibold">{c.plan}</h3>
    {error&&<LoadError error={error} retry={()=>setVersion(x=>x+1)}/>}
    <ol className="space-y-3">{steps.map((step,i)=><li key={step.task_id} className="flex items-center justify-between gap-3 rounded-lg border border-ink-800 p-3 text-sm"><span>{i+1}. {step.title}<span className="ml-2 text-xs text-ink-500">{step.kind==="human"?c.human:c.automated}</span></span><StateTag value={step.status}/></li>)}</ol>
    {task.actions?.can_edit_plan&&<>
      {steps.length>1&&<form className="space-y-4" onSubmit={e=>{e.preventDefault();void act(async()=>{await apiPut(`/v1/human-tasks/${task.task_id}/dependencies`,{depends_on:prerequisites});setVersion(x=>x+1);});}}>
        <fieldset className="space-y-3"><legend className="mb-3 text-sm font-medium">{c.prerequisites}</legend>{steps.filter(s=>s.task_id!==task.task_id).map(s=><label key={s.task_id} className="flex items-start gap-3 text-sm"><input type="checkbox" checked={prerequisites.includes(s.task_id)} onChange={e=>setPrerequisites(old=>e.target.checked?[...old,s.task_id]:old.filter(x=>x!==s.task_id))}/>{s.title}</label>)}</fieldset><Button disabled={busy} variant="outline">{c.save}</Button>
      </form>}
      <div className="flex flex-wrap gap-3"><Button variant="outline" disabled={busy} onClick={()=>setMode("human")}>{c.add}</Button><Button variant="outline" disabled={busy} onClick={()=>setMode("ai")}>{c.ai}</Button></div>
    </>}
    {task.actions?.can_amend&&<Button variant="outline" disabled={busy} onClick={()=>setMode("amend")}>{c.amend}</Button>}
    {mode&&<div className="space-y-4"><Button variant="ghost" onClick={()=>setMode(null)}>{c.close}</Button>
      {mode==="amend"&&<p className="text-sm leading-6 text-ink-400">{c.amendNote}</p>}
      {mode==="ai"?<form className="grid gap-4 rounded-xl border border-ink-800 p-5" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void act(async()=>{await apiPost(`/v1/jobs/${task.parent_job_id}/steps`,{title:f.get("step_title"),instructions:f.get("step_instructions"),task_type:"research",depends_on:[task.task_id]});setMode(null);onChanged();});}}>
        <p className="text-sm leading-6 text-ink-400">{c.aiNote}</p><Field label={c.title}><Input name="step_title" required minLength={3} maxLength={512}/></Field><Field label={c.instructions}><Textarea name="step_instructions" required minLength={5} maxLength={16000}/></Field><Button disabled={busy}>{c.createAI}</Button>
      </form>:categories.length ? <RequestForm categories={categories} name={user?.full_name||"TaskMatch"} principalId={task.principal_id} parentJobId={mode==="human"?task.parent_job_id:undefined} amendmentJobId={mode==="amend"?task.parent_job_id:undefined} busy={busy} act={act} onSaved={()=>{setMode(null);onChanged();}}/> : <p>{c.empty}</p>}
    </div>}
  </section>;
}

export function FundingActions({task,busy,act,onChanged}:{task:Mission;busy:boolean;act:Action;onChanged:()=>void}) {
  const {locale}=useTranslation();const c=workflowCopy[locale];const [status,setStatus]=useState("not_started");const [error,setError]=useState("");
  useEffect(()=>{let live=true;let timer:ReturnType<typeof setTimeout>|undefined;
    const poll=async()=>{try{const result=await apiGet<{status:string}>(`/v1/human-tasks/${task.task_id}/fund`);if(!live)return;setStatus(result.status);setError("");if(result.status==="paid")onChanged();else if(result.status==="creating")timer=setTimeout(poll,4000);}catch{if(live)setError(c.unavailable);}};
    void poll();return()=>{live=false;if(timer)clearTimeout(timer);};
  },[task.task_id,c.unavailable,onChanged]);
  async function checkout(){const result=await apiPost<{checkout_url:string;status:string}>(`/v1/billing/jobs/${task.parent_job_id}/checkout`);if(result.status==="paid"){onChanged();return;}const url=stripeUrl(result.checkout_url);if(!url)throw new Error(c.unavailable);window.location.assign(url);}
  return <section className="space-y-4 border-t border-ink-800 pt-5">
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
    {status==="creating"?<p className="text-sm text-ink-400">{c.processing}</p>:status==="requires_review"?<div className="space-y-3"><p className="text-sm text-ink-400">{c.attention}</p><Button disabled={busy} onClick={()=>void act(async()=>{const r=await apiPost<{status:string}>(`/v1/human-tasks/${task.task_id}/fund/recover`,{});if(r.status!=="paid")await checkout();else onChanged();})}>{c.recover}</Button></div>:<div className="flex flex-wrap gap-3"><Button disabled={busy} onClick={()=>void act(checkout)}>{c.manualPay}</Button><Button variant="outline" disabled={busy} onClick={()=>void act(async()=>{const r=await apiPost<{status:string}>(`/v1/human-tasks/${task.task_id}/fund`);setStatus(r.status);onChanged();})}>{c.autoPay}</Button></div>}
    <Link className="inline-block text-xs text-signal-700 underline underline-offset-4" href="/human-tasks?view=agents">{c.agentSettings}</Link>
  </section>;
}
