import { CalendarEvent } from '@/types';

const at = (dayOffset: number, hh: number, mm: number) => {
  const base = new Date();                 // today (your local TZ)
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hh, mm, 0, 0);
  return d;
};

//mock data for testing
export const mockEvents: CalendarEvent[] = [
    {
    id: "taxi-d0-1",
    title: "Taxi Home → AMS P30",
    start: at(0, 4, 35),
    end:   at(0, 5, 15),
    calendar: "Work",
    type: "taxi",
    source: "demo",
    calendarId: "demo-work",
    details: { walkTime: 12, departureTime: "04:35" },
  },
  {
    id: "duty-d0",
    title: "Flight Day Duty",
    start: at(0, 5, 15),
    end:   at(0, 22, 15),
    calendar: "Work",
    type: "duty",
    source: "demo",
    calendarId: "demo-work",
    details: {},
  },

  // Rotation 1
  {
    id: "kl1895",
    title: "KL1895 AMS → GOT",
    start: at(0, 6, 20),
    end:   at(0, 7, 55),
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
    title: "KL1896 GOT → AMS",
    start: at(0, 8, 40),
    end:   at(0, 10, 15),
    calendar: "Work",
    type: "flight",
    source: "demo",
    calendarId: "demo-work",
    details: {
      flightNumber: "KL 1896",
      route: "GOT-AMS",
      departure: "GOT",
      arrival: "AMS",
      aircraft: "E90",
      registration: "PH-EZX",
      prevLegArr: { status: "arrived", actualArrLocal: "07:55" },
      turnaroundTime: "00:45",
    },
  },

  // Rotation 2 (ends outstation)
  {
    id: "kl1955",
    title: "KL1955 AMS → GDN",
    start: at(0, 19, 5),
    end:   at(0, 21, 0),
    calendar: "Work",
    type: "flight",
    source: "demo",
    calendarId: "demo-work",
    details: {
      flightNumber: "1955",
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

  // Hotel layover in GDN (overrides calculated rest)
  {
    id: "hotel-d0-gdn",
    title: "Hotel — GDN Layover",
    start: at(0, 21, 30),
    end:   at(1, 8, 30), // next morning
    calendar: "Work",
    type: "layover",
    source: "demo",
    calendarId: "demo-work",
    location: "Gdańsk",
    description: "H1 GDN — Radisson Hotel & Suites",
    details: {
      hotel: "Radisson Hotel & Suites",
      isOutstation: true,
      arrival: "GDN",
      groundTime: "11:00",
    },
  },

  // ---------- DAY 1 (Today +1) — GDN → AMS, then AMS → BHX → AMS ----------
  {
    id: "duty-d1",
    title: "Flight Day Duty",
    start: at(1, 7, 50),
    end:   at(1, 16, 40),
    calendar: "Work",
    type: "duty",
    source: "demo",
    calendarId: "demo-work",
    details: {},
  },
  {
    id: "kl1956",
    title: "KL1956 GDN → AMS",
    start: at(1, 9, 10),
    end:   at(1, 10, 55),
    calendar: "Work",
    type: "flight",
    source: "demo",
    calendarId: "demo-work",
    details: {
      flightNumber: "1956",
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
    title: "KL1761 AMS → BHX",
    start: at(1, 12, 20),
    end:   at(1, 13, 25),
    calendar: "Work",
    type: "flight",
    source: "demo",
    calendarId: "demo-work",
    details: {
      flightNumber: "1761",
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
    title: "KL1762 BHX → AMS",
    start: at(1, 14, 15),
    end:   at(1, 16, 0),
    calendar: "Work",
    type: "flight",
    source: "demo",
    calendarId: "demo-work",
    details: {
      flightNumber: "1762",
      route: "BHX-AMS",
      departure: "BHX",
      arrival: "AMS",
      aircraft: "E90",
      registration: "PH-EZX",
      turnaroundTime: "00:50",
      isLateReturn: false,
    },
  },

  // ---------- DAY 2 (Today +2) — Off (Weekend start) ----------
  {
    id: "off-d2",
    title: "LVEC — Day Off",
    start: at(2, 0, 0),
    end:   at(2, 23, 59),
    calendar: "Work",
    type: "duty",                  // keep as 'duty' so your grouper can catch LVEC/LVES
    source: "demo",
    calendarId: "demo-work",
  },

  // ---------- DAY 3 (Today +3) — Off ----------
  {
    id: "off-d3",
    title: "LVES — Day Off",
    start: at(3, 0, 0),
    end:   at(3, 23, 59),
    calendar: "Work",
    type: "duty",
    source: "demo",
    calendarId: "demo-work",
  },
];