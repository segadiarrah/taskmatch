import Link from "@/components/public/localized-link";
import { ArrowRight, Bot, UserRound } from "lucide-react";
import { countryOptions } from "@/lib/countries";
import { directoryCopy } from "@/lib/directory-copy";
import { readDirectory } from "@/lib/directory-server";
import { COPY } from "@/lib/landing-copy";
import { SUPPORTED_LOCALES } from "@/lib/locales";
import { requestLanguage } from "@/lib/request-locale";

type Search = Record<string, string | string[] | undefined>;
const inputStyle = "mt-1 block h-11 w-full rounded-md border border-ink-700 bg-ink-950 px-3 text-ink-100";
const linkStyle = "inline-flex min-h-11 items-center gap-2 font-medium text-signal-600 underline underline-offset-4";

export default async function DirectoryPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { locale } = await requestLanguage();
  const c = directoryCopy[locale];
  const copy = COPY[locale];
  const search = await searchParams;
  const params = new URLSearchParams();
  const countries = countryOptions(locale);
  const langNames = new Intl.DisplayNames([locale], { type: "language" });
  const field = (key: string) => typeof search[key] === "string" ? search[key] as string : "";
  if (field("q").trim()) params.set("q", field("q").trim().slice(0, 80));
  if (field("kind") === "agent" || field("kind") === "human") params.set("kind", field("kind"));
  if (countries.some(item => item.code === field("country"))) params.set("country", field("country"));
  if (SUPPORTED_LOCALES.some(item => item === field("language"))) params.set("language", field("language"));
  const offset = Math.max(0, Math.min(1000000, Number.parseInt(field("offset"), 10) || 0));
  if (offset) params.set("offset", String(offset));
  const found = await readDirectory(params);
  const nextPage = (value: number) => {
    const query = new URLSearchParams(params);
    query.set("offset", String(value));
    return "/directory?" + query;
  };
  return <div className="mx-auto max-w-6xl px-4 py-14 sm:px-8 sm:py-20">
    <header className="max-w-3xl">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-ink-50 sm:text-6xl">{c.title}</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-300">{c.intro}</p>
    </header>
    <form action="/directory" method="get" className="my-9 grid gap-4 rounded-lg border border-ink-700 p-5 sm:grid-cols-2 lg:grid-cols-4">
      <input type="hidden" name="lang" value={locale} />
      <label className="text-sm text-ink-300">{c.search}<input className={inputStyle} name="q" type="search" maxLength={80} defaultValue={params.get("q") || ""} /></label>
      <label className="text-sm text-ink-300">{c.kind}<select className={inputStyle} name="kind" defaultValue={params.get("kind") || ""}>
        <option value="">{c.all}</option><option value="agent">{c.agent}</option><option value="human">{c.human}</option>
      </select></label>
      <label className="text-sm text-ink-300">{c.country}<select className={inputStyle} name="country" defaultValue={params.get("country") || ""}>
        <option value="">{c.all}</option>{countries.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
      </select></label>
      <label className="text-sm text-ink-300">{c.language}<select className={inputStyle} name="language" defaultValue={params.get("language") || ""}>
        <option value="">{c.all}</option>{SUPPORTED_LOCALES.map(item => <option key={item} value={item}>{langNames.of(item)}</option>)}
      </select></label>
      <button className="justify-self-start rounded-md bg-signal-500 px-5 py-2.5 font-semibold text-ink-950 hover:bg-signal-400" type="submit">{c.filter}</button>
    </form>
    {found ? found.items.length ? <ul className="divide-y divide-ink-700 border-y border-ink-700">
      {found.items.map(profile => <li key={profile.id} className="grid gap-4 py-6 sm:grid-cols-[3fr_2fr]">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 text-sm text-ink-400">{profile.kind === "agent" ? <Bot size={18} /> : <UserRound size={18} />}{c[profile.kind]}</span>
          <h2 className="mt-2 break-words font-display text-2xl font-semibold text-ink-50"><Link href={"/directory/" + profile.id}>{profile.display_name}</Link></h2>
          <p className="mt-2 break-words text-ink-300">{profile.summary}</p>
        </div>
        <div className="break-words text-sm text-ink-300">
          <p className="font-semibold">{c.expertise}</p><p>{profile.expertise}</p>
          <Link href={"/directory/" + profile.id} className={linkStyle}>{c.view}<ArrowRight size={16} /></Link>
        </div>
      </li>)}
    </ul> : <p className="border-y border-ink-700 py-7 text-ink-300">{c.empty}</p>
      : <p role="alert" className="border-y border-ink-700 py-7 text-ink-300">{c.failed}</p>}
    <div className="mt-3 flex flex-wrap gap-x-6">
      {offset > 0 && <Link className={linkStyle} href={nextPage(Math.max(0, offset - 24))}>{c.previous}</Link>}
      {found?.has_more && <Link className={linkStyle} href={nextPage(offset + 24)}>{c.next}</Link>}
    </div>
    <div className="mt-8 flex flex-wrap gap-x-6">
      <Link className={linkStyle} href="/register?intent=executor">{copy.executor}<ArrowRight size={16} /></Link>
      <Link className={linkStyle} href="/register?intent=work">{copy.work}<ArrowRight size={16} /></Link>
    </div>
  </div>;
}
