import Colors from "@/constants/Colors";
import {
  fetchFlightOperations,
  fetchNextSevenDaysSchedule,
  FlightOperationsResponse,
  ScheduleDay,
  ScheduleFlight,
} from "@/services/backendApi";
import {
  CachedOperationSnapshot,
  formatSignedMinutes,
  getOperationAnnotation,
  loadOperationSnapshots,
  OperationAnnotation,
  saveOperationSnapshot,
} from "@/services/operationsSnapshotCache";
import { loadScheduleCache, saveScheduleCache } from "@/services/scheduleCache";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  FileUp,
  MapPin,
  Navigation,
  ParkingCircle,
  Plane,
  RefreshCw,
  WifiOff,
  X,
  Zap,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { CachedSchedule } from "@/services/scheduleCache";
import type { NextSevenDaysSchedule } from "@/services/backendApi";

type ScheduleSource = "backend" | "cache" | "empty";

type FlightSelection = {
  day: ScheduleDay;
  flight: ScheduleFlight;
};

type OperationState = {
  data: FlightOperationsResponse | null;
  loading: boolean;
  error: string | null;
};

export default function TodayScreen() {
  const [schedule, setSchedule] = useState<NextSevenDaysSchedule | null>(null);
  const [cachedSchedule, setCachedSchedule] = useState<CachedSchedule | null>(null);
  const [source, setSource] = useState<ScheduleSource>("empty");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [operationStates, setOperationStates] = useState<Record<number, OperationState>>({});
  const [operationSnapshots, setOperationSnapshots] = useState<Record<number, CachedOperationSnapshot>>({});
  const [selectedFlight, setSelectedFlight] = useState<FlightSelection | null>(null);

  const loadSchedule = useCallback(async (asRefresh = false) => {
    if (asRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetchNextSevenDaysSchedule();
      setSchedule(response);
      setSource(response.status === "empty" ? "empty" : "backend");
      setErrorMessage(null);
      setOperationSnapshots(await loadOperationSnapshots(flightLegIdsForSchedule(response)));
      if (response.status !== "empty") {
        setCachedSchedule(await saveScheduleCache(response));
      }
    } catch (error) {
      const cache = await loadScheduleCache();
      if (cache) {
        setCachedSchedule(cache);
        setSchedule(cache.schedule);
        setSource("cache");
        setErrorMessage("Backend unavailable");
        setOperationSnapshots(await loadOperationSnapshots(flightLegIdsForSchedule(cache.schedule)));
      } else {
        setSchedule(null);
        setSource("empty");
        setErrorMessage(error instanceof Error ? error.message : "Schedule unavailable");
        setOperationSnapshots({});
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadOperations = useCallback(
    async (flightLegId: number | undefined, force = false) => {
      if (!flightLegId) {
        return;
      }

      const existingState = operationStates[flightLegId];
      if (!force && (existingState?.loading || existingState?.data)) {
        return;
      }

      setOperationStates((current) => ({
        ...current,
        [flightLegId]: {
          data: current[flightLegId]?.data ?? null,
          loading: true,
          error: null,
        },
      }));

      try {
        const operations = await fetchFlightOperations(flightLegId);
        const snapshot = await saveOperationSnapshot(operations);
        setOperationStates((current) => ({
          ...current,
          [flightLegId]: {
            data: operations,
            loading: false,
            error: null,
          },
        }));
        if (snapshot) {
          setOperationSnapshots((current) => ({
            ...current,
            [flightLegId]: snapshot,
          }));
        }
      } catch (error) {
        setOperationStates((current) => ({
          ...current,
          [flightLegId]: {
            data: current[flightLegId]?.data ?? null,
            loading: false,
            error: error instanceof Error ? error.message : "Operations unavailable",
          },
        }));
      }
    },
    [operationStates]
  );

  useFocusEffect(
    useCallback(() => {
      loadSchedule();
    }, [loadSchedule])
  );

  const nextOperationalFlight = useMemo(
    () => (schedule && source === "backend" ? findNextOperationalFlight(schedule.days) : null),
    [schedule, source]
  );

  useEffect(() => {
    if (nextOperationalFlight?.flight.flight_leg_id) {
      loadOperations(nextOperationalFlight.flight.flight_leg_id);
    }
  }, [loadOperations, nextOperationalFlight?.flight.flight_leg_id]);

  const handleFlightPress = useCallback(
    (day: ScheduleDay, flight: ScheduleFlight) => {
      setSelectedFlight({ day, flight });
      if (source === "backend") {
        loadOperations(flight.flight_leg_id);
      }
    },
    [loadOperations, source]
  );

  const cachedAtText = cachedSchedule
    ? new Date(cachedSchedule.cachedAt).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadSchedule(true)} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Today</Text>
          <Text style={styles.date}>{formatLongDate(new Date())}</Text>
        </View>

        {source === "cache" && (
          <View style={styles.banner}>
            <WifiOff color={Colors.light.warning} size={18} />
            <Text style={styles.bannerText}>
              Cached schedule{cachedAtText ? ` from ${cachedAtText}` : ""}
            </Text>
          </View>
        )}

        {errorMessage && source !== "cache" && (
          <View style={styles.banner}>
            <AlertCircle color={Colors.light.danger} size={18} />
            <Text style={styles.bannerText}>{errorMessage}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.statePanel}>
            <RefreshCw color={Colors.light.tint} size={22} />
            <Text style={styles.stateTitle}>Loading schedule</Text>
          </View>
        ) : schedule?.status === "empty" || !schedule ? (
          <View style={styles.statePanel}>
            <FileUp color={Colors.light.tint} size={24} />
            <Text style={styles.stateTitle}>No roster imported</Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => router.navigate("/settings" as never)}
              style={styles.primaryButton}
            >
              <FileUp color="#fff" size={18} />
              <Text style={styles.primaryButtonText}>Import Roster</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Next 7 Days</Text>
              <Text style={styles.sectionMeta}>
                {schedule.start_date} to {schedule.end_date}
              </Text>
            </View>

            {schedule.days.map((day) => (
              <ScheduleDayCard
                key={day.date}
                day={day}
                highlightedFlightLegId={nextOperationalFlight?.flight.flight_leg_id ?? null}
                operationSnapshots={operationSnapshots}
                operationStates={operationStates}
                onFlightPress={handleFlightPress}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <FlightDetailModal
        canLoadOperations={source === "backend"}
        operationState={
          selectedFlight?.flight.flight_leg_id
            ? operationStates[selectedFlight.flight.flight_leg_id]
            : undefined
        }
        operationSnapshot={
          selectedFlight?.flight.flight_leg_id
            ? operationSnapshots[selectedFlight.flight.flight_leg_id]
            : undefined
        }
        onClose={() => setSelectedFlight(null)}
        onRefresh={() => loadOperations(selectedFlight?.flight.flight_leg_id, true)}
        selection={selectedFlight}
        visible={selectedFlight !== null}
      />
    </SafeAreaView>
  );
}

function ScheduleDayCard({
  day,
  highlightedFlightLegId,
  operationSnapshots,
  operationStates,
  onFlightPress,
}: {
  day: ScheduleDay;
  highlightedFlightLegId: number | null;
  operationSnapshots: Record<number, CachedOperationSnapshot>;
  operationStates: Record<number, OperationState>;
  onFlightPress: (day: ScheduleDay, flight: ScheduleFlight) => void;
}) {
  const isOffDay = day.kind === "off_day";
  const isMissing = day.kind === "missing_roster";
  const isFlightDuty = day.kind === "flight_duty";

  return (
    <View style={[styles.dayCard, isOffDay && styles.offDayCard]}>
      <View style={styles.dayHeader}>
        <View>
          <Text style={styles.dayDate}>
            {day.weekday} {formatShortDate(day.date)}
          </Text>
          <Text style={styles.dayKind}>{labelForKind(day.kind)}</Text>
        </View>
        {day.duty?.start && day.duty?.end && (
          <View style={styles.timePill}>
            <Clock color={Colors.light.secondary} size={14} />
            <Text style={styles.timePillText}>
              {formatRosterTime(day.duty.start)}-{formatRosterTime(day.duty.end)}
            </Text>
          </View>
        )}
      </View>

      {isMissing ? (
        <Text style={styles.mutedText}>No roster data for this date</Text>
      ) : isOffDay ? (
        <Text style={styles.mutedText}>Off</Text>
      ) : (
        <>
          {day.duty?.overnight_station && (
            <Text style={styles.stationText}>Overnight {day.duty.overnight_station}</Text>
          )}

          {isFlightDuty && day.flights.length > 0 ? (
            <View style={styles.flightList}>
              {day.flights.map((flight) => {
                const flightLegId = flight.flight_leg_id;
                const operationState = flightLegId ? operationStates[flightLegId] : undefined;
                const annotation = getOperationAnnotation(
                  operationState?.data ?? null,
                  flightLegId ? operationSnapshots[flightLegId] ?? null : null
                );
                const showOperations =
                  flightLegId === highlightedFlightLegId ||
                  annotation !== null ||
                  Boolean(operationState?.loading);

                return (
                <TouchableOpacity
                  accessibilityRole="button"
                  key={`${day.date}-${flight.sequence}-${flight.flight_number}`}
                  onPress={() => onFlightPress(day, flight)}
                  style={styles.flightRow}
                >
                  <Plane color={Colors.light.tint} size={16} />
                  <View style={styles.flightMain}>
                    <Text style={styles.flightTitle}>{flight.flight_number}</Text>
                    <Text style={styles.flightRoute}>
                      {flight.dep_airport} {formatRosterTime(flight.scheduled_departure_time)} →{" "}
                      {flight.arr_airport} {formatRosterTime(flight.scheduled_arrival_time)}
                    </Text>
                    {showOperations && (
                      <OperationsChips
                        annotation={annotation}
                        loading={operationState?.loading ?? false}
                      />
                    )}
                  </View>
                  {flight.aircraft_code && (
                    <Text style={styles.aircraftCode}>{flight.aircraft_code}</Text>
                  )}
                </TouchableOpacity>
              );
              })}
            </View>
          ) : (
            <Text style={styles.mutedText}>{day.duty?.type ?? "Other duty"}</Text>
          )}
        </>
      )}

      {day.warnings.length > 0 && (
        <View style={styles.warningRow}>
          <AlertCircle color={Colors.light.warning} size={15} />
          <Text style={styles.warningText}>
            {day.warnings.length} warning{day.warnings.length === 1 ? "" : "s"}
          </Text>
        </View>
      )}
    </View>
  );
}

function OperationsChips({
  annotation,
  loading,
}: {
  annotation: OperationAnnotation | null;
  loading: boolean;
}) {
  const isLastKnown = annotation?.source === "last_known";
  const chips = [
    isLastKnown ? { label: "Last known", tone: "muted" } : null,
    annotation?.parking_position ? { label: `Stand ${annotation.parking_position}`, tone: "neutral" } : null,
    annotation?.aircraft_registration
      ? {
          label: [annotation.aircraft_registration, annotation.aircraft_type].filter(Boolean).join(" "),
          tone: "neutral",
        }
      : annotation?.aircraft_type
        ? { label: annotation.aircraft_type, tone: "neutral" }
        : null,
    annotation?.ctot ? { label: `CTOT ${formatOpsTime(annotation.ctot)}`, tone: "purple" } : null,
    annotation?.tsat ? { label: `TSAT ${formatOpsTime(annotation.tsat)}`, tone: "purple" } : null,
    typeof annotation?.departure_delay_minutes === "number" && annotation.departure_delay_minutes !== 0
      ? { label: `Dep ${formatSignedMinutes(annotation.departure_delay_minutes)}`, tone: "warning" }
      : null,
    typeof annotation?.arrival_delay_minutes === "number" && annotation.arrival_delay_minutes !== 0
      ? { label: `Arr ${formatSignedMinutes(annotation.arrival_delay_minutes)}`, tone: "warning" }
      : null,
  ].filter((chip): chip is { label: string; tone: string } => Boolean(chip));

  if (loading) {
    return (
      <View style={styles.opsChipRow}>
        <View style={styles.opsChip}>
          <ActivityIndicator color={Colors.light.tint} size="small" />
          <Text style={styles.opsChipText}>Ops</Text>
        </View>
      </View>
    );
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <View style={styles.opsChipRow}>
      {chips.map((chip) => (
        <View
          key={chip.label}
          style={[
            styles.opsChip,
            chip.tone === "muted" && styles.opsChipMuted,
            chip.tone === "purple" && styles.opsChipPurple,
            chip.tone === "warning" && styles.opsChipWarning,
          ]}
        >
          <Text
            style={[
              styles.opsChipText,
              chip.tone === "muted" && styles.opsChipTextMuted,
              chip.tone === "purple" && styles.opsChipTextPurple,
              chip.tone === "warning" && styles.opsChipTextWarning,
            ]}
          >
            {chip.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function FlightDetailModal({
  canLoadOperations,
  operationSnapshot,
  operationState,
  onClose,
  onRefresh,
  selection,
  visible,
}: {
  canLoadOperations: boolean;
  operationSnapshot?: CachedOperationSnapshot;
  operationState?: OperationState;
  onClose: () => void;
  onRefresh: () => void;
  selection: FlightSelection | null;
  visible: boolean;
}) {
  const flight = selection?.flight ?? null;
  const day = selection?.day ?? null;
  const operations = operationState?.data ?? null;
  const annotation = getOperationAnnotation(operations, operationSnapshot ?? null);

  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" visible={visible}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View style={styles.modalTitleGroup}>
            <Text style={styles.modalTitle}>{flight?.flight_number ?? "Flight"}</Text>
            {flight && (
              <Text style={styles.modalSubtitle}>
                {flight.dep_airport} {formatRosterTime(flight.scheduled_departure_time)} →{" "}
                {flight.arr_airport} {formatRosterTime(flight.scheduled_arrival_time)}
              </Text>
            )}
          </View>
          <TouchableOpacity accessibilityRole="button" onPress={onClose} style={styles.iconButton}>
            <X color={Colors.light.text} size={22} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          {flight && day && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Roster Plan</Text>
              <DetailRow icon={Plane} label="Route" value={`${flight.dep_airport} → ${flight.arr_airport}`} />
              <DetailRow
                icon={Clock}
                label="Scheduled"
                value={`${formatShortDate(day.date)} ${formatRosterTime(flight.scheduled_departure_time)}-${formatRosterTime(flight.scheduled_arrival_time)}`}
              />
              {flight.aircraft_code && (
                <DetailRow icon={Activity} label="Planned aircraft" value={flight.aircraft_code} />
              )}
            </View>
          )}

          <View style={styles.detailSection}>
            <View style={styles.detailSectionHeader}>
              <Text style={styles.detailSectionTitle}>Operations</Text>
              {canLoadOperations && flight?.flight_leg_id && (
                <TouchableOpacity
                  accessibilityRole="button"
                  disabled={operationState?.loading}
                  onPress={onRefresh}
                  style={styles.refreshButton}
                >
                  {operationState?.loading ? (
                    <ActivityIndicator color={Colors.light.tint} size="small" />
                  ) : (
                    <RefreshCw color={Colors.light.tint} size={16} />
                  )}
                </TouchableOpacity>
              )}
            </View>

            {!canLoadOperations && !annotation ? (
              <Text style={styles.detailMuted}>Backend unavailable. Planned schedule is shown from cache.</Text>
            ) : operationState?.loading && !annotation ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={Colors.light.secondary} size="small" />
                <Text style={styles.detailMuted}>Loading operations...</Text>
              </View>
            ) : operationState?.error && !annotation ? (
              <Text style={styles.detailMuted}>{operationState.error}</Text>
            ) : operations ? (
              <View style={styles.opsDetailList}>
                <DetailRow
                  icon={CheckCircle}
                  label="Source"
                  value={labelForOperationsStatus(operations, annotation)}
                />
                {operations.walking_start.time && (
                  <DetailRow
                    icon={MapPin}
                    label="Start walking"
                    value={`${formatRosterTime(operations.walking_start.time)} (${operations.walking_start.buffer_minutes} min buffer)`}
                  />
                )}
                {annotation?.latest_departure || annotation?.scheduled_departure ? (
                  <DetailTimeRow
                    icon={Clock}
                    label="Departure"
                    plannedValue={formatOpsTime(
                      annotation.scheduled_departure ?? operations.scheduled.departure_time
                    )}
                    revisedValue={annotation.latest_departure ? formatOpsTime(annotation.latest_departure) : null}
                    deviationMinutes={annotation.departure_delay_minutes}
                  />
                ) : null}
                {annotation?.latest_arrival || annotation?.scheduled_arrival ? (
                  <DetailTimeRow
                    icon={Clock}
                    label="Arrival"
                    plannedValue={formatOpsTime(
                      annotation.scheduled_arrival ?? operations.scheduled.arrival_time
                    )}
                    revisedValue={annotation.latest_arrival ? formatOpsTime(annotation.latest_arrival) : null}
                    deviationMinutes={annotation.arrival_delay_minutes}
                  />
                ) : null}
                {annotation?.parking_position ? (
                  <DetailRow icon={ParkingCircle} label="Stand" value={annotation.parking_position} />
                ) : operations.eligibility === "eligible" ? (
                  <DetailRow icon={ParkingCircle} label="Stand" value="Stand unknown" muted />
                ) : null}
                {annotation?.aircraft_registration || annotation?.aircraft_type ? (
                  <DetailRow
                    icon={Plane}
                    label="Aircraft"
                    value={[annotation?.aircraft_registration, annotation?.aircraft_type].filter(Boolean).join(" ")}
                  />
                ) : null}
                {annotation?.ctot && <DetailRow icon={Zap} label="CTOT" value={formatOpsTime(annotation.ctot)} />}
                {annotation?.tsat && <DetailRow icon={Zap} label="TSAT" value={formatOpsTime(annotation.tsat)} />}
                {typeof annotation?.departure_delay_minutes === "number" && (
                  <DetailRow
                    icon={Clock}
                    label="Departure delay"
                    value={formatSignedMinutes(annotation.departure_delay_minutes)}
                  />
                )}
                {typeof annotation?.arrival_delay_minutes === "number" && annotation.arrival_delay_minutes !== 0 && (
                  <DetailRow
                    icon={Clock}
                    label="Arrival delay"
                    value={formatSignedMinutes(annotation.arrival_delay_minutes)}
                  />
                )}
                {annotation?.previous_flight_arrival && (
                  <DetailRow
                    icon={Navigation}
                    label="Previous arrival"
                    value={formatOpsTime(annotation.previous_flight_arrival)}
                  />
                )}
                <OperationsContext annotation={annotation} operations={operations} />
              </View>
            ) : annotation ? (
              <View style={styles.opsDetailList}>
                <DetailRow icon={CheckCircle} label="Source" value={labelForOperationsStatus(null, annotation)} />
                <CachedAnnotationRows annotation={annotation} />
                <OperationsContext annotation={annotation} operations={null} />
              </View>
            ) : (
              <Text style={styles.detailMuted}>Live operations are loaded for flights in the 90-minute window.</Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function DetailRow({
  icon: Icon,
  label,
  muted = false,
  value,
}: {
  icon: React.ComponentType<{ color?: string; size?: number }>;
  label: string;
  muted?: boolean;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Icon color={muted ? Colors.light.secondary : Colors.light.tint} size={17} />
      <View style={styles.detailRowContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, muted && styles.detailValueMuted]}>{value}</Text>
      </View>
    </View>
  );
}

function DetailTimeRow({
  deviationMinutes,
  icon: Icon,
  label,
  plannedValue,
  revisedValue,
}: {
  deviationMinutes: number | null;
  icon: React.ComponentType<{ color?: string; size?: number }>;
  label: string;
  plannedValue: string;
  revisedValue: string | null;
}) {
  const showDeviation = typeof deviationMinutes === "number" && deviationMinutes !== 0;
  const primaryValue = revisedValue || plannedValue;

  return (
    <View style={styles.detailRow}>
      <Icon color={showDeviation ? Colors.light.warning : Colors.light.tint} size={17} />
      <View style={styles.detailRowContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, showDeviation && styles.detailValueWarning]}>
          {primaryValue}
          {showDeviation && (
            <Text style={styles.superscript}> {formatSignedMinutes(deviationMinutes)}</Text>
          )}
        </Text>
        {revisedValue && revisedValue !== plannedValue && (
          <Text style={styles.detailMuted}>Roster {plannedValue}</Text>
        )}
      </View>
    </View>
  );
}

function CachedAnnotationRows({ annotation }: { annotation: OperationAnnotation }) {
  return (
    <>
      {annotation.latest_departure || annotation.scheduled_departure ? (
        <DetailTimeRow
          icon={Clock}
          label="Departure"
          plannedValue={formatOpsTime(annotation.scheduled_departure)}
          revisedValue={annotation.latest_departure ? formatOpsTime(annotation.latest_departure) : null}
          deviationMinutes={annotation.departure_delay_minutes}
        />
      ) : null}
      {annotation.latest_arrival || annotation.scheduled_arrival ? (
        <DetailTimeRow
          icon={Clock}
          label="Arrival"
          plannedValue={formatOpsTime(annotation.scheduled_arrival)}
          revisedValue={annotation.latest_arrival ? formatOpsTime(annotation.latest_arrival) : null}
          deviationMinutes={annotation.arrival_delay_minutes}
        />
      ) : null}
      {annotation.parking_position && (
        <DetailRow icon={ParkingCircle} label="Stand" value={annotation.parking_position} />
      )}
      {annotation.aircraft_registration || annotation.aircraft_type ? (
        <DetailRow
          icon={Plane}
          label="Aircraft"
          value={[annotation.aircraft_registration, annotation.aircraft_type].filter(Boolean).join(" ")}
        />
      ) : null}
      {annotation.previous_flight_arrival && (
        <DetailRow
          icon={Navigation}
          label="Previous arrival"
          value={formatOpsTime(annotation.previous_flight_arrival)}
        />
      )}
    </>
  );
}

function OperationsContext({
  annotation,
  operations,
}: {
  annotation: OperationAnnotation | null;
  operations: FlightOperationsResponse | null;
}) {
  if (annotation?.source === "last_known") {
    return (
      <Text style={styles.detailMuted}>
        Last-known live annotation{annotation.captured_at ? ` from ${formatCapturedAt(annotation.captured_at)}` : ""}.
        Roster plan is unchanged.
      </Text>
    );
  }

  if (operations?.status === "live_unavailable") {
    return <Text style={styles.detailMuted}>Live data unavailable. Roster plan is unchanged.</Text>;
  }

  if (operations?.eligibility === "outside_window") {
    return (
      <Text style={styles.detailMuted}>
        Live enrichment opens {operations.operations_window_minutes} min before departure.
      </Text>
    );
  }

  if (!annotation) {
    return null;
  }

  const missingFields = [
    annotation.parking_position ? null : "stand",
    annotation.ctot ? null : "CTOT",
    annotation.tsat ? null : "TSAT",
    annotation.previous_flight_arrival ? null : "previous arrival",
  ].filter((field): field is string => Boolean(field));

  if (missingFields.length === 0) {
    return null;
  }

  return <Text style={styles.detailMuted}>Unavailable: {missingFields.join(", ")}</Text>;
}

const formatLongDate = (date: Date) =>
  date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

const formatShortDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

const formatRosterTime = (time: string | null | undefined) => {
  if (!time) {
    return "";
  }
  const padded = time.padStart(4, "0");
  return `${padded.slice(0, 2)}:${padded.slice(2)}`;
};

const labelForKind = (kind: string) => {
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

const findNextOperationalFlight = (days: ScheduleDay[]): FlightSelection | null => {
  const now = Date.now();
  const candidates = days
    .flatMap((day) =>
      day.flights.map((flight) => ({
        day,
        flight,
        departureAt: scheduledDepartureAt(day.date, flight.scheduled_departure_time),
      }))
    )
    .filter((candidate) => {
      if (!candidate.flight.flight_leg_id || !candidate.departureAt) {
        return false;
      }
      const minutesUntilDeparture = (candidate.departureAt.getTime() - now) / 60000;
      return minutesUntilDeparture >= 0 && minutesUntilDeparture <= 90;
    })
    .sort((left, right) => {
      if (!left.departureAt || !right.departureAt) {
        return 0;
      }
      return left.departureAt.getTime() - right.departureAt.getTime();
    });

  return candidates.length > 0 ? { day: candidates[0].day, flight: candidates[0].flight } : null;
};

const scheduledDepartureAt = (isoDate: string, hhmm: string | null | undefined) => {
  if (!hhmm || !/^\d{4}$/.test(hhmm)) {
    return null;
  }
  const hours = Number(hhmm.slice(0, 2));
  const minutes = Number(hhmm.slice(2));
  const departure = new Date(`${isoDate}T00:00:00`);
  departure.setHours(hours, minutes, 0, 0);
  return departure;
};

const formatOpsTime = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }
  if (/^\d{4}$/.test(value)) {
    return formatRosterTime(value);
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return value;
};

const formatCapturedAt = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const labelForOperationsStatus = (
  operations: FlightOperationsResponse | null,
  annotation: OperationAnnotation | null
) => {
  if (annotation?.source === "last_known") {
    return "Last-known live annotation";
  }
  if (operations?.status === "ok") {
    return "Live annotation";
  }
  if (operations?.status === "live_unavailable") {
    return "Live unavailable";
  }
  if (operations?.eligibility === "outside_window") {
    return "Scheduled baseline";
  }
  return operations?.status.replace(/_/g, " ") ?? "Operations";
};

const flightLegIdsForSchedule = (schedule: NextSevenDaysSchedule): number[] =>
  schedule.days.flatMap((day) =>
    day.flights
      .map((flight) => flight.flight_leg_id)
      .filter((flightLegId): flightLegId is number => typeof flightLegId === "number")
  );

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: Colors.light.secondary,
  },
  banner: {
    alignItems: "center",
    backgroundColor: `${Colors.light.warning}14`,
    borderColor: `${Colors.light.warning}50`,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 8,
    padding: 12,
  },
  bannerText: {
    color: Colors.light.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  statePanel: {
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    marginHorizontal: 20,
    marginTop: 18,
    padding: 24,
  },
  stateTitle: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: "700",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sectionHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.light.text,
    fontSize: 20,
    fontWeight: "700",
  },
  sectionMeta: {
    color: Colors.light.secondary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 5,
  },
  dayCard: {
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  offDayCard: {
    paddingVertical: 10,
  },
  dayHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  dayDate: {
    color: Colors.light.text,
    fontSize: 17,
    fontWeight: "800",
  },
  dayKind: {
    color: Colors.light.secondary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  timePill: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: Colors.light.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  timePillText: {
    color: Colors.light.secondary,
    fontSize: 12,
    fontWeight: "700",
  },
  mutedText: {
    color: Colors.light.secondary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  stationText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
  },
  flightList: {
    gap: 8,
    marginTop: 12,
  },
  flightRow: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: Colors.light.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 10,
  },
  flightMain: {
    flex: 1,
  },
  flightTitle: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: "800",
  },
  flightRoute: {
    color: Colors.light.secondary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  aircraftCode: {
    color: Colors.light.secondary,
    fontSize: 12,
    fontWeight: "800",
  },
  opsChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  opsChip: {
    alignItems: "center",
    backgroundColor: `${Colors.light.tint}14`,
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  opsChipMuted: {
    backgroundColor: `${Colors.light.secondary}16`,
  },
  opsChipPurple: {
    backgroundColor: "#5B4BAA18",
  },
  opsChipWarning: {
    backgroundColor: `${Colors.light.warning}20`,
  },
  opsChipText: {
    color: Colors.light.tint,
    fontSize: 11,
    fontWeight: "800",
  },
  opsChipTextMuted: {
    color: Colors.light.secondary,
  },
  opsChipTextPurple: {
    color: "#5B4BAA",
  },
  opsChipTextWarning: {
    color: Colors.light.warning,
  },
  warningRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  warningText: {
    color: Colors.light.warning,
    fontSize: 13,
    fontWeight: "700",
  },
  modalContainer: {
    backgroundColor: Colors.light.background,
    flex: 1,
  },
  modalHeader: {
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderBottomColor: Colors.light.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  modalTitleGroup: {
    flex: 1,
  },
  modalTitle: {
    color: Colors.light.text,
    fontSize: 22,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: Colors.light.secondary,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 3,
  },
  iconButton: {
    alignItems: "center",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 40,
    minWidth: 40,
  },
  modalContent: {
    gap: 14,
    padding: 20,
    paddingBottom: 36,
  },
  detailSection: {
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  detailSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailSectionTitle: {
    color: Colors.light.text,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 10,
  },
  refreshButton: {
    alignItems: "center",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 36,
    minWidth: 36,
  },
  detailMuted: {
    color: Colors.light.secondary,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  loadingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  opsDetailList: {
    gap: 10,
  },
  detailRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
  },
  detailRowContent: {
    flex: 1,
  },
  detailLabel: {
    color: Colors.light.secondary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  detailValue: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: "700",
  },
  detailValueWarning: {
    color: Colors.light.warning,
  },
  detailValueMuted: {
    color: Colors.light.secondary,
  },
  superscript: {
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 12,
  },
});
