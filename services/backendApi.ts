const DEFAULT_BACKEND_BASE_URL = "http://127.0.0.1:8000";
const DEFAULT_TIMEOUT_MS = 5000;

export type BackendHealthStatus = "idle" | "checking" | "online" | "offline";

export type BackendHealthResult = {
  ok: boolean;
  baseUrl: string;
  checkedAt: string;
  message?: string;
  status?: number;
};

export const normalizeBackendBaseUrl = (baseUrl: string): string =>
  baseUrl.trim().replace(/\/+$/, "");

export const getBackendBaseUrl = (): string =>
  normalizeBackendBaseUrl(
    process.env.EXPO_PUBLIC_FLIGHT_LIFE_API_URL ?? DEFAULT_BACKEND_BASE_URL
  );

export const fetchBackendHealth = async (
  baseUrl = getBackendBaseUrl(),
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<BackendHealthResult> => {
  const normalizedBaseUrl = normalizeBackendBaseUrl(baseUrl);
  const checkedAt = new Date().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${normalizedBaseUrl}/health`, {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        baseUrl: normalizedBaseUrl,
        checkedAt,
        status: response.status,
        message: `HTTP ${response.status}`,
      };
    }

    const data = (await response.json()) as { message?: string; status?: string };
    return {
      ok: true,
      baseUrl: normalizedBaseUrl,
      checkedAt,
      status: response.status,
      message: data.message ?? (data.status === "ok" ? "Connected" : "Backend responded"),
    };
  } catch {
    return {
      ok: false,
      baseUrl: normalizedBaseUrl,
      checkedAt,
      message: "Backend unavailable",
    };
  } finally {
    clearTimeout(timeout);
  }
};
