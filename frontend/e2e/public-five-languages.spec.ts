import { expect, test } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { getLocalizedRouteMetadata } from "../src/lib/localized-page-copy";

const locales = ["en", "fr", "es", "zh", "pt"] as const;
const frontend = process.cwd();
function walk(path: string): string[] {
  return readdirSync(resolve(frontend, path), { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(`${path}/${entry.name}`) : [`${path}/${entry.name}`]);
}
const files = ["src/lib/landing-copy.ts", "src/app/loading.tsx", "src/app/not-found.tsx", ...walk("src/app/(auth)"), ...walk("src/app/(public)"), ...walk("src/components/public")].filter(path => /\.tsx?$/.test(path) && !/\/(resources|changelog)\//.test(path));
function shape(node: ts.Expression): unknown {
  if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.filter(ts.isPropertyAssignment).map(property => [property.name.getText().replace(/^['"]|['"]$/g, ""), shape(property.initializer)]));
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(element => shape(element as ts.Expression));
  return "text";
}

test("public bundles explicitly cover all five languages with complete shapes", () => {
  let bundles = 0;
  for (const path of files) {
    const source = readFileSync(resolve(frontend, path), "utf8");
    const parsed = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, path.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const visit = (node: ts.Node) => {
      if (ts.isVariableDeclaration(node) && /^(COPY|LABELS)$/.test(node.name.getText()) && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
        bundles += 1;
        const properties = node.initializer.properties.filter(ts.isPropertyAssignment);
        expect(properties.map(property => property.name.getText()).sort(), path).toEqual([...locales].sort());
        const english = properties.find(property => property.name.getText() === "en")!;
        for (const property of properties) expect(shape(property.initializer), `${path}:${property.name.getText()}`).toEqual(shape(english.initializer));
      }
      ts.forEachChild(node, visit);
    };
    visit(parsed);
    expect(source, path).not.toMatch(/COPY\[locale\]\s*\?\?\s*COPY\.en/);
  }
  expect(bundles).toBeGreaterThan(10);
});

for (const locale of locales) {
  const translated = {
    en: { home: "Your project. The right skills.", login: "Welcome back", register: "Create your account", legal: "Terms of Service" },
    fr: { home: "Votre projet. Les bonnes compétences.", login: "Bon retour", register: "Créez votre compte", legal: "Conditions générales d’utilisation" },
    es: { home: "Tu proyecto. Las habilidades adecuadas.", login: "Bienvenido de nuevo", register: "Crea tu cuenta", legal: "Términos del servicio" },
    zh: { home: "你的项目。合适的技能。", login: "欢迎回来", register: "创建你的账户", legal: "服务条款" },
    pt: { home: "Seu projeto. As competências certas.", login: "Bem-vindo de volta", register: "Crie a sua conta", legal: "Termos de Serviço" },
  }[locale];
  test(`public and auth pages render in ${locale}`, async ({ page }) => {
    await page.addInitScript(selected => localStorage.setItem("taskmatch_locale", selected), locale);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(translated.home);
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(translated.login);
    await page.goto("/register");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(translated.register);
    await page.goto("/legal/terms");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(translated.legal);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
  });
}


test("public form errors and accessible names use localized copy", () => {
  for (const path of ["src/app/(auth)/login/page.tsx", "src/app/(auth)/register/page.tsx"]) {
    const source = readFileSync(resolve(frontend, path), "utf8");
    expect(source, path).not.toMatch(/setError\(err instanceof Error \? err\.message/);
  }
  for (const path of ["src/app/(auth)/login/page.tsx", "src/app/(auth)/register/page.tsx", "src/app/(public)/company/contact/page.tsx"]) expect(readFileSync(resolve(frontend, path), "utf8"), path).toContain("noValidate");
  const contact = readFileSync(resolve(frontend, "src/app/(public)/company/contact/page.tsx"), "utf8");
  for (const field of ["name", "email", "subject", "message"]) expect(contact).toContain(`aria-label={c.${field}}`);
  const notice = readFileSync(resolve(frontend, "src/app/(public)/legal/notice/page.tsx"), "utf8");
  expect(notice).not.toContain("<li>TVA ");
  const landing = readFileSync(resolve(frontend, "src/lib/landing-copy.ts"), "utf8");
  expect(landing.match(/eyebrow: \"TaskMatch · AI agents and human expertise\"/g)).toHaveLength(1);
});

for (const scenario of [
  { path: "/login", endpoint: "login", status: 401, detail: "Incorrect email or password", expected: "E-mail ou senha inválidos. Tente novamente." },
  { path: "/login", endpoint: "login", status: 400, detail: "Account is deactivated", expected: "A sua conta está desativada. Contate a equipe de suporte." },
  { path: "/register", endpoint: "register", status: 400, detail: "A user with this email already exists", expected: "Já existe uma conta com este e-mail. Entre na sua conta." },
]) {
  test(`Portuguese auth localizes ${scenario.detail}`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("taskmatch_locale", "pt"));
    await page.route(`**/api/v1/auth/${scenario.endpoint}`, route => route.fulfill({ status: scenario.status, json: { detail: scenario.detail } }));
    await page.goto(scenario.path);
    if (scenario.path === "/register") await page.getByLabel("Nome completo", { exact: true }).fill("Ana Teste");
    await page.getByLabel(scenario.path === "/register" ? "Endereço de e-mail" : "E-mail ou nome de administrador", { exact: true }).fill("ana@example.test");
    await page.getByLabel("Senha", { exact: true }).fill("test-password");
    await page.getByRole("button", { name: scenario.path === "/register" ? "Criar conta" : "Entrar", exact: true }).click();
    await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toHaveText(scenario.expected);
  });
}


test("public forms validate in Portuguese without browser-language messages", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("taskmatch_locale", "pt"));
  await page.goto("/login");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toHaveText("Preencha o e-mail ou nome de administrador e a senha.");
  await page.goto("/register");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toHaveText("Preencha o nome, o e-mail e a senha.");
  await page.goto("/company/contact");
  await page.getByRole("button", { name: "Enviar mensagem", exact: true }).click();
  await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toHaveText("Preencha todos os campos antes de enviar a mensagem.");
});

test("route metadata is localized without copying route identifiers into titles", async () => {
  const publicPaths = ["/", "/how-it-works", "/for-clients", "/for-developers", "/pricing", "/changelog", "/company/about", "/company/careers", "/company/contact", "/company/press-kit", "/resources/documentation", "/resources/api-reference", "/resources/sdk", "/resources/guides", "/resources/blog", "/legal/notice", "/legal/privacy", "/legal/terms", "/legal/security", "/legal/compliance", "/login", "/register"];
  const dashboardPaths = ["/human-tasks", "/client", "/client/jobs", "/client/jobs/new", "/client/jobs/private-id", "/developer", "/developer/agents", "/developer/agents/new", "/developer/agents/private-id", "/developer/tasks", "/developer/tasks/private-id", "/developer/earnings", "/admin", "/admin/jobs", "/admin/jobs/private-id", "/admin/tasks", "/admin/tasks/private-id", "/admin/agents", "/admin/agents/private-id", "/admin/validations", "/admin/payments", "/admin/learning", "/admin/providers", "/admin/audit"];
  for (const locale of locales) {
    for (const pathname of [...publicPaths, ...dashboardPaths]) {
      const metadata = getLocalizedRouteMetadata(pathname, locale);
      expect(metadata.title, `${locale}:${pathname}`).toMatch(/ — TaskMatch\.ai$/);
      expect(metadata.description.length, `${locale}:${pathname}`).toBeGreaterThan(20);
      expect(JSON.stringify(metadata)).not.toContain("private-id");
      expect(metadata.title).not.toContain("404");
    }
  }
  expect(getLocalizedRouteMetadata("/login", "pt").title).toBe("Entrar — TaskMatch.ai");
  expect(getLocalizedRouteMetadata("/pricing/", "fr").title).toBe("Tarifs — TaskMatch.ai");
  expect(getLocalizedRouteMetadata("/admin/unknown", "zh").title).toContain("404");
});

test("Portuguese public pages remain readable on a narrow screen", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem("taskmatch_locale", "pt"));
  const routes = {
    "/how-it-works": "Do projeto a um resultado que pode revisar.",
    "/for-clients": "Descreva seu projeto. Revise o resultado.",
    "/for-developers": "Crie um agente. Coloque sua experiência para trabalhar.",
    "/pricing": "Uma missão.Um orçamento pré-pago.",
    "/company/about": "Agentes de IA e pessoas,trabalhando no seu projeto.",
    "/company/careers": "Crie fluxos de trabalho úteisentre pessoas e agentes.",
    "/company/contact": "Fale com a equipeTaskMatch.",
    "/company/press-kit": "TaskMatch,em poucas palavras.",
    "/legal/notice": "Aviso legal",
    "/legal/privacy": "Política de Privacidade",
    "/legal/terms": "Termos de Serviço",
    "/legal/security": "Como o TaskMatch protegeos seus dados e o seu trabalho.",
    "/legal/compliance": "Conformidade e proteção de dados",
  };
  for (const [path, heading] of Object.entries(routes)) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), path).toBe(true);
  }
});

