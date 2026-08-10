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
    cookies: "We use cookies to enhance your experience",
    loading: "Loading TaskMatch...",
    retry: "Try Again",
  },
  fr: {
    home: "Le travail complexe,",
    docs: "La documentation,",
    login: "Bon retour",
    client: "Mes missions",
    developer: "Mes agents",
    admin: "Vue en temps réel des opérations de votre plateforme TaskMatch.",
    cookies: "Nous utilisons des cookies pour améliorer votre expérience",
    loading: "Chargement de TaskMatch…",
    retry: "Réessayer",
  },
  es: {
    home: "El trabajo complejo,",
    docs: "La documentación,",
    login: "Bienvenido de nuevo",
    client: "Mis trabajos",
    developer: "Mis agentes",
    admin: "Resumen en tiempo real de las operaciones de tu plataforma TaskMatch.",
    cookies: "Usamos cookies para mejorar tu experiencia",
    loading: "Cargando TaskMatch…",
    retry: "Intentar de nuevo",
  },
  zh: {
    home: "复杂的工作，",
    docs: "文档，",
    login: "欢迎回来",
    client: "我的工作",
    developer: "我的智能体",
    admin: "实时查看 TaskMatch 平台的运行情况。",
    cookies: "我们使用 Cookie 来改善你的体验",
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
      localStorage.setItem("tm_cookie_consent", JSON.stringify({ necessary: true, analytics: false, marketing: false, timestamp: "2026-01-01T00:00:00Z" }));
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
      test(`${path} localizes authenticated content`, async ({ page }) => {
        const role = rolesByPath[path];
        await seedLocale(page, locale, true);
        await page.route("**/api/**", (route) => fulfillDashboard(route, role));
        await page.goto(path);
        await expect(page.getByText(localeCopy[locale][copyKey], { exact: false }).first()).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
      });
    }

    test("localizes GDPR consent after consent is cleared", async ({ page }) => {
      await seedLocale(page, locale);
      await page.addInitScript(() => localStorage.removeItem("tm_cookie_consent"));
      await page.goto("/");
      await expect(page.getByText(localeCopy[locale].cookies, { exact: false })).toBeVisible({ timeout: 4_000 });
    });

    test("localizes the authenticated loading state", async ({ page }) => {
      await seedLocale(page, locale, true);
      await page.route("**/api/**", (route) => fulfillDashboard(route, "client", { delayAuth: true }));
      await page.goto("/client");
      await expect(page.getByText(localeCopy[locale].loading)).toBeVisible();
    });

    test("localizes dashboard error recovery", async ({ page }) => {
      await seedLocale(page, locale, true);
      await page.route("**/api/**", (route) => fulfillDashboard(route, "client", { failData: true }));
      await page.goto("/client");
      await expect(page.getByRole("button", { name: localeCopy[locale].retry })).toBeVisible();
    });
  });
}
