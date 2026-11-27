"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { growthCopy, type GrowthLabel } from "@/lib/growth-copy";
import { useTranslation } from "@/lib/i18n";
import { LOCALES } from "@/lib/locales";

type Fraction = { numerator: number; denominator: number; rate: number | null };
type Funnel = {
  cohort_visitors: number; excluded: number;
  events: Partial<Record<GrowthLabel,number|null>>;
  rates: Partial<Record<GrowthLabel,Fraction>>;
  retention: Record<string,{eligible:number;returned:number;rate:number|null}>;
  money: {gross_captured_minor:number;refunded_minor:number;net_collected_minor:number;quoted_platform_fee_minor:number};
  dimensions: {language:string;country:string|null;visitors:number;registrations:number}[];
};
type CampaignRow = {campaign:string;registrations:number};
type Report = {funnel:Funnel; campaigns:CampaignRow[]; registrations:number};
const fieldStyle = "mt-1 block w-full rounded-md border border-ink-700 bg-white px-3 py-2";

export default function GrowthPage() {
  const {locale} = useTranslation();
  const words = growthCopy[locale];
  const [filters,setFilters] = useState("days=7");
  const [data,setData] = useState<Report|null>(null);
  const [retry,setRetry] = useState(0);
  const [error,setError] = useState(false);
  useEffect(()=>{
    const abort = new AbortController();
    setError(false); setData(null);
    const days = new URLSearchParams(filters).get("days");
    const options = {signal:abort.signal};
    Promise.all([
      apiGet<Funnel>(`/v1/admin/growth/funnel?${filters}`,options),
      apiGet<{public_registrations:number}[]>(`/v1/admin/growth/summary?days=${days}`,options),
      apiGet<CampaignRow[]>(`/v1/admin/growth/campaigns?days=${days}`,options),
    ]).then(([funnel,summary,campaigns])=>{if(!abort.signal.aborted)setData({funnel,campaigns,registrations:summary[0]?.public_registrations??0});})
      .catch(()=>{if(!abort.signal.aborted)setError(true);});
    return ()=>abort.abort();
  },[filters,retry]);

  const currency = new Intl.NumberFormat(locale,{style:"currency",currency:"EUR"});
  const percent = new Intl.NumberFormat(locale,{style:"percent",maximumFractionDigits:1});
  const fraction = (n:number,d:number,r:number|null) => r===null ? words.noBase : `${n} / ${d} · ${percent.format(r)}`;
  const f = data?.funnel;
  return <main className="max-w-5xl space-y-7">
    <h1 className="font-display text-3xl font-semibold">{words.title}</h1>
    <form className="grid gap-3 border-y border-ink-700 py-4 text-sm sm:grid-cols-3" onSubmit={e=>{
      e.preventDefault();
      const params = new URLSearchParams();
      new FormData(e.currentTarget).forEach((value,key)=>{ if(String(value).trim())params.set(key,String(value).trim()); });
      setFilters(params.toString());setRetry(i=>i+1);
    }}>
      <label>{words.days}<input className={fieldStyle} name="days" type="number" required min="1" max="366" defaultValue="7" /></label>
      <label>{words.language}<select className={fieldStyle} name="language"><option value="">{words.all}</option>{LOCALES.map(l=><option value={l.value} key={l.value}>{l.native}</option>)}</select></label>
      <label>{words.country}<input className={fieldStyle} name="country" maxLength={2} pattern="[A-Z]{2}" /></label>
      <label>{words.source}<input className={fieldStyle} name="source" maxLength={100} /></label>
      <label>{words.campaign}<input className={fieldStyle} name="campaign" maxLength={100} /></label>
      <Button className="self-end" type="submit">{words.apply}</Button>
    </form>
    {error && <div role="alert">{words.loadError} <Button variant="outline" onClick={()=>setRetry(i=>i+1)}>{words.retry}</Button></div>}
    {!error && !data && <p role="status">{words.loading}</p>}
    {data && f && <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {([[words.overall,data.registrations],[words.cohort,f.cohort_visitors],[words.excluded,f.excluded]] as const).map(([key,value])=><div key={key} className="rounded border border-ink-700 p-4"><p className="text-sm">{key}</p><p className="text-3xl tabular-nums">{value}</p></div>)}
      </div>
      <p className="max-w-3xl text-sm">{words.notes}</p>
      <table className="w-full text-left text-sm"><thead><tr><th>{words.events}</th><th className="text-right">{words.count}</th></tr></thead>
        <tbody>{Object.entries(f.events).map(([key,value])=><tr className="border-t border-ink-700" key={key}><td className="py-2">{words[key as GrowthLabel]}</td><td className="text-right tabular-nums">{value??words.missing}</td></tr>)}</tbody></table>
      <section><h2 className="text-xl font-semibold">{words.rates}</h2><dl className="mt-3 grid grid-cols-[1fr_auto] gap-2">
        {Object.entries(f.rates).map(([k,v])=><div key={k} className="contents"><dt>{words[k as GrowthLabel]}</dt><dd>{fraction(v.numerator,v.denominator,v.rate)}</dd></div>)}
      </dl></section>
      <section><h2 className="text-xl font-semibold">{words.retention}</h2><dl className="mt-3 grid grid-cols-[1fr_auto] gap-2">
        {Object.entries(f.retention).map(([k,v])=><div key={k} className="contents"><dt>{k}</dt><dd>{fraction(v.returned,v.eligible,v.rate)}</dd></div>)}
      </dl></section>
      <dl className="grid grid-cols-[1fr_auto] gap-2 border-y border-ink-700 py-4">
        {([[words.gross,"gross_captured_minor"],[words.refunds,"refunded_minor"],[words.net,"net_collected_minor"],[words.fees,"quoted_platform_fee_minor"]] as const).map(([key,field])=><div className="contents" key={key}><dt>{key}</dt><dd>{currency.format(f.money[field]/100)}</dd></div>)}
      </dl>
      <section><h2 className="text-xl font-semibold">{words.geo}</h2>
        <table className="mt-3 w-full text-left text-sm"><thead><tr><th>{words.language}</th><th>{words.country}</th><th>{words.cohort}</th><th>{words.registration_completed}</th></tr></thead><tbody>
          {f.dimensions.map(d=><tr key={d.language+(d.country??"")}><td>{new Intl.DisplayNames([locale],{type:"language"}).of(d.language)}</td><td>{d.country??words.unknown}</td><td>{d.visitors}</td><td>{d.registrations}</td></tr>)}
        </tbody></table>
      </section>
      <section><h2 className="text-xl font-semibold">{words.campaigns}</h2><dl className="mt-3 grid grid-cols-[1fr_auto] gap-2">
        {data.campaigns.map(c=><div key={c.campaign} className="contents"><dt>{c.campaign==="(unattributed)"?words.unknown:c.campaign}</dt><dd>{c.registrations}</dd></div>)}
      </dl></section>
    </>}
  </main>;
}
