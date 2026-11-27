import { localizeApiError, networkError } from "@/lib/api-error-copy";
import { currentLocale } from "@/lib/locales";

// Call sites supply the version segment themselves (`/v1/jobs/...`), so this
// base stops at "/api". Both the Next rewrite and nginx pass /api/* straight
// through to the backend, which mounts its routes under settings.API_V1_PREFIX.
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "/api").replace(/\/$/, "");

export function apiErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object" || !("detail" in body)) return fallback;
  const detail = (body as { detail: unknown }).detail;
  if (typeof detail === "string") return localizeApiError(detail, currentLocale());
  if (Array.isArray(detail)) {
    return detail.map((issue) => {
      const field = Array.isArray(issue.loc) ? issue.loc.filter((part: unknown) => part !== "body").join(".") : "";
      return `${field ? `${field}: ` : ""}${localizeApiError(issue.msg || fallback, currentLocale())}`;
    }).join("; ");
  }
  return fallback;
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

function clearAuthToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth_token");
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestInit
): Promise<T> {
  const token = getAuthToken();

  const headers = new Headers(options?.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options, method, headers,
      body: body === undefined ? options?.body : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(networkError(currentLocale()), 0);
  }

  if (!response.ok) {
    if (response.status === 401 && getAuthToken() === token) {
      clearAuthToken();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = undefined;
    }

    const detail = apiErrorMessage(errorBody, localizeApiError(`Request failed: ${response.status}`, currentLocale()));

    throw new ApiError(detail, response.status, errorBody);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export function apiGet<T>(path: string, options?: RequestInit): Promise<T> {
  return request<T>("GET", path, undefined, options);
}

export function apiPost<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
  return request<T>("POST", path, body, options);
}

export function apiPut<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
  return request<T>("PUT", path, body, options);
}

export function apiDelete<T>(path: string, options?: RequestInit): Promise<T> {
  return request<T>("DELETE", path, undefined, options);
}
