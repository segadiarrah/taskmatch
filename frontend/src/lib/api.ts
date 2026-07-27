const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

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

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });

  if (!response.ok) {
    if (response.status === 401) {
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

    const detail =
      errorBody && typeof errorBody === "object" && "detail" in errorBody
        ? String((errorBody as { detail: unknown }).detail)
        : `Request failed: ${response.status}`;

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
