import { describe, expect, it } from "@jest/globals";

import type { SystemReadinessResponse } from "@/services/backendApi";
import { buildSystemReadinessModel } from "@/services/readinessPresentation";

describe("buildSystemReadinessModel", () => {
  it("maps provider readiness without exposing raw secret values", () => {
    const model = buildSystemReadinessModel({
      status: "ok",
      readiness: "attention",
      generated_at: "2026-05-24T10:15:00Z",
      warnings: ["tomtom_traffic:not_configured"],
      providers: [
        {
          id: "afklm_flightstatus",
          label: "AF/KLM FlightStatus",
          category: "live_operations",
          status: "ready",
          missing: [],
          notes: ["Used only for eligible flights."],
        },
        {
          id: "tomtom_traffic",
          label: "TomTom traffic",
          category: "decision_context",
          status: "not_configured",
          missing: ["TOMTOM_API_KEY", "home_coordinates"],
          notes: ["Used only for decision routes."],
        },
      ],
    } satisfies SystemReadinessResponse);

    expect(model?.needsAttention).toBe(true);
    expect(model?.providers).toEqual([
      {
        id: "afklm_flightstatus",
        label: "AF/KLM FlightStatus",
        statusLabel: "Ready",
        tone: "success",
        detailLabel: "Used only for eligible flights.",
      },
      {
        id: "tomtom_traffic",
        label: "TomTom traffic",
        statusLabel: "Not configured",
        tone: "warning",
        detailLabel: "Missing: TOMTOM_API_KEY, home coordinates",
      },
    ]);
  });

  it("shows configured model names for the OpenAI advisor", () => {
    const model = buildSystemReadinessModel({
      status: "ok",
      readiness: "ready",
      generated_at: "2026-05-24T10:15:00Z",
      warnings: [],
      providers: [
        {
          id: "openai_advisor",
          label: "OpenAI advisor",
          category: "decision_context",
          status: "ready",
          missing: [],
          model: "gpt-test-model",
          notes: ["On-demand advisor only."],
        },
      ],
    } satisfies SystemReadinessResponse);

    expect(model?.titleLabel).toBe("Operational readiness ready");
    expect(model?.providers[0].detailLabel).toBe("Model: gpt-test-model · On-demand advisor only.");
  });
});
