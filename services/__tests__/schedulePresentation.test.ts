import { describe, expect, it } from "@jest/globals";

import type { ScheduleResponse } from "@/services/backendApi";
import { buildHomeScheduleModel } from "@/services/schedulePresentation";

const schedule = {
  status: "ok",
  generated_at: "2026-05-23T10:00:00Z",
  start_date: "2026-05-25",
  end_date: "2026-05-31",
  last_import: null,
  days: [
    {
      date: "2026-05-25",
      weekday: "Mon",
      kind: "off_day",
      duty: {
        type: "Off",
        start: "0330",
        end: "0259",
        end_next_day: true,
        overnight_station: null,
      },
      flights: [],
      hotel: null,
      taxis: [],
      warnings: [],
    },
    {
      date: "2026-05-26",
      weekday: "Tue",
      kind: "flight_duty",
      duty: {
        type: "Fld",
        start: "1100",
        end: "1845",
        end_next_day: false,
        overnight_station: "AMS",
      },
      flights: [
        {
          flight_leg_id: 42,
          sequence: 1,
          flight_number: "KL1234",
          dep_airport: "AMS",
          arr_airport: "CDG",
          scheduled_departure_time: "1230",
          scheduled_arrival_time: "1345",
          aircraft_code: "E90",
        },
        {
          flight_leg_id: 43,
          sequence: 2,
          flight_number: "KL2345",
          dep_airport: "CDG",
          arr_airport: "AMS",
          scheduled_departure_time: "1605",
          scheduled_arrival_time: "1720",
          aircraft_code: "E90",
        },
      ],
      hotel: null,
      taxis: [],
      warnings: ["synthetic_warning"],
    },
    {
      date: "2026-05-27",
      weekday: "Wed",
      kind: "missing_roster",
      duty: null,
      flights: [],
      hotel: null,
      taxis: [],
      warnings: [],
    },
  ],
} satisfies ScheduleResponse;

describe("buildHomeScheduleModel", () => {
  it("keeps backend schedule days in order and compresses off days", () => {
    const model = buildHomeScheduleModel(schedule);

    expect(model.state).toBe("ready");
    expect(model.dayCards.map((day) => day.date)).toEqual([
      "2026-05-25",
      "2026-05-26",
      "2026-05-27",
    ]);
    expect(model.dayCards[0]).toMatchObject({
      kindLabel: "Off day",
      isCompressedOffDay: true,
      dutyWindowLabel: "03:30-02:59",
    });
  });

  it("maps flight-duty legs and warnings into a render model without reordering flights", () => {
    const model = buildHomeScheduleModel(schedule);
    const flightDay = model.dayCards[1];

    expect(flightDay).toMatchObject({
      kindLabel: "Flight duty",
      isFlightDuty: true,
      overnightLabel: "Overnight AMS",
      warningLabel: "1 warning",
    });
    expect(flightDay.flightLines).toEqual([
      "KL1234 AMS 12:30 -> CDG 13:45",
      "KL2345 CDG 16:05 -> AMS 17:20",
    ]);
  });

  it("uses an import-needed model for empty schedules", () => {
    const model = buildHomeScheduleModel({
      ...schedule,
      status: "empty",
      days: [],
    });

    expect(model).toEqual({ state: "import_needed", dayCards: [] });
  });
});
