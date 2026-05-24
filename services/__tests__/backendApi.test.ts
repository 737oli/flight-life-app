import { describe, expect, it, jest, beforeEach } from "@jest/globals";

import {
  BackendApiError,
  fetchBackendHealth,
  fetchSystemReadiness,
  normalizeBackendBaseUrl,
} from "@/services/backendApi";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

const jsonResponse = (body: unknown, options: { ok?: boolean; status?: number } = {}) => ({
  ok: options.ok ?? true,
  status: options.status ?? 200,
  json: jest.fn(async () => body),
}) as unknown as Response;

describe("backendApi", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("normalizes configured backend base URLs", () => {
    expect(normalizeBackendBaseUrl(" http://127.0.0.1:8010/// ")).toBe("http://127.0.0.1:8010");
  });

  it("fetches system readiness from the normalized backend URL", async () => {
    const readiness = {
      status: "ok",
      readiness: "ready",
      generated_at: "2026-05-24T10:15:00Z",
      providers: [],
      warnings: [],
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(readiness));

    const result = await fetchSystemReadiness("http://api.test///");

    expect(mockFetch).toHaveBeenCalledWith("http://api.test/system/readiness");
    expect(result).toBe(readiness);
  });

  it("throws a typed error when system readiness returns an HTTP error", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ detail: "unavailable" }, { ok: false, status: 503 }));

    await expect(fetchSystemReadiness("http://api.test")).rejects.toMatchObject({
      name: "BackendApiError",
      status: 503,
      errors: ["HTTP 503"],
    } satisfies Partial<BackendApiError>);
  });

  it("returns an offline health result when the backend cannot be reached", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network down"));

    const result = await fetchBackendHealth("http://api.test", 25);

    expect(result).toMatchObject({
      ok: false,
      baseUrl: "http://api.test",
      message: "Backend unavailable",
    });
  });
});
