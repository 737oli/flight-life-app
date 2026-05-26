import { describe, expect, it, jest, beforeEach } from "@jest/globals";

import {
  BackendApiError,
  deleteRosterImportSourcePdf,
  fetchBackendHealth,
  fetchStayVsHomeDecision,
  fetchSystemReadiness,
  normalizeBackendBaseUrl,
  overrideStayVsHomeDecision,
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

  it("deletes roster import source PDFs through the backend endpoint", async () => {
    const payload = {
      status: "ok",
      import: {
        id: 7,
        source_filename: "synthetic-roster.pdf",
        source_pdf: {
          state: "deleted",
          label: "Source PDF deleted",
          can_delete: false,
          deleted_at: "2026-05-24T10:15:00Z",
        },
      },
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(payload));

    const result = await deleteRosterImportSourcePdf(7, "http://api.test///");

    expect(mockFetch).toHaveBeenCalledWith("http://api.test/rosters/imports/7/source-pdf", {
      method: "DELETE",
    });
    expect(result).toBe(payload);
  });

  it("throws a typed error when source PDF deletion fails", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ detail: "roster_import_not_found" }, { ok: false, status: 404 }));

    await expect(deleteRosterImportSourcePdf(999, "http://api.test")).rejects.toMatchObject({
      name: "BackendApiError",
      status: 404,
      errors: ["roster_import_not_found"],
    } satisfies Partial<BackendApiError>);
  });

  it("can request traffic-aware stay-vs-home decisions", async () => {
    const payload = {
      status: "ok",
      decision: {
        decision_key: "2026-05-21:stay-vs-home",
        decision_date: "2026-05-21",
        decision_type: "stay_vs_home",
        state: "recommended",
        recommendation: "go_home",
        system_recommendation: "go_home",
        manual_override: null,
        missing_inputs: [],
        reasoning: {
          home_commute_source: "tomtom",
        },
      },
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(payload));

    const result = await fetchStayVsHomeDecision("2026-05-21", {
      baseUrl: "http://api.test///",
      includeTraffic: true,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://api.test/decisions/stay-vs-home/2026-05-21?include_traffic=true"
    );
    expect(result).toBe(payload.decision);
  });

  it("can request traffic-aware decision override responses", async () => {
    const payload = {
      status: "ok",
      decision: {
        decision_key: "2026-05-21:stay-vs-home",
        decision_date: "2026-05-21",
        decision_type: "stay_vs_home",
        state: "overridden",
        recommendation: "stay_outstation",
        system_recommendation: "go_home",
        manual_override: {
          choice: "stay_outstation",
          status: "confirmed",
        },
        missing_inputs: [],
        reasoning: {
          home_commute_source: "tomtom",
        },
      },
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(payload));

    const result = await overrideStayVsHomeDecision(
      "2026-05-21",
      "stay_outstation",
      {
        baseUrl: "http://api.test///",
        includeTraffic: true,
      }
    );

    expect(mockFetch).toHaveBeenCalledWith(
      "http://api.test/decisions/stay-vs-home/2026-05-21/override?include_traffic=true",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ choice: "stay_outstation" }),
      }
    );
    expect(result).toBe(payload.decision);
  });
});
