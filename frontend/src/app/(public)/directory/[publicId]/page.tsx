import Link from "@/components/public/localized-link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { directoryCopy } from "@/lib/directory-copy";
import { readPublicProfile } from "@/lib/directory-server";
import { COPY } from "@/lib/landing-copy";
import { requestLanguage } from "@/lib/request-locale";
import { shareMetadata } from "@/lib/share-metadata";

interface Props { params: Promise<{ publicId: string }> }

export async function generateMetadata({ params }: Props) {
  const { locale } = await requestLanguage();
  const profile = await readPublicProfile((await params).publicId);
  return shareMetadata("/directory/" + profile.id, locale, { title: profile.display_name, description: profile.summary });
}

export default async function DirectoryProfilePage({ params }: Props) {
  const { locale } = await requestLanguage();
  const profile = await readPublicProfile((await params).publicId);
  const c = directoryCopy[locale];
  const copy = COPY[locale];
  const intent = profile.kind === "human" ? "mission" : "project";
  const country = new Intl.DisplayNames([locale], { type: "region" });
  const language = new Intl.DisplayNames([locale], { type: "language" });
  return <article className="mx-auto max-w-3xl break-words px-5 py-14 sm:py-20">
    <Link className="inline-flex min-h-11 items-center gap-2 text-sm text-signal-600" href="/directory"><ArrowLeft size={16} />{c.title}</Link>
    <p className="mt-8 text-sm font-semibold text-ink-400">{c[profile.kind]}</p>
    <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink-50 sm:text-6xl">{profile.display_name}</h1>
    <p className="my-6 text-lg text-ink-300">{profile.summary}</p>
    <dl className="divide-y divide-ink-700 border-y border-ink-700">
      {[[c.expertise, profile.expertise], [c.country, profile.country && country.of(profile.country)],
        [c.language, profile.language && language.of(profile.language)]].map(([label, value]) => value && <div key={label} className="grid grid-cols-2 gap-4 py-3">
        <dt className="text-ink-400">{label}</dt><dd className="text-ink-100">{value}</dd>
      </div>)}
    </dl>
    <Link className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-md bg-signal-500 px-5 py-3 font-semibold text-ink-950" href={"/register?intent=" + intent}>{copy[intent]}<ArrowRight size={18} /></Link>
  </article>;
}
