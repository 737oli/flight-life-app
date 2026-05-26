import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  FlightOperationsResponse,
  OperationsLiveData,
  OperationsWalkingStart,
} from "@/services/backendApi";

const OPERATIONS_SNAPSHOT_CACHE_KEY = "flightLife.operationsSnapshots.v1";

export type OperationAnnotationSource = "live" | "last_known";

export type OperationAnnotation = {
  source: OperationAnnotationSource;
  captured_at: string | null;
  flight_leg_id: number;
  parking_position: string | null;
  ctot: string | null;
  tsat: string | null;
  previous_flight_arrival: string | null;
  aircraft_registration: string | null;
  aircraft_type: string | null;
  scheduled_departure: string | null;
  latest_departure: string | null;
  scheduled_arrival: string | null;
  latest_arrival: string | null;
  departure_delay_minutes: number | null;
  arrival_delay_minutes: number | null;
  walking_start: OperationsWalkingStart | null;
};

export type CachedOperationSnapshot = OperationAnnotation & {
  source: "last_known";
};

type OperationSnapshotStore = Record<string, CachedOperationSnapshot>;

export const getOperationAnnotation = (
  operations: FlightOperationsResponse | null,
  snapshot: CachedOperationSnapshot | null
): OperationAnnotation | null => {
  const liveAnnotation = operations ? buildLiveOperationAnnotation(operations) : null;
  return liveAnnotation ?? snapshot;
};

export const buildLiveOperationAnnotation = (
  operations: FlightOperationsResponse,
  capturedAt = new Date().toISOString()
): OperationAnnotation | null => {
  if (!operations.live) {
    return null;
  }

  return {
    source: "live",
    captured_at: capturedAt,
    flight_leg_id: operations.flight_leg_id,
    walking_start: operations.walking_start,
    ...annotationFieldsFromLive(operations.live),
  };
};

export const saveOperationSnapshot = async (
  operations: FlightOperationsResponse
): Promise<CachedOperationSnapshot | null> => {
  const annotation = buildLiveOperationAnnotation(operations);
  if (!annotation) {
    return null;
  }

  const snapshot: CachedOperationSnapshot = {
    ...annotation,
    source: "last_known",
  };
  const snapshots = await loadOperationSnapshotStore();
  snapshots[String(snapshot.flight_leg_id)] = snapshot;
  await AsyncStorage.setItem(OPERATIONS_SNAPSHOT_CACHE_KEY, JSON.stringify(snapshots));
  return snapshot;
};

export const loadOperationSnapshots = async (
  flightLegIds?: number[]
): Promise<Record<number, CachedOperationSnapshot>> => {
  const snapshots = await loadOperationSnapshotStore();
  const allowedIds = flightLegIds ? new Set(flightLegIds.map(String)) : null;

  return Object.entries(snapshots).reduce<Record<number, CachedOperationSnapshot>>(
    (accumulator, [key, snapshot]) => {
      if (!allowedIds || allowedIds.has(key)) {
        accumulator[Number(key)] = snapshot;
      }
      return accumulator;
    },
    {}
  );
};

export const clearOperationSnapshots = async (): Promise<void> => {
  await AsyncStorage.removeItem(OPERATIONS_SNAPSHOT_CACHE_KEY);
};

export const deriveDelayMinutes = (
  explicitDelay: number | null | undefined,
  scheduledTime: string | null | undefined,
  latestTime: string | null | undefined
): number | null => {
  if (typeof explicitDelay === "number") {
    return explicitDelay;
  }
  return differenceMinutes(scheduledTime, latestTime);
};

export const formatSignedMinutes = (minutes: number): string =>
  `${minutes > 0 ? "+" : ""}${minutes} min`;

const annotationFieldsFromLive = (live: OperationsLiveData) => ({
  parking_position: live.parking_position,
  ctot: live.ctot,
  tsat: live.tsat,
  previous_flight_arrival: live.previous_flight_arrival,
  aircraft_registration: live.aircraft_registration,
  aircraft_type: live.aircraft_type,
  scheduled_departure: live.scheduled_departure,
  latest_departure: live.latest_departure,
  scheduled_arrival: live.scheduled_arrival,
  latest_arrival: live.latest_arrival,
  departure_delay_minutes: deriveDelayMinutes(
    live.delay_minutes,
    live.scheduled_departure,
    live.latest_departure
  ),
  arrival_delay_minutes: differenceMinutes(live.scheduled_arrival, live.latest_arrival),
});

const loadOperationSnapshotStore = async (): Promise<OperationSnapshotStore> => {
  const value = await AsyncStorage.getItem(OPERATIONS_SNAPSHOT_CACHE_KEY);
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as OperationSnapshotStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const differenceMinutes = (
  scheduledTime: string | null | undefined,
  latestTime: string | null | undefined
) => {
  if (!scheduledTime || !latestTime) {
    return null;
  }

  const scheduled = new Date(scheduledTime);
  const latest = new Date(latestTime);
  if (Number.isNaN(scheduled.getTime()) || Number.isNaN(latest.getTime())) {
    return null;
  }

  return Math.round((latest.getTime() - scheduled.getTime()) / 60000);
};
