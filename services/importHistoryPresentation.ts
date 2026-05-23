import type {
  RosterImportHistoryItem,
  RosterImportHistoryResponse,
} from "@/services/backendApi";

export type TimestampMode = "local" | "utc";

export type RosterImportCardModel = {
  title: string;
  timestampLabel: string;
  periodLabel: string;
  metrics: {
    days: number;
    flights: number;
    warnings: number;
    flightDutyDaysWithoutLegs: number;
  };
  changeSummary: string;
  sourcePdfLabel: string;
  sourcePdfState: string;
  canDeleteSourcePdf: boolean;
  warningPreview: string[];
  remainingWarningLabel: string | null;
};

export type RosterImportHistoryModel = {
  currentImport: RosterImportCardModel | null;
  imports: RosterImportCardModel[];
  hasPreservedDaysOutsideCurrentPeriod: boolean;
};

export const buildRosterImportHistoryModel = (
  response: RosterImportHistoryResponse | null,
  timestampMode: TimestampMode
): RosterImportHistoryModel => ({
  currentImport: response?.current_import
    ? buildRosterImportCardModel(response.current_import, timestampMode)
    : null,
  imports: response?.imports.map((item) => buildRosterImportCardModel(item, timestampMode)) ?? [],
  hasPreservedDaysOutsideCurrentPeriod:
    response?.has_preserved_days_outside_current_period ?? false,
});

export const buildRosterImportCardModel = (
  importItem: RosterImportHistoryItem,
  timestampMode: TimestampMode
): RosterImportCardModel => ({
  title: importItem.source_filename,
  timestampLabel: formatImportTimestamp(importItem.created_at, timestampMode),
  periodLabel: formatRosterPeriod(importItem),
  metrics: {
    days: importItem.duty_days_parsed,
    flights: importItem.flight_legs_parsed,
    warnings: importItem.parser_warning_count,
    flightDutyDaysWithoutLegs: importItem.flight_duty_days_without_legs,
  },
  changeSummary: `Inserted ${importItem.inserted_dates} / Updated ${importItem.updated_dates} / Unchanged ${importItem.unchanged_dates}`,
  sourcePdfLabel: importItem.source_pdf.label,
  sourcePdfState: importItem.source_pdf.state,
  canDeleteSourcePdf: importItem.source_pdf.can_delete,
  warningPreview: importItem.warning_preview.map(formatWarning),
  remainingWarningLabel:
    importItem.remaining_warning_count > 0 ? `+${importItem.remaining_warning_count} more` : null,
});

export function formatImportTimestamp(value: string | null, mode: TimestampMode) {
  const label = mode === "utc" ? "UTC" : "Local";
  if (!value) {
    return `Unknown ${label}`;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return `Unknown ${label}`;
  }

  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "short",
    year: "numeric",
  };

  if (mode === "utc") {
    options.timeZone = "UTC";
  }

  return `${parsedDate.toLocaleString([], options)} ${label}`;
}

export function formatRosterPeriod(importItem: RosterImportHistoryItem) {
  if (!importItem.period_start || !importItem.period_end) {
    return "Roster period unknown";
  }

  return `${importItem.period_start} to ${importItem.period_end}`;
}

export function formatWarning(warning: string) {
  return warning.replace(/_/g, " ");
}
