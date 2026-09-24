import { expect, test, type Page, type Route } from "@playwright/test";

type Locale = "en" | "fr" | "es" | "zh";
type Role = "client" | "agent_developer" | "admin";

const localeCopy = {
  en: {
    home: "Complex work,",
    docs: "Documentation,",
    login: "Welcome back",
    client: "My Jobs",
    developer: "My Agents",
    admin: "Real-time overview of your TaskMatch platform operations.",
    privacy: "Privacy Policy", language: "Select language", guide: "Client quickstart", archive: "This article is published in English.",
    loading: "Loading TaskMatch…",
    retry: "Try Again",
  },
  fr: {
    home: "Le travail complexe,",
    docs: "La documentation,",
    login: "Bon retour",
    client: "Mes missions",
    developer: "Mes agents",
    admin: "Vue en temps réel des opérations de votre plateforme TaskMatch.",
    privacy: "Politique de confidentialité", language: "Choisir la langue", guide: "Démarrage rapide client", archive: "Cet article est publié en anglais.",
    loading: "Chargement de TaskMatch…",
    retry: "Réessayer",
  },
  es: {
    home: "El trabajo complejo,",
    docs: "La documentación,",
    login: "Bienvenido de nuevo",
    client: "Mis encargos",
    developer: "Mis agentes",
    admin: "Resumen en tiempo real de las operaciones de tu plataforma TaskMatch.",
    privacy: "Política de privacidad", language: "Elegir idioma", guide: "Inicio rápido para clientes", archive: "Este artículo está publicado en inglés.",
    loading: "Cargando TaskMatch…",
    retry: "Reintentar",
  },
  zh: {
    home: "复杂的工作，",
    docs: "文档，",
    login: "欢迎回来",
    client: "我的任务",
    developer: "我的智能体",
    admin: "实时查看 TaskMatch 平台的运行情况。",
    privacy: "隐私政策", language: "选择语言", guide: "客户快速入门", archive: "本文以英文发布。",
    loading: "正在加载 TaskMatch…",
    retry: "重试",
  },
} satisfies Record<Locale, Record<string, string>>;

const rolesByPath: Record<string, Role> = {
  "/client": "client",
  "/developer": "agent_developer",
  "/admin": "admin",
};

const users: Record<Role, object> = {
  client: { id: "user-client", email: "client@example.test", full_name: "Casey Client", role: "client", is_active: true, created_at: "2026-01-01T00:00:00Z" },
  agent_developer: { id: "user-developer", email: "developer@example.test", full_name: "Dev Agent", role: "agent_developer", is_active: true, created_at: "2026-01-01T00:00:00Z" },
  admin: { id: "user-admin", email: "admin@example.test", full_name: "Ada Admin", role: "admin", is_active: true, created_at: "2026-01-01T00:00:00Z" },
};

const dashboardResponses: Record<string, object> = {
  "/api/v1/client/dashboard/stats": { my_jobs: 0, active_tasks: 0, pending_reviews: 0, total_spent: 0 },
  "/api/v1/jobs": { items: [], jobs: [] },
  "/api/v1/developer/dashboard/stats": { my_agents: 0, active_assignments: 0, completed_tasks: 0, total_earnings: 0 },
  "/api/v1/developer/assignments": { items: [] },
  "/api/v1/dashboard/overview": {
    total_jobs: 0,
    total_tasks: 0,
    active_agents: 0,
    pending_validations: 0,
    failed_tasks: 0,
    total_payments_pending: 0,
    total_payments_completed: 0,
    jobs_by_status: {},
    tasks_by_status: {},
    recent_activity: [],
  },
};

async function seedLocale(page: Page, locale: Locale, authenticated = false) {
  await page.addInitScript(
    ({ selectedLocale, withAuth }) => {
      localStorage.setItem("taskmatch_locale", selectedLocale);
      if (withAuth) localStorage.setItem("auth_token", "playwright-token");
    },
    { selectedLocale: locale, withAuth: authenticated },
  );
}

async function fulfillDashboard(route: Route, role: Role, options: { failData?: boolean; delayAuth?: boolean } = {}) {
  const url = new URL(route.request().url());
  if (url.pathname === "/api/v1/auth/me") {
    if (options.delayAuth) await new Promise((resolve) => setTimeout(resolve, 1_000));
    return route.fulfill({ json: users[role] });
  }
  const responseKey = Object.keys(dashboardResponses).find((path) => url.pathname === path);
  if (responseKey) {
    if (options.failData) return route.fulfill({ status: 500, json: { detail: "Dashboard unavailable" } });
    return route.fulfill({ json: dashboardResponses[responseKey] });
  }
  return route.fulfill({ json: { items: [] } });
}

for (const locale of Object.keys(localeCopy) as Locale[]) {
  test.describe(`${locale} locale`, () => {
    for (const [path, copyKey] of [
      ["/", "home"],
      ["/resources/documentation", "docs"],
      ["/login", "login"],
      ["/resources/guides/client-quickstart", "guide"],
      ["/legal/privacy", "privacy"],
    ] as const) {
      test(`${path} uses selected locale`, async ({ page }) => {
        await seedLocale(page, locale);
        await page.goto(path);
        await expect(page.getByText(localeCopy[locale][copyKey], { exact: false }).first()).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
      });
    }

    for (const [path, copyKey] of [
      ["/client", "client"],
      ["/developer", "developer"],
      ["/admin", "admin"],
    ] as const) {
      test(`${path} respects its supported content language`, async ({ page }) => {
        const role = rolesByPath[path];
        await seedLocale(page, locale, true);
        await page.route("**/api/**", (route) => fulfillDashboard(route, role));
        await page.goto(path);
        await expect(page.getByText((path === "/admin" ? localeCopy.en.admin : localeCopy[locale][copyKey]), { exact: false }).first()).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("main")).toHaveAttribute("lang", path === "/admin" ? "en" : locale);
      });
    }

    test("identifies English articles while preserving translated navigation", async ({ page }) => {
      await seedLocale(page, locale);
      await page.goto("/resources/blog/why-we-decompose-jobs-into-tasks");
      await expect(page.getByText(localeCopy[locale].archive, { exact: true })).toBeVisible();
      await expect(page.locator('[lang="en"] h1')).toBeVisible();
      await expect(page.getByRole("combobox", { name: localeCopy[locale].language })).toHaveValue(locale);
    });

    test("localizes the authenticated loading state", async ({ page }) => {
      await seedLocale(page, locale, true);
      await page.route("**/api/**", (route) => fulfillDashboard(route, "client", { delayAuth: true }));
      await page.goto("/client");
      await expect(page.getByText(localeCopy[locale].loading)).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
    });

    test("localizes dashboard error recovery", async ({ page }) => {
      await seedLocale(page, locale, true);
      await page.route("**/api/**", (route) => fulfillDashboard(route, "client", { failData: true }));
      await page.goto("/client");
      await expect(page.getByRole("button", { name: localeCopy[locale].retry })).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
    });
  });
}


test("changing language persists after reload and updates document language", async ({ page }) => {
  await page.goto("/");
  const selector = page.getByRole("combobox", { name: /Select language|Choisir la langue|Elegir idioma|选择语言/ });
  await selector.selectOption("fr");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Choisir la langue" })).toHaveValue("fr");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
});
