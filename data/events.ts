import {
  FlightDuty,
  FlightEvent,
  GroundPeriod,
  OffDay,
  RestPeriod,
  TaxiEvent,
} from "@/types";

const at = (dayOffset: number, hh: number, mm: number) => {
  const base = new Date(); // today (your local TZ)
  const d = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    0,
    0,
    0,
    0
  );
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hh, mm, 0, 0);
  return d;
};

//mock data for testing
export const MOCK_FLIGHT_EVENTS: FlightEvent[] = [
  // Rotation 1
  {
    id: "kl1895",
    type: "flight",
    title: "KL1895 AMS → GOT",
    startDate: at(0, 6, 20),
    endDate: at(0, 7, 55),
    calendar: "Work",
    type: "flight",
    source: "demo",
    calendarId: "demo-work",
    details: {
      flightNumber: "1895",
      route: "AMS-GOT",
      departure: "AMS",
      arrival: "GOT",
      aircraft: "E90",
      registration: "PH-EZX",
      ctot: "06:12Z",
      prevLegArr: { status: "arrived", actualArrLocal: "05:40" },
    },
  },
  {
    id: "kl1896",
    type: "flight",
    title: "KL1896 GOT → AMS",
    startDate: at(0, 8, 40),
    endDate: at(0, 10, 15),
    details: {
      flightNumber: "KL 1896",
      route: "GOT-AMS",
      departure: "GOT",
      arrival: "AMS",
      aircraft: "E90",
      registration: "PH-EZX",
      prevLegArr: { status: "arrived", actualArrLocal: "07:55" },
    },
  },

  // Rotation 2 (ends outstation)
  {
    id: "kl1955",
    type: "flight",
    title: "KL1955 AMS → GDN",
    startDate: at(0, 19, 5),
    endDate: at(0, 21, 0),
    details: {
      flightNumber: "KL1955",
      route: "AMS-GDN",
      departure: "AMS",
      arrival: "GDN",
      aircraft: "E75",
      registration: "PH-EXQ",
      ctot: "19:22Z",
      prevLegArr: { status: "enroute" },
      delay: { isDelayed: true, newDepLocal: "19:25", reason: "ATC slot" },
      isOutstation: true,
    },
  },

  // ---------- DAY 1 (Today +1) — GDN → AMS, then AMS → BHX → AMS ----------
  {
    id: "kl1956",
    type: "flight",
    title: "KL1956 GDN → AMS",
    startDate: at(1, 9, 10),
    endDate: at(1, 10, 55),
    details: {
      flightNumber: "KL1956",
      route: "GDN-AMS",
      departure: "GDN",
      arrival: "AMS",
      aircraft: "E75",
      registration: "PH-EXQ",
      prevLegArr: { status: "arrived", actualArrLocal: "21:00" },
    },
  },
  {
    id: "kl1761",
    type: "flight",
    title: "KL1761 AMS → BHX",
    startDate: at(1, 12, 20),
    endDate: at(1, 13, 25),
    details: {
      flightNumber: "KL1761",
      route: "AMS-BHX",
      departure: "AMS",
      arrival: "BHX",
      aircraft: "E90",
      registration: "PH-EZX",
      ctot: "12:08Z",
      prevLegArr: { status: "arrived", actualArrLocal: "10:55" },
    },
  },
  {
    id: "kl1762",
    type: "flight",
    title: "KL1762 BHX → AMS",
    startDate: at(1, 14, 15),
    endDate: at(1, 16, 0),
    details: {
      flightNumber: "KL1762",
      route: "BHX-AMS",
      departure: "BHX",
      arrival: "AMS",
      aircraft: "E90",
      registration: "PH-EZX",
      isLateReturn: false,
    },
  },
];

export const MOCK_REST_PERIODS: RestPeriod[] = [
  // Hotel layover in GDN (overrides calculated rest)
  {
    id: "hotel-d0-gdn",
    type: "rest",
    title: "Hotel — GDN Layover",
    startDate: at(0, 21, 30),
    endDate: at(1, 8, 30), // next morning
    duration: 1,
    location: "Gdańsk",
    description: "H1 GDN — Radisson Hotel & Suites",
    details: {
      hotel: "Radisson Hotel & Suites",
      isOutstation: true,
      arrival: "GDN",
    },
  },
];

export const MOCK_TAXI_EVENTS: TaxiEvent[] = [
  {
    id: "taxi-d0-1",
    type: "taxi",
    title: "Taxi Home → AMS P30",
    startDate: at(0, 4, 35),
    endDate: at(0, 5, 15),
  },
];

export const MOCK_OFF_DAYS: OffDay[] = [
  // ---------- DAY 2 (Today +2) — Off (Weekend start) ----------
  {
    id: "off-d2",
    type: "off",
    title: "LVEC — Day Off",
    startDate: at(2, 0, 0),
    endDate: at(2, 23, 59),
  },

  // ---------- DAY 3 (Today +3) — Off ----------
  {
    id: "off-d3",
    type: "off",
    title: "LVES — Day Off",
    startDate: at(3, 0, 0),
    endDate: at(3, 23, 59),
  },
];

export const MOCK_DUTY_DAYS: FlightDuty[] = [
    {
    id: "duty-d0",
    title: "Flight Day Duty",
    type: "duty",
    startDate: at(0, 5, 15),
    endDate: at(0, 22, 15),
  },
  {
    id: "duty-d1",
    type: "duty",
    title: "Flight Day Duty",
    startDate: at(1, 7, 50),
    endDate: at(1, 16, 40),
  },
];

export const MOCK_UP_GROUND_PERIODS: GroundPeriod[] = [
  // Day 0: KL1895 (→07:55) → KL1896 (08:40) @ GOT → 45m, no walk
  {
    id: "gp-d0-got-0755-0840",
    title: "Groundtime",
    type: "groundPeriod",
    startDate: at(0, 7, 55),
    endDate: at(0, 8, 40),
    toWalk: false,
  },

  // Day 0: KL1896 (→10:15) → KL1955 (19:05) @ AMS → 530m, walk=40
  {
    id: "gp-d0-ams-1015-1905",
    title: "Groundtime",
    type: "groundPeriod",
    startDate: at(0, 10, 15),
    endDate: at(0, 12, 5),
    toWalk: true,
    walkTime: 40,
  },

  // Day 1: KL1956 (→10:55) → KL1761 (12:20) @ AMS → 85m, walk=40
  {
    id: "gp-d1-ams-1055-1220",
    title: "Groundtime",
    type: "groundPeriod",
    startDate: at(1, 10, 55),
    endDate: at(1, 12, 20),
    toWalk: true,
    walkTime: 40,
  },

  // Day 1: KL1761 (→13:25) → KL1762 (14:15) @ BHX → 50m, no walk
  {
    id: "gp-d1-bhx-1325-1415",
    title: "Groundtime",
    type: "groundPeriod",
    startDate: at(1, 13, 25),
    endDate: at(1, 14, 15),
    toWalk: false,
  },
];
