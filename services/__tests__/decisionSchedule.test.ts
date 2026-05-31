import { describe, expect, it } from "@jest/globals";

import type { ScheduleDay, ScheduleResponse } from "@/services/backendApi";
import {
  currentRosterDecisionRange,
  upcomingHomeBaseDecisionCandidateDays,
} from "@/services/decisionSchedule";

const flightDay = (
  date: string,
  arrivalAirport: string,
  overrides: Partial<ScheduleDay> = {}
): ScheduleDay => ({
  date,
  weekday: "Mon",
  kind: "flight_duty",
  duty: {
    type: "Fld",
    start: "1000",
    end: "1800",
    end_next_day: false,
    overnight_station: arrivalAirport,
  },
  flights: [
    {
      sequence: 1,
      flight_number: "KL1001",
      dep_airport: "AMS",
      arr_airport: arrivalAirport,
      scheduled_departure_time: "1100",
      scheduled_arrival_time: "1200",
      aircraft_code: "E90",
    },
  ],
  hotel: null,
  taxis: [],
  warnings: [],
  ...overrides,
});

const seedSchedule = (periodStart: string | null, periodEnd: string | null): ScheduleResponse => ({
  status: "ok",
  generated_at: "2026-05-31T10:00:00Z",
  start_date: "2026-05-31",
  end_date: "2026-06-06",
  last_import: periodStart && periodEnd
    ? {
        id: 1,
        source_filename: "synthetic-roster.pdf",
        period_start: periodStart,
        period_end: periodEnd,
        created_at: "2026-05-31T09:00:00Z",
        summary: {
          roster_period: { start: periodStart, end: periodEnd },
          duty_days_parsed: 28,
          flight_legs_parsed: 12,
          rests_parsed: 0,
          taxis_parsed: 0,
          hotel_stays_parsed: 0,
          inserted_dates: 28,
          updated_dates: 0,
          unchanged_dates: 0,
          warnings: [],
          decisions_marked_needs_review: 0,
        },
      }
    : null,
  days: [],
});

describe("currentRosterDecisionRange", () => {
  it("starts at today when the imported roster period already started", () => {
    expect(currentRosterDecisionRange(seedSchedule("2026-05-25", "2026-06-21"), "2026-05-31"))
      .toEqual({ startDate: "2026-05-31", endDate: "2026-06-21" });
  });

  it("starts at the roster period when the imported roster is in the future", () => {
    expect(currentRosterDecisionRange(seedSchedule("2026-06-08", "2026-07-05"), "2026-05-31"))
      .toEqual({ startDate: "2026-06-08", endDate: "2026-07-05" });
  });

  it("returns null when there is no current or future imported roster period", () => {
    expect(currentRosterDecisionRange(seedSchedule("2026-04-27", "2026-05-24"), "2026-05-31"))
      .toBeNull();
    expect(currentRosterDecisionRange({ ...seedSchedule(null, null), status: "empty" }, "2026-05-31"))
      .toBeNull();
  });
});

describe("upcomingHomeBaseDecisionCandidateDays", () => {
  it("keeps upcoming AMS-ending flight duties across the full roster period", () => {
    const days: ScheduleDay[] = [
      flightDay("2026-05-30", "AMS"),
      flightDay("2026-06-01", "DBV"),
      flightDay("2026-06-08", "AMS"),
      flightDay("2026-06-15", "AMS", {
        flights: [
          {
            sequence: 1,
            flight_number: "KL2001",
            dep_airport: "AMS",
            arr_airport: "CDG",
            scheduled_departure_time: "0900",
            scheduled_arrival_time: "1015",
            aircraft_code: "E90",
          },
          {
            sequence: 2,
            flight_number: "KL2002",
            dep_airport: "CDG",
            arr_airport: "AMS",
            scheduled_departure_time: "1700",
            scheduled_arrival_time: "1820",
            aircraft_code: "E90",
          },
        ],
      }),
      {
        ...flightDay("2026-06-16", "AMS"),
        kind: "off_day",
        flights: [],
      },
    ];

    expect(upcomingHomeBaseDecisionCandidateDays(days, { todayIso: "2026-05-31" }).map((day) => day.date))
      .toEqual(["2026-06-08", "2026-06-15"]);
  });
});
