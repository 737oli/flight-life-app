import type {
  ScheduleDay,
  StayVsHomeChoice,
  StayVsHomeDecision,
} from "@/services/backendApi";

export const isDecisionCandidateDay = (day: ScheduleDay) =>
  day.kind !== "off_day" && day.kind !== "missing_roster" && day.duty !== null;

export const isHomeBaseDecisionCandidateDay = (day: ScheduleDay, homeBaseAirport = "AMS") =>
  day.kind === "flight_duty" &&
  day.duty !== null &&
  arrivalStationForDay(day)?.toUpperCase() === homeBaseAirport.toUpperCase();

export const homeBaseDecisionCandidateDays = (days: ScheduleDay[], homeBaseAirport = "AMS") =>
  days.filter((day) => isHomeBaseDecisionCandidateDay(day, homeBaseAirport));

export const decisionNeedsAttention = (decision: StayVsHomeDecision) =>
  decision.state === "needs_review" ||
  decision.recommendation === "needs_review" ||
  decision.manual_override?.status === "needs_review" ||
  !decision.manual_override;

export const arrivalStationForDay = (day: ScheduleDay) => {
  const lastFlight = day.flights.at(-1);
  return lastFlight?.arr_airport ?? day.duty?.overnight_station ?? null;
};

export const choiceLabel = (choice: StayVsHomeChoice) =>
  choice === "go_home" ? "Go Home" : "Stay at Outstation";

export const recommendationLabel = (decision: StayVsHomeDecision) => {
  if (decision.recommendation === "needs_review") {
    return "Needs review";
  }
  const prefix = decision.state === "overridden" ? "Your choice" : "Recommended";
  return `${prefix}: ${choiceLabel(decision.recommendation)}`;
};

export const decisionReasoningItems = (decision: StayVsHomeDecision) => {
  const reasoning = decision.reasoning;
  const items: string[] = [];

  if (reasoning.arrival_station) {
    items.push(`Arrival station: ${reasoning.arrival_station}`);
  }
  if (reasoning.next_duty_date && reasoning.next_duty_start) {
    items.push(
      `Next duty: ${formatDisplayDate(reasoning.next_duty_date)} at ${formatIsoTime(reasoning.next_duty_start)}`
    );
  }
  if (typeof reasoning.time_between_duties_minutes === "number") {
    items.push(`Time between duties: ${formatMinutes(reasoning.time_between_duties_minutes)}`);
  }
  if (typeof reasoning.useful_home_minutes === "number") {
    items.push(`Useful time at home: ${formatMinutes(reasoning.useful_home_minutes)}`);
  }
  if (typeof reasoning.home_commute_minutes_each_way === "number") {
    items.push(`Commute assumption: ${reasoning.home_commute_minutes_each_way} min each way`);
  }
  if (typeof reasoning.hotel_available === "boolean") {
    items.push(reasoning.hotel_available ? "Hotel/rest available" : "Hotel/rest unknown");
  }
  if (reasoning.manual_review_reason) {
    items.push(`Manual choice review: ${reasoning.manual_review_reason.replace(/_/g, " ")}`);
  }
  decision.missing_inputs.forEach((input) => {
    items.push(`Missing input: ${input.replace(/_/g, " ")}`);
  });

  return items;
};

export const formatDisplayDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

export const formatIsoTime = (isoDateTime: string) => {
  const parsed = new Date(isoDateTime);
  if (Number.isNaN(parsed.getTime())) {
    return isoDateTime;
  }
  return parsed.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatMinutes = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours <= 0) {
    return `${minutes} min`;
  }
  if (remainder === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainder}m`;
};
