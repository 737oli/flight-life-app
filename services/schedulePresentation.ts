import type { ScheduleDay, ScheduleResponse } from "@/services/backendApi";

export type ScheduleDayCardModel = {
  date: string;
  weekday: string;
  kindLabel: string;
  isCompressedOffDay: boolean;
  isFlightDuty: boolean;
  isMissingRoster: boolean;
  dutyWindowLabel: string | null;
  flightLines: string[];
  overnightLabel: string | null;
  warningLabel: string | null;
};

export type HomeScheduleModel = {
  state: "ready" | "import_needed";
  dayCards: ScheduleDayCardModel[];
};

export const buildHomeScheduleModel = (schedule: ScheduleResponse | null): HomeScheduleModel => {
  if (!schedule || schedule.status === "empty" || schedule.days.length === 0) {
    return { state: "import_needed", dayCards: [] };
  }

  return {
    state: "ready",
    dayCards: schedule.days.map(buildScheduleDayCardModel),
  };
};

export const buildScheduleDayCardModel = (day: ScheduleDay): ScheduleDayCardModel => ({
  date: day.date,
  weekday: day.weekday,
  kindLabel: labelForScheduleKind(day.kind),
  isCompressedOffDay: day.kind === "off_day",
  isFlightDuty: day.kind === "flight_duty",
  isMissingRoster: day.kind === "missing_roster",
  dutyWindowLabel:
    day.duty?.start && day.duty?.end
      ? `${formatRosterTime(day.duty.start)}-${formatRosterTime(day.duty.end)}`
      : null,
  flightLines: day.flights.map(
    (flight) =>
      `${flight.flight_number} ${flight.dep_airport} ${formatRosterTime(
        flight.scheduled_departure_time
      )} -> ${flight.arr_airport} ${formatRosterTime(flight.scheduled_arrival_time)}`
  ),
  overnightLabel: day.duty?.overnight_station ? `Overnight ${day.duty.overnight_station}` : null,
  warningLabel:
    day.warnings.length > 0
      ? `${day.warnings.length} warning${day.warnings.length === 1 ? "" : "s"}`
      : null,
});

export const labelForScheduleKind = (kind: string) => {
  switch (kind) {
    case "flight_duty":
      return "Flight duty";
    case "off_day":
      return "Off day";
    case "other_duty":
      return "Other duty";
    case "missing_roster":
      return "Missing roster";
    default:
      return kind.replace(/_/g, " ");
  }
};

export const formatRosterTime = (time: string | null | undefined) => {
  if (!time) {
    return "";
  }
  const padded = time.padStart(4, "0");
  return `${padded.slice(0, 2)}:${padded.slice(2)}`;
};
