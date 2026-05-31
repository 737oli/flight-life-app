import type { ScheduleDay, ScheduleResponse } from "@/services/backendApi";
import { homeBaseDecisionCandidateDays } from "@/services/decisionPresentation";

export type DecisionScheduleRange = {
  startDate: string;
  endDate: string;
};

export const localIsoDate = (now = new Date()) => {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const currentRosterDecisionRange = (
  seedSchedule: ScheduleResponse,
  todayIso = localIsoDate()
): DecisionScheduleRange | null => {
  const periodStart = seedSchedule.last_import?.period_start;
  const periodEnd = seedSchedule.last_import?.period_end;

  if (seedSchedule.status === "empty" || !periodStart || !periodEnd) {
    return null;
  }

  const startDate = periodStart > todayIso ? periodStart : todayIso;
  if (startDate > periodEnd) {
    return null;
  }

  return { startDate, endDate: periodEnd };
};

export const upcomingHomeBaseDecisionCandidateDays = (
  days: ScheduleDay[],
  options: { homeBaseAirport?: string; todayIso?: string } = {}
) => {
  const todayIso = options.todayIso ?? localIsoDate();
  return homeBaseDecisionCandidateDays(days, options.homeBaseAirport).filter(
    (day) => day.date >= todayIso
  );
};
