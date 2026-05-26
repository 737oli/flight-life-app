import { describe, expect, it } from "@jest/globals";

import type { StayVsHomeDecision } from "@/services/backendApi";
import { decisionReasoningItems } from "@/services/decisionPresentation";

const baseDecision = {
  decision_key: "2026-05-21:stay-vs-home",
  decision_date: "2026-05-21",
  decision_type: "stay_vs_home",
  state: "recommended",
  recommendation: "go_home",
  system_recommendation: "go_home",
  manual_override: null,
  missing_inputs: [],
  reasoning: {
    arrival_station: "AMS",
  },
} satisfies StayVsHomeDecision;

describe("decisionReasoningItems", () => {
  it("shows route-specific TomTom commute when traffic context is available", () => {
    const items = decisionReasoningItems({
      ...baseDecision,
      reasoning: {
        ...baseDecision.reasoning,
        home_commute_source: "tomtom",
        home_commute_minutes_each_way: 60,
        home_commute_minutes_to_home: 42,
        home_commute_minutes_to_airport: 51,
      },
    });

    expect(items).toContain("TomTom commute: 42 min home, 51 min to AMS");
    expect(items).not.toContain("Commute assumption: 60 min each way");
  });

  it("formats long TomTom commutes as compact hours and minutes", () => {
    const items = decisionReasoningItems({
      ...baseDecision,
      reasoning: {
        ...baseDecision.reasoning,
        home_commute_source: "tomtom",
        home_commute_minutes_each_way: 60,
        home_commute_minutes_to_home: 145,
        home_commute_minutes_to_airport: 123,
      },
    });

    expect(items).toContain("TomTom commute: 2h25 home, 2h03 to AMS");
  });

  it("keeps the configured commute assumption as fallback when traffic is unavailable", () => {
    const items = decisionReasoningItems({
      ...baseDecision,
      reasoning: {
        ...baseDecision.reasoning,
        home_commute_source: "preference",
        home_commute_minutes_each_way: 60,
        traffic_warnings: ["traffic_provider_unavailable"],
      },
    });

    expect(items).toContain("Traffic unavailable; using commute assumption: 60 min each way");
  });
});
