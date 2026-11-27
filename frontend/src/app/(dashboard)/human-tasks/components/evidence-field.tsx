"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Camera, Download, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { evidenceCopy } from "@/lib/evidence-copy";
import { useTranslation } from "@/lib/i18n";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const UUID_PATTERN = "[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}";
const REFERENCE = new RegExp(`^/api/v1/human-tasks/(${UUID_PATTERN})/evidence/(${UUID_PATTERN})$`);

function privateReference(value: unknown, taskId: string): string | null {
  if (typeof value !== "string") return null;
  const match = REFERENCE.exec(value.trim());
  return match && match[1].toLowerCase() === taskId.toLowerCase() ? value.trim() : null;
}

function authenticatedHeaders(): Headers | null {
  const token = localStorage.getItem("auth_token");
  return token ? new Headers({ Authorization: `Bearer ${token}` }) : null;
}

export function EvidenceField({ taskId, label, value, onChange, busy = false }: {
  taskId: string; label: string; value: string; onChange: (value: string) => void; busy?: boolean;
}) {
  const { locale } = useTranslation(); const c = evidenceCopy[locale];
  const id = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploaded, setUploaded] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), [taskId]);

  async function upload(file: File) {
    setError(""); setUploaded(false);
    if (file.size > MAX_PHOTO_BYTES) { setError(c.tooLarge); return; }
    if (file.type && !PHOTO_TYPES.has(file.type)) { setError(c.wrongType); return; }
    const headers = authenticatedHeaders();
    if (!headers) { setError(c.signIn); return; }
    const request = new AbortController(); controller.current = request;
    setUploading(true);
    try {
      const body = new FormData(); body.append("file", file);
      const response = await fetch(`${API_BASE_URL}/v1/human-tasks/${encodeURIComponent(taskId)}/evidence`, { method: "POST", headers, body, signal: request.signal });
      if (!response.ok) throw new Error();
      const result: unknown = await response.json();
      const reference = privateReference(result && typeof result === "object" && "reference" in result ? result.reference : null, taskId);
      if (!reference) throw new Error();
      if (request.signal.aborted) return;
      onChange(value.trim() ? `${value.trim()}\n${reference}` : reference);
      setUploaded(true);
    } catch {
      if (!request.signal.aborted) setError(c.uploadFailed);
    } finally {
      setUploading(false);
      if (controller.current === request) controller.current = null;
    }
  }

  return <div className="grid min-w-0 gap-3">
    <label htmlFor={`${id}-text`} className="text-sm font-medium text-ink-200">{label}</label>
    <Textarea id={`${id}-text`} value={value} onChange={event => onChange(event.target.value)} disabled={busy || uploading} placeholder={c.note} maxLength={16000} required />
    <label htmlFor={`${id}-photo`} className="flex items-center gap-2 text-sm font-medium text-signal-600"><Camera aria-hidden="true" className="h-4 w-4" />{c.photo}</label>
    <input id={`${id}-photo`} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={busy || uploading} aria-describedby={`${id}-hint`} className="w-full min-w-0 rounded-md border border-ink-700 bg-white p-2 text-sm text-ink-300 file:mr-3 file:rounded file:border-0 file:bg-ink-900 file:px-3 file:py-2 file:text-ink-200" onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) void upload(file); }} />
    <p id={`${id}-hint`} className="text-xs leading-6 text-ink-400">{c.hint}</p>
    {uploading && <p role="status" className="flex items-center gap-2 text-sm text-ink-400"><Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />{c.uploading}</p>}
    {uploaded && <p role="status" className="text-sm text-signal-700">{c.uploaded}</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </div>;
}

export function EvidenceValue({ taskId, value }: { taskId: string; value: string }) {
  const { locale } = useTranslation(); const c = evidenceCopy[locale];
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), [taskId]);
  async function download(reference: string) {
    const headers = authenticatedHeaders();
    if (!headers) { setError(c.signIn); return; }
    const request = new AbortController(); controller.current = request;
    setError(""); setDownloading(reference);
    try {
      const response = await fetch(`${API_BASE_URL}${reference.slice(4)}`, { headers, signal: request.signal });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      if (!PHOTO_TYPES.has(blob.type) || blob.size > MAX_PHOTO_BYTES) throw new Error();
      if (request.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const extension = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
      anchor.download = `evidence-${reference.split("/").at(-1)}.${extension}`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      if (!request.signal.aborted) setError(c.downloadFailed);
    } finally {
      setDownloading(null);
      if (controller.current === request) controller.current = null;
    }
  }
  return <div className="min-w-0 space-y-2">
    {value.split("\n").map((line, index) => { const reference = privateReference(line, taskId); return reference ? <Button key={`${index}-${reference}`} type="button" variant="outline" disabled={downloading !== null} onClick={() => void download(reference)}><Download aria-hidden="true" className="mr-2 h-4 w-4" />{downloading === reference ? c.downloading : c.download}</Button> : <p key={index} className="whitespace-pre-wrap break-words text-sm leading-6 text-ink-400">{line}</p>; })}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </div>;
}
