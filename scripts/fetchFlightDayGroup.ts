import type { FlightDay, FlightDuty, FlightEvent, GroundPeriod, TaxiEvent } from "@/types";

import {
  fetchDutyDays,
  fetchFlightEvents,
  fetchGroundPeriods,
  fetchTaxiEvents,
} from "@/services/calenderParser";

// --- date helpers ---
const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
const inRange = (d: Date, a: Date, b: Date) =>
  d.getTime() >= a.getTime() && d.getTime() <= b.getTime();
const byStart = <T extends { startDate: Date }>(a: T, b: T) =>
  a.startDate.getTime() - b.startDate.getTime();

export async function fetchFlightDayGroup(
  date: Date
): Promise<FlightDay | null> {
  // simulate latency (keep per your skeleton)
  await new Promise((resolve) => setTimeout(resolve, 500));

  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  // load all sources in parallel
  const [flightsAll, dutiesAll, groundAll, taxiAll] = await Promise.all([
    fetchFlightEvents(), // FlightEvent[]
    fetchDutyDays(), // FlightDuty[]
    fetchGroundPeriods(), // GroundPeriod[]
    fetchTaxiEvents(), // TaxiEvent[]
  ]);

  // filter by items that START on the selected day
  const flights: FlightEvent[] = flightsAll
    .filter((f) => inRange(f.startDate, dayStart, dayEnd))
    .sort(byStart);

  const groundTimes: GroundPeriod[] = groundAll
    .filter((g) => inRange(g.startDate, dayStart, dayEnd))
    .sort(byStart);

  const duties: FlightDuty[] = dutiesAll
    .filter((d) => inRange(d.startDate, dayStart, dayEnd))
    .sort(byStart);

  const taxis: TaxiEvent[] = taxiAll
    .filter((t) => inRange(t.startDate, dayStart, dayEnd))
    .sort(byStart);

  // nothing that starts this day? return null
  if (
    flights.length === 0 &&
    groundTimes.length === 0 &&
    duties.length === 0 &&
    taxis.length === 0
  ) {
    return null;
  }

  // choose the first duty (if multiple, you can change to keep array later)
  const dutyPeriod = duties[0];

  
  // make sure the day of the taxi event is the same as the day of the flightduty
  const taxi = taxis.find(t => {
    if (!dutyPeriod) return false;
    return (t.startDate.getFullYear() === dutyPeriod.startDate.getFullYear() &&
      t.startDate.getMonth() === dutyPeriod.startDate.getMonth() &&
      t.startDate.getDate() === dutyPeriod.startDate.getDate());
  });

  const flightDay: FlightDay = {
    date: dayStart,
    dutyPeriod,
    flights,
    groundTimes,
    taxi,
  };

  return flightDay;
}

export async function fetchFlightDayGroupByOffset(
  dayOffset: number
): Promise<FlightDay | null> {
  const base = new Date();
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
  return fetchFlightDayGroup(d);
}

export async function fetchListOfFlightDayGroupsFrom(
  startDate: Date,
  amountOfDays: number
): Promise<FlightDay[]> {
  const start = startOfDay(startDate);
  const days: FlightDay[] = [];

  // keep it simple & sequential (can switch to Promise.all later)
  for (let i = 0; i < amountOfDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    const fd = await fetchFlightDayGroup(d); // returns FlightDay | null
    if (fd) days.push(fd);
  }

  // sort ascending, just in case
  days.sort((a, b) => a.date.getTime() - b.date.getTime());
  return days;
}
