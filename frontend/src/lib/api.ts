import { authClient } from "./auth-client";

const API_PREFIX = "/api/v1";

async function getCompanyId(): Promise<string | null> {
  const { data } = await authClient.getSession();
  return data?.session.activeOrganizationId ?? null;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const companyId = await getCompanyId();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (companyId) headers["X-Company-Id"] = companyId;

  const res = await fetch(`${API_PREFIX}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string>) },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }

  return res.json();
}