for (const successful of [false, true]) {
  test(`Portuguese contact form shows the localized ${successful ? "success" : "error"} state`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("taskmatch_locale", "pt"));
    await page.route("**/api/v1/contact", route => route.fulfill({ status: successful ? 200 : 500, json: {} }));
    await page.route("https://formsubmit.co/**", route => route.fulfill({ status: 500, json: {} }));
    await page.goto("/company/contact");
    await page.getByRole("textbox", { name: "Nome completo", exact: true }).fill("Ana Teste");
    await page.getByRole("textbox", { name: "Endereço de e-mail", exact: true }).fill("ana@example.test");
    await page.getByRole("textbox", { name: "Assunto", exact: true }).fill("Teste");
    await page.getByRole("textbox", { name: "Como podemos ajudar?", exact: true }).fill("Mensagem de teste local.");
    await page.getByRole("button", { name: "Enviar mensagem", exact: true }).click();
    if (successful) {
      await expect(page.getByRole("heading", { name: "Mensagem enviada", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Enviar outra mensagem", exact: true })).toBeVisible();
    } else {
      await expect(page.locator('[role="alert"]:not(#__next-route-announcer__)')).toHaveText("Não foi possível enviar a sua mensagem agora. Também pode escrever diretamente para sega@tauraco.ai.");
    }
  });
}

test("localized browser metadata survives late head updates and route changes", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("taskmatch_locale", "pt"));
  await page.goto("/pricing");
  await expect(page).toHaveTitle("Preços — TaskMatch.ai");
  const expected = getLocalizedRouteMetadata("/pricing", "pt");
  await expect.poll(async () => page.locator('meta[name="description"]').evaluateAll(
    (elements, description) => elements.length > 0 && elements.every(element => element.getAttribute("content") === description),
    expected.description,
  )).toBe(true);
  await page.evaluate(() => {
    document.title = "Late server title";
    const original = document.head.querySelector('meta[name="description"]');
    if (original) {
      const replacement = original.cloneNode() as HTMLMetaElement;
      replacement.content = "Late server description";
      original.replaceWith(replacement);
    }
  });
  await expect(page).toHaveTitle("Preços — TaskMatch.ai");
  await expect.poll(async () => page.locator('meta[name="description"]').evaluateAll(
    (elements, description) => elements.length > 0 && elements.every(element => element.getAttribute("content") === description),
    expected.description,
  )).toBe(true);
  await page.goto("/resources/blog/why-we-decompose-jobs-into-tasks");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt");
  const articleTitle = await page.getByRole("heading", { level: 1 }).innerText();
  await expect(page).toHaveTitle(`${articleTitle} — TaskMatch.ai`);
  await page.getByRole("link", { name: "Sobre", exact: true }).click();
  await expect(page).toHaveTitle("Sobre o TaskMatch — TaskMatch.ai");
  await page.goto("/resources/blog/missing-test-article");
  await expect(page).toHaveTitle("Artigo não encontrado — TaskMatch.ai");
  await page.goto("/resources/guides/missing-test-guide");
  await expect(page).toHaveTitle("Guia não encontrado — TaskMatch.ai");
});
