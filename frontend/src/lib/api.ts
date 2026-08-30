// Minimal typed API client. Reads the JWT from localStorage, points at the
// backend, and normalises the server's error envelope into thrown ApiError.

export const API_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:3001';

const TOKEN_KEY = 'ff.token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: any,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message || `Request failed (${res.status})`;
    throw new ApiError(res.status, message, data);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// ---- Domain types ----
export type Role = 'ADMIN' | 'VIEWER';
export type Strategy = 'BOOLEAN' | 'PERCENTAGE_ROLLOUT';

export interface Flag {
  id: string;
  key: string;
  description?: string | null;
  enabled: boolean;
  strategy: Strategy;
  rolloutPercentage: number;
  constraints?: { includeCities?: string[]; excludeInternal?: boolean } | null;
  version: number;
  environmentKey: string;
  updatedBy?: string | null;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Environment {
  id: string;
  key: string;
  name: string;
}

export interface AuditRecord {
  id: string;
  actor: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  flagKey: string;
  environmentKey: string;
  previousValue: any;
  newValue: any;
  createdAt: string;
}

export interface RuleProposal {
  provider: string;
  proposal: {
    enabled: boolean;
    strategy: Strategy;
    rolloutPercentage: number;
    constraints?: { includeCities?: string[]; excludeInternal?: boolean };
  };
  raw: unknown;
  warnings: string[];
  note: string;
}

export interface EvalResult {
  flagKey: string;
  environmentKey: string;
  enabled: boolean;
  reason: string;
  bucket?: number;
  evaluatedAt: string;
}
