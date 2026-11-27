import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
const taskId = "11000000-0000-4000-8000-000000000001";
const fileId = "22000000-0000-4000-8000-000000000002";
const reference = `/api/v1/human-tasks/${taskId}/evidence/${fileId}`;
const photo = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jF1sAAAAASUVORK5CYII=", "base64");
const copy = {
  en: { photo: "Photos", summary: "Delivery summary", submit: "Send delivery", download: "Download private photo", tooLarge: "Choose a photo under 10 MB.", failed: "Could not add this photo." },
  fr: { photo: "Photos", summary: "Résumé du livrable", submit: "Envoyer le livrable", download: "Télécharger la photo privée", tooLarge: "Choisissez une photo de moins de 10 Mo.", failed: "Impossible d’ajouter cette photo." },
  es: { photo: "Fotos", summary: "Resumen de entrega", submit: "Enviar entrega", download: "Descargar foto privada", tooLarge: "Elige una foto de menos de 10 MB.", failed: "No se pudo añadir esta foto." },
  pt: { photo: "Fotos", summary: "Resumo da entrega", submit: "Enviar entrega", download: "Baixar foto privada", tooLarge: "Escolha uma foto com menos de 10 MB.", failed: "Não foi possível adicionar a foto." },
  zh: { photo: "照片", summary: "成果摘要", submit: "提交成果", download: "下载私密照片", tooLarge: "请选择小于 10 MB 的照片。", failed: "无法添加照片" },
};

async function workspace(page: Page, locale: string, uploadReference = reference) {
  let submitted: { evidence: Record<string, string>; summary: string } | undefined;
  let uploaded = 0;
  await page.addInitScript(selected => {
    localStorage.setItem("auth_token", "evidence-test-token"); localStorage.setItem("taskmatch_locale", selected);
    const previous = URL.revokeObjectURL.bind(URL);
    const tracked = globalThis as typeof globalThis & { evidenceRevocations: number };
    tracked.evidenceRevocations = 0;
    URL.revokeObjectURL = url => { tracked.evidenceRevocations++; previous(url); };
  }, locale);
  await page.route("**/api/v1/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me")) return route.fulfill({ json: { id: "worker", role: "client", full_name: "Photo worker", is_active: true } });
    if (path.endsWith("/human-tasks/taxonomy")) return route.fulfill({ json: { categories: [] } });
    if (path.endsWith("/workers/me")) return route.fulfill({ json: null });
    if (path.endsWith("/worker-portal/missions")) return route.fulfill({ json: { items: [{ task_id: taskId, title: "Photo mission", status: "assigned", policy_status: "approved" }], total: 1 } });
    if (path === `/api/v1/human-tasks/${taskId}`) return route.fulfill({ json: { task_id: taskId, parent_job_id: "job", title: "Photo mission", objective: "Inspect a shop window", instructions: "Photograph the window", status: submitted ? "submitted" : "assigned", policy_status: "approved", task_category: "visual_inspection", evidence_requirements: ["photo"], authorizations: ["owner_consent"], deadline: "2026-12-20T12:00:00Z", expected_duration: 30, budget: { amount_minor: 1100 }, actions: { can_submit: !submitted } } });
    if (path.endsWith(`/tasks/${taskId}/submissions`)) return route.fulfill({ json: submitted ? [{ id: "submission", status: "submitted", summary: submitted.summary, output_json: submitted.evidence }] : [] });
    if (path.endsWith(`/human-tasks/${taskId}/result`)) { submitted = route.request().postDataJSON(); return route.fulfill({ status: 201, json: { id: "submission" } }); }
    if (path.endsWith(`/human-tasks/${taskId}/evidence`)) {
      uploaded++; expect(route.request().headers().authorization).toBe("Bearer evidence-test-token");
      expect(route.request().headers()["content-type"]).toMatch(/^multipart\/form-data; boundary=/);
      return route.fulfill({ status: 201, json: { reference: uploadReference } });
    }
    if (path === reference) {
      expect(route.request().headers().authorization).toBe("Bearer evidence-test-token");
      return route.fulfill({ status: 200, contentType: "image/png", body: photo });
    }
    return route.fulfill({ json: { items: [], depends_on: [] } });
  });
  await page.goto("/human-tasks?view=request");
  await page.getByRole("button", { name: /Photo mission/ }).click();
  await expect(page.getByRole("region", { name: "Photo mission" })).toBeVisible();
  return { submitted: () => submitted, uploaded: () => uploaded };
}

for (const [locale, c] of Object.entries(copy)) {
  test(`worker uploads private photo and requester downloads with bearer (${locale})`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const state = await workspace(page, locale);
    const detail = page.getByRole("region", { name: "Photo mission" });
    await detail.getByLabel(c.summary, { exact: true }).fill("Photo evidence of the shop window");
    await detail.getByLabel(c.photo, { exact: true }).fill("Window checked.");
    const picker = detail.locator('input[type="file"]');
    await expect(picker).toHaveAttribute("capture", "environment");
    await picker.setInputFiles({ name: "private-gps-original.png", mimeType: "image/png", buffer: photo });
    await expect(detail.getByLabel(c.photo, { exact: true })).toHaveValue(`Window checked.\n${reference}`);
    await detail.getByRole("button", { name: c.submit, exact: true }).click();
    await expect.poll(() => state.submitted()?.evidence.photo).toBe(`Window checked.\n${reference}`);
    const [download] = await Promise.all([page.waitForEvent("download"), detail.getByRole("button", { name: c.download, exact: true }).click()]);
    expect(download.suggestedFilename()).toBe(`evidence-${fileId}.png`);
    const saved = test.info().outputPath("private-photo.png"); await download.saveAs(saved);
    expect(await readFile(saved)).toEqual(photo);
    await expect.poll(() => page.evaluate(() => (globalThis as typeof globalThis & { evidenceRevocations: number }).evidenceRevocations)).toBe(1);
    expect(state.uploaded()).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("oversized photo and another task reference cannot enter the evidence field", async ({ page }) => {
  const state = await workspace(page, "en", `/api/v1/human-tasks/33000000-0000-4000-8000-000000000003/evidence/${fileId}`);
  const detail = page.getByRole("region", { name: "Photo mission" });
  const picker = detail.locator('input[type="file"]');
  await picker.setInputFiles({ name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(10 * 1024 * 1024 + 1) });
  await expect(detail.getByRole("alert")).toContainText(copy.en.tooLarge);
  expect(state.uploaded()).toBe(0);
  await picker.setInputFiles({ name: "small.png", mimeType: "image/png", buffer: photo });
  await expect(detail.getByRole("alert")).toContainText(copy.en.failed);
  await expect(detail.getByLabel(copy.en.photo, { exact: true })).toHaveValue("");
});
