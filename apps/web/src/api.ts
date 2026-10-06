export type ApiFailure = Error & { status?: number };
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path.startsWith("/api/") ? path : `/api${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (response.status === 204) return undefined as T;
  const result = await response.json() as T | { error?: { message?: string } };
  if (!response.ok) {
    const error = new Error((result as { error?: { message?: string } }).error?.message ?? "Request failed.") as ApiFailure;
    error.status = response.status;
    throw error;
  }
  return result as T;
}

export type SessionUser = { id: string; email: string; displayName: string; timeZone: string; appearance?: string };
