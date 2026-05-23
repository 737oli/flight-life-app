import { describe, expect, it } from "@jest/globals";

import type { RosterImportHistoryResponse } from "@/services/backendApi";
import { buildRosterImportHistoryModel } from "@/services/importHistoryPresentation";

const importHistory = {
  status: "ok",
  has_preserved_days_outside_current_period: true,
  current_import: {
    id: 7,
    source_filename: "synthetic-roster.pdf",
    created_at: "2026-05-22T16:42:00Z",
    period_start: "2026-05-25",
    period_end: "2026-06-21",
    duty_days_parsed: 28,
    flight_legs_parsed: 42,
    inserted_dates: 8,
    updated_dates: 10,
    unchanged_dates: 10,
    parser_warning_count: 7,
    warning_preview: [
      "synthetic_warning_one",
      "synthetic_warning_two",
      "synthetic_warning_three",
      "synthetic_warning_four",
      "synthetic_warning_five",
    ],
    remaining_warning_count: 2,
    flight_duty_days_without_legs: 1,
    decisions_marked_needs_review: 3,
    source_pdf: {
      state: "deleted",
      label: "Source PDF deleted",
      can_delete: false,
      deleted_at: "2026-05-23T09:00:00Z",
    },
  },
  imports: [],
} satisfies RosterImportHistoryResponse;

describe("buildRosterImportHistoryModel", () => {
  it("maps the current roster import summary into Settings card text", () => {
    const model = buildRosterImportHistoryModel(importHistory, "utc");

    expect(model.hasPreservedDaysOutsideCurrentPeriod).toBe(true);
    expect(model.currentImport).toMatchObject({
      title: "synthetic-roster.pdf",
      periodLabel: "2026-05-25 to 2026-06-21",
      changeSummary: "Inserted 8 / Updated 10 / Unchanged 10",
      sourcePdfLabel: "Source PDF deleted",
      sourcePdfState: "deleted",
      canDeleteSourcePdf: false,
      remainingWarningLabel: "+2 more",
    });
    expect(model.currentImport?.timestampLabel).toContain("UTC");
    expect(model.currentImport?.metrics).toEqual({
      days: 28,
      flights: 42,
      warnings: 7,
      flightDutyDaysWithoutLegs: 1,
    });
  });

  it("formats warning previews without exposing a full warning browser", () => {
    const model = buildRosterImportHistoryModel(importHistory, "utc");

    expect(model.currentImport?.warningPreview).toEqual([
      "synthetic warning one",
      "synthetic warning two",
      "synthetic warning three",
      "synthetic warning four",
      "synthetic warning five",
    ]);
    expect(model.currentImport?.remainingWarningLabel).toBe("+2 more");
  });
});
