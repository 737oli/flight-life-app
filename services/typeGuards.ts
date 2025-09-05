// src/services/typeGuards.ts
import type {
    FlightDay,
    FlightDuty,
    FlightEvent,
    GroundPeriod,
    OffDay,
    RestPeriod,
    TaxiEvent,
} from "@/types";

// --- small shared helpers ---
const hasDates = (e: any): e is { startDate: Date; endDate: Date } =>
  !!e && e.startDate instanceof Date && e.endDate instanceof Date;

const hasType = (e: any): e is { type: string } =>
  !!e && typeof e.type === "string";

// --- ultra-simple, type-based guards ---
export const isFlightEvent = (e: any): e is FlightEvent =>
  hasType(e) && e.type === "flight" && hasDates(e);

export const isFlightDuty = (e: any): e is FlightDuty =>
  hasType(e) && e.type === "duty" && hasDates(e);

export const isRestPeriod = (e: any): e is RestPeriod =>
  hasType(e) && e.type === "rest" && hasDates(e);

export const isGroundPeriod = (e: any): e is GroundPeriod =>
  hasType(e) && e.type === "ground" && hasDates(e);

export const isTaxiEvent = (e: any): e is TaxiEvent =>
  hasType(e) && e.type === "taxi" && hasDates(e);

export const isOffDay = (e: any): e is OffDay =>
  hasType(e) && e.type === "off" && hasDates(e);

// FlightDay is a grouping object (not part of the flat timeline)
export const isFlightDay = (e: any): e is FlightDay =>
  !!e && e.date instanceof Date && Array.isArray(e.flights);

// Optional: a discriminated kind + union for rendering switches
export type ItemKind = "flight" | "duty" | "rest" | "ground" | "taxi" | "off" | "unknown";
export type ScheduleItem = FlightEvent | FlightDuty | RestPeriod | GroundPeriod | TaxiEvent | OffDay;

export function getKind(e: any): ItemKind {
  if (!hasType(e)) return "unknown";
  switch (e.type) {
    case "flight": return "flight";
    case "duty":   return "duty";
    case "rest":   return "rest";
    case "ground": return "ground";
    case "taxi":   return "taxi";
    case "off":    return "off";
    default:       return "unknown";
  }
}
