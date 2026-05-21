import Colors from "@/constants/Colors";
import {
  fetchNextSevenDaysSchedule,
  fetchScheduleRange,
  fetchStayVsHomeDecision,
  ScheduleDay,
  ScheduleFlight,
  ScheduleResponse,
  StayVsHomeDecision,
} from "@/services/backendApi";
import {
  arrivalStationForDay,
  choiceLabel,
  decisionNeedsAttention,
  decisionReasoningItems,
  formatDisplayDate,
  homeBaseDecisionCandidateDays,
  recommendationLabel,
} from "@/services/decisionPresentation";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import {
  AlertCircle,
  Building,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  Clock,
  FileUp,
  Home as HomeIcon,
  MapPin,
  Plane,
  X,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
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

type AgendaLoadState = "loading" | "ready" | "empty" | "error";

type DecisionSummary = {
  day: ScheduleDay;
  decision: StayVsHomeDecision | null;
  error: string | null;
  loading: boolean;
};

type DecisionSelection = {
  day: ScheduleDay;
  decision: StayVsHomeDecision;
};

type WeekGroup = {
  key: string;
  label: string;
  days: ScheduleDay[];
};

export default function CalendarScreen() {
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [decisionSummaries, setDecisionSummaries] = useState<Record<string, DecisionSummary>>({});
  const [loadState, setLoadState] = useState<AgendaLoadState>("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<ScheduleDay | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<DecisionSelection | null>(null);

  const loadDecisionSummaries = useCallback(async (days: ScheduleDay[]) => {
    const decisionDays = homeBaseDecisionCandidateDays(days);
    if (decisionDays.length === 0) {
      setDecisionSummaries({});
      return;
    }

    setDecisionSummaries(
      Object.fromEntries(
        decisionDays.map((day) => [
          day.date,
          { day, decision: null, error: null, loading: true },
        ])
      )
    );

    const entries = await Promise.all(
      decisionDays.map(async (day) => {
        try {
          const decision = await fetchStayVsHomeDecision(day.date);
          return [day.date, { day, decision, error: null, loading: false }] as const;
        } catch (error) {
          return [
            day.date,
            {
              day,
              decision: null,
              error: error instanceof Error ? error.message : "Decision unavailable",
              loading: false,
            },
          ] as const;
        }
      })
    );

    setDecisionSummaries(Object.fromEntries(entries));
  }, []);

  const loadAgenda = useCallback(async (asRefresh = false) => {
    if (asRefresh) {
      setRefreshing(true);
    } else {
      setLoadState("loading");
    }

    try {
      const seedSchedule = await fetchNextSevenDaysSchedule();
      const periodStart = seedSchedule.last_import?.period_start;
      const periodEnd = seedSchedule.last_import?.period_end;

      if (seedSchedule.status === "empty" || !periodStart || !periodEnd) {
        setSchedule(null);
        setDecisionSummaries({});
        setLoadState("empty");
        setErrorMessage(null);
        return;
      }

      const rangeSchedule = await fetchScheduleRange({
        startDate: periodStart,
        endDate: periodEnd,
      });
      setSchedule(rangeSchedule);
      setLoadState("ready");
      setErrorMessage(null);
      void loadDecisionSummaries(rangeSchedule.days);
    } catch (error) {
      setSchedule(null);
      setDecisionSummaries({});
      setLoadState("error");
      setErrorMessage(error instanceof Error ? error.message : "Calendar unavailable");
    } finally {
      setRefreshing(false);
    }
  }, [loadDecisionSummaries]);

  useFocusEffect(
    useCallback(() => {
      loadAgenda();
    }, [loadAgenda])
  );

  const weekGroups = useMemo(() => groupDaysByWeek(schedule?.days ?? []), [schedule]);
  const subtitle = schedule
    ? `${formatShortDate(schedule.start_date)} to ${formatShortDate(schedule.end_date)}`
    : "Full imported roster period";

  const handleDecisionPress = useCallback((summary: DecisionSummary) => {
    if (summary.decision) {
      setSelectedDecision({ day: summary.day, decision: summary.decision });
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadAgenda(true)} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Calendar</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {loadState === "loading" ? (
          <StatePanel icon="loading" title="Loading roster agenda" />
        ) : loadState === "error" ? (
          <StatePanel
            detail={errorMessage ?? "Backend unavailable"}
            icon="error"
            title="Calendar unavailable"
          />
        ) : loadState === "empty" ? (
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
          weekGroups.map((week) => (
            <View key={week.key} style={styles.weekSection}>
              <Text style={styles.weekTitle}>{week.label}</Text>
              {week.days.map((day) => (
                <AgendaDayCard
                  day={day}
                  decisionSummary={decisionSummaries[day.date] ?? null}
                  key={day.date}
                  onDecisionPress={handleDecisionPress}
                  onPress={setSelectedDay}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <DayDetailModal
        day={selectedDay}
        onClose={() => setSelectedDay(null)}
        visible={selectedDay !== null}
      />
      <DecisionDetailModal
        onClose={() => setSelectedDecision(null)}
        selection={selectedDecision}
        visible={selectedDecision !== null}
      />
    </SafeAreaView>
  );
}

function AgendaDayCard({
  day,
  decisionSummary,
  onDecisionPress,
  onPress,
}: {
  day: ScheduleDay;
  decisionSummary: DecisionSummary | null;
  onDecisionPress: (summary: DecisionSummary) => void;
  onPress: (day: ScheduleDay) => void;
}) {
  const isOffDay = day.kind === "off_day";
  const isMissing = day.kind === "missing_roster";

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.75}
      onPress={() => onPress(day)}
      style={[styles.dayCard, isOffDay && styles.offDayCard, isMissing && styles.missingDayCard]}
    >
      <View style={styles.dayDateColumn}>
        <Text style={styles.weekdayText}>{day.weekday}</Text>
        <Text style={styles.dayNumberText}>{day.date.slice(-2)}</Text>
      </View>

      <View style={styles.dayContent}>
        <View style={styles.dayHeaderRow}>
          <View style={styles.dayTitleGroup}>
            <Text style={styles.dayTitle}>{labelForKind(day.kind)}</Text>
            {day.duty?.start && day.duty?.end && (
              <Text style={styles.dayMeta}>
                {formatRosterTime(day.duty.start)}-{formatRosterTime(day.duty.end)}
              </Text>
            )}
          </View>
          <ChevronRight color={Colors.light.secondary} size={18} />
        </View>

        {isMissing ? (
          <Text style={styles.mutedText}>No roster data for this date</Text>
        ) : isOffDay ? (
          <Text style={styles.mutedText}>Off</Text>
        ) : day.flights.length > 0 ? (
          <View style={styles.flightList}>
            {day.flights.map((flight) => (
              <FlightLine flight={flight} key={`${day.date}-${flight.sequence}-${flight.flight_number}`} />
            ))}
          </View>
        ) : (
          <Text style={styles.mutedText}>{day.duty?.type ?? "Other duty"}</Text>
        )}

        {day.duty?.overnight_station && !isOffDay && (
          <View style={styles.inlineMetaRow}>
            <MapPin color={Colors.light.secondary} size={14} />
            <Text style={styles.inlineMetaText}>Overnight {day.duty.overnight_station}</Text>
          </View>
        )}

        {decisionSummary && (
          <DecisionMarker summary={decisionSummary} onPress={onDecisionPress} />
        )}

        {day.warnings.length > 0 && (
          <View style={styles.warningRow}>
            <AlertCircle color={Colors.light.warning} size={14} />
            <Text style={styles.warningText}>
              {day.warnings.length} warning{day.warnings.length === 1 ? "" : "s"}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function FlightLine({ flight }: { flight: ScheduleFlight }) {
  return (
    <View style={styles.flightRow}>
      <Plane color={Colors.light.tint} size={15} />
      <View style={styles.flightTextGroup}>
        <Text style={styles.flightTitle}>{flight.flight_number}</Text>
        <Text style={styles.flightMeta}>
          {flight.dep_airport} {formatRosterTime(flight.scheduled_departure_time)} → {flight.arr_airport}{" "}
          {formatRosterTime(flight.scheduled_arrival_time)}
        </Text>
      </View>
      {flight.aircraft_code && <Text style={styles.aircraftCode}>{flight.aircraft_code}</Text>}
    </View>
  );
}

function DecisionMarker({
  onPress,
  summary,
}: {
  onPress: (summary: DecisionSummary) => void;
  summary: DecisionSummary;
}) {
  if (summary.loading) {
    return (
      <View style={[styles.decisionMarker, styles.decisionMarkerReview]}>
        <ActivityIndicator color={Colors.light.warning} size="small" />
        <Text style={[styles.decisionMarkerText, styles.decisionMarkerReviewText]}>Checking decision</Text>
      </View>
    );
  }

  if (summary.error || !summary.decision) {
    return (
      <View style={[styles.decisionMarker, styles.decisionMarkerReview]}>
        <AlertCircle color={Colors.light.warning} size={15} />
        <Text style={[styles.decisionMarkerText, styles.decisionMarkerReviewText]}>Decision unavailable</Text>
      </View>
    );
  }

  const needsAttention = decisionNeedsAttention(summary.decision);
  const Icon = needsAttention ? AlertCircle : CheckCircle;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.75}
      onPress={() => onPress(summary)}
      style={[
        styles.decisionMarker,
        needsAttention ? styles.decisionMarkerReview : styles.decisionMarkerConfirmed,
      ]}
    >
      <Icon color={needsAttention ? Colors.light.warning : Colors.light.success} size={15} />
      <Text
        style={[
          styles.decisionMarkerText,
          needsAttention ? styles.decisionMarkerReviewText : styles.decisionMarkerConfirmedText,
        ]}
      >
        {needsAttention ? "Decision needed" : "Decision confirmed"}
      </Text>
    </TouchableOpacity>
  );
}

function DayDetailModal({
  day,
  onClose,
  visible,
}: {
  day: ScheduleDay | null;
  onClose: () => void;
  visible: boolean;
}) {
  if (!day) {
    return (
      <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" visible={visible}>
        <SafeAreaView style={styles.modalContainer} />
      </Modal>
    );
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" visible={visible}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View style={styles.modalTitleGroup}>
            <Text style={styles.modalTitle}>{formatDisplayDate(day.date)}</Text>
            <Text style={styles.modalSubtitle}>{labelForKind(day.kind)}</Text>
          </View>
          <TouchableOpacity accessibilityRole="button" onPress={onClose} style={styles.iconButton}>
            <X color={Colors.light.text} size={22} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Duty</Text>
            <DetailRow icon={CalendarDays} label="Type" value={day.duty?.type ?? labelForKind(day.kind)} />
            {day.duty?.start && <DetailRow icon={Clock} label="Start" value={formatRosterTime(day.duty.start)} />}
            {day.duty?.end && <DetailRow icon={Clock} label="End" value={formatRosterTime(day.duty.end)} />}
            {day.duty?.overnight_station && (
              <DetailRow icon={MapPin} label="Overnight" value={day.duty.overnight_station} />
            )}
          </View>

          {day.flights.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Flights</Text>
              {day.flights.map((flight) => (
                <View key={`${day.date}-detail-${flight.sequence}-${flight.flight_number}`} style={styles.detailFlightRow}>
                  <Plane color={Colors.light.tint} size={17} />
                  <View style={styles.detailFlightText}>
                    <Text style={styles.detailFlightTitle}>{flight.flight_number}</Text>
                    <Text style={styles.detailMuted}>
                      {flight.dep_airport} {formatRosterTime(flight.scheduled_departure_time)} →{" "}
                      {flight.arr_airport} {formatRosterTime(flight.scheduled_arrival_time)}
                    </Text>
                  </View>
                  {flight.aircraft_code && <Text style={styles.aircraftCode}>{flight.aircraft_code}</Text>}
                </View>
              ))}
            </View>
          )}

          {day.hotel && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Hotel</Text>
              <Text style={styles.detailMuted}>{formatHotel(day.hotel)}</Text>
            </View>
          )}

          {day.warnings.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Warnings</Text>
              {day.warnings.map((warning) => (
                <Text key={warning} style={styles.warningDetailText}>
                  {warning.replace(/_/g, " ")}
                </Text>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function DecisionDetailModal({
  onClose,
  selection,
  visible,
}: {
  onClose: () => void;
  selection: DecisionSelection | null;
  visible: boolean;
}) {
  const decision = selection?.decision ?? null;
  const day = selection?.day ?? null;

  if (!decision || !day) {
    return (
      <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" visible={visible}>
        <SafeAreaView style={styles.modalContainer} />
      </Modal>
    );
  }

  const needsAttention = decisionNeedsAttention(decision);
  const isNeedsReview = decision.state === "needs_review" || decision.recommendation === "needs_review";
  const Icon = isNeedsReview ? AlertCircle : decisionIcon(decision.recommendation);
  const reasoning = decisionReasoningItems(decision);

  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" visible={visible}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View style={styles.modalTitleGroup}>
            <Text style={styles.modalTitle}>Stay vs Home</Text>
            <Text style={styles.modalSubtitle}>{formatDisplayDate(day.date)}</Text>
          </View>
          <TouchableOpacity accessibilityRole="button" onPress={onClose} style={styles.iconButton}>
            <X color={Colors.light.text} size={22} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.detailSection}>
            <View style={styles.decisionDetailHeader}>
              <Icon
                color={isNeedsReview ? Colors.light.warning : decisionColor(decision.recommendation)}
                size={24}
              />
              <View style={styles.decisionTitleGroup}>
                <Text
                  style={[
                    styles.decisionDetailTitle,
                    { color: isNeedsReview ? Colors.light.warning : decisionColor(decision.recommendation) },
                  ]}
                >
                  {recommendationLabel(decision)}
                </Text>
                <Text style={styles.detailMuted}>
                  {needsAttention ? "Decision still needs attention" : "Manual choice confirmed"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Duty Context</Text>
            <DetailRow icon={Plane} label="Arrival station" value={arrivalStationForDay(day) ?? "Unknown"} />
            {day.duty?.end && <DetailRow icon={Clock} label="Duty end" value={formatRosterTime(day.duty.end)} />}
            {day.duty?.overnight_station && (
              <DetailRow icon={MapPin} label="Overnight" value={day.duty.overnight_station} />
            )}
          </View>

          {decision.manual_override && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Your Choice</Text>
              <DetailRow icon={CheckCircle} label="Manual choice" value={choiceLabel(decision.manual_override.choice)} />
              {decision.manual_override.status === "needs_review" && (
                <Text style={styles.detailMuted}>This choice needs review after a roster change.</Text>
              )}
            </View>
          )}

          {reasoning.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Reasoning</Text>
              {reasoning.map((item) => (
                <Text key={item} style={styles.reasoningItem}>
                  {item}
                </Text>
              ))}
            </View>
          )}

          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => {
              onClose();
              router.navigate("/decisions" as never);
            }}
            style={styles.openDecisionsButton}
          >
            <Text style={styles.openDecisionsButtonText}>Open Decisions</Text>
            <ChevronRight color="#fff" size={18} />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ color?: string; size?: number }>;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Icon color={Colors.light.secondary} size={16} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function StatePanel({
  detail,
  icon,
  title,
}: {
  detail?: string;
  icon: "loading" | "error";
  title: string;
}) {
  return (
    <View style={styles.statePanel}>
      {icon === "loading" ? (
        <ActivityIndicator color={Colors.light.tint} size="small" />
      ) : (
        <AlertCircle color={Colors.light.danger} size={24} />
      )}
      <Text style={styles.stateTitle}>{title}</Text>
      {detail && <Text style={styles.stateDetail}>{detail}</Text>}
    </View>
  );
}

function groupDaysByWeek(days: ScheduleDay[]): WeekGroup[] {
  const groups = new Map<string, ScheduleDay[]>();
  days.forEach((day) => {
    const start = weekStart(day.date);
    const key = start.toISOString().slice(0, 10);
    const current = groups.get(key) ?? [];
    current.push(day);
    groups.set(key, current);
  });

  return Array.from(groups.entries()).map(([key, groupedDays]) => ({
    key,
    label: `Week of ${formatShortDate(key)}`,
    days: groupedDays,
  }));
}

function weekStart(isoDate: string) {
  const parsed = new Date(`${isoDate}T00:00:00`);
  const day = parsed.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  parsed.setDate(parsed.getDate() + mondayOffset);
  return parsed;
}

function formatShortDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function formatRosterTime(value: string | null) {
  if (!value || value.length !== 4) {
    return "--:--";
  }
  return `${value.slice(0, 2)}:${value.slice(2)}`;
}

function labelForKind(kind: ScheduleDay["kind"]) {
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
      return String(kind).replace(/_/g, " ");
  }
}

function formatHotel(hotel: Record<string, unknown>) {
  const hotelCode = typeof hotel.hotel_code === "string" ? hotel.hotel_code : null;
  const minutes = typeof hotel.minutes === "number" ? hotel.minutes : null;
  return [hotelCode ? `Hotel ${hotelCode}` : "Hotel available", minutes ? `${minutes} min` : null]
    .filter(Boolean)
    .join(" | ");
}

function decisionIcon(recommendation: StayVsHomeDecision["recommendation"]) {
  return recommendation === "go_home" ? HomeIcon : Building;
}

function decisionColor(recommendation: StayVsHomeDecision["recommendation"]) {
  if (recommendation === "needs_review") {
    return Colors.light.warning;
  }
  return recommendation === "go_home" ? Colors.light.success : Colors.light.tint;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    color: Colors.light.text,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.light.secondary,
    fontSize: 15,
    fontWeight: "600",
  },
  statePanel: {
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    margin: 20,
    padding: 24,
  },
  stateTitle: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  stateDetail: {
    color: Colors.light.secondary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    textAlign: "center",
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
    fontWeight: "800",
  },
  weekSection: {
    marginTop: 12,
  },
  weekTitle: {
    color: Colors.light.secondary,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
    marginHorizontal: 20,
    textTransform: "uppercase",
  },
  dayCard: {
    alignItems: "flex-start",
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    marginHorizontal: 20,
    marginVertical: 5,
    minHeight: 86,
    padding: 12,
  },
  offDayCard: {
    minHeight: 68,
    paddingVertical: 10,
  },
  missingDayCard: {
    borderStyle: "dashed",
  },
  dayDateColumn: {
    alignItems: "center",
    borderRightColor: Colors.light.border,
    borderRightWidth: 1,
    marginRight: 12,
    minWidth: 44,
    paddingRight: 10,
  },
  weekdayText: {
    color: Colors.light.secondary,
    fontSize: 12,
    fontWeight: "800",
  },
  dayNumberText: {
    color: Colors.light.text,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 2,
  },
  dayContent: {
    flex: 1,
    gap: 8,
  },
  dayHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayTitleGroup: {
    flex: 1,
  },
  dayTitle: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: "800",
  },
  dayMeta: {
    color: Colors.light.secondary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  mutedText: {
    color: Colors.light.secondary,
    fontSize: 14,
    fontWeight: "600",
  },
  flightList: {
    gap: 7,
  },
  flightRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  flightTextGroup: {
    flex: 1,
  },
  flightTitle: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: "800",
  },
  flightMeta: {
    color: Colors.light.secondary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 1,
  },
  aircraftCode: {
    color: Colors.light.secondary,
    fontSize: 12,
    fontWeight: "800",
  },
  inlineMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  inlineMetaText: {
    color: Colors.light.secondary,
    fontSize: 13,
    fontWeight: "700",
  },
  decisionMarker: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    minHeight: 30,
    paddingHorizontal: 10,
  },
  decisionMarkerReview: {
    backgroundColor: `${Colors.light.warning}18`,
  },
  decisionMarkerConfirmed: {
    backgroundColor: `${Colors.light.success}18`,
  },
  decisionMarkerText: {
    fontSize: 13,
    fontWeight: "800",
  },
  decisionMarkerReviewText: {
    color: Colors.light.warning,
  },
  decisionMarkerConfirmedText: {
    color: Colors.light.success,
  },
  warningRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
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
    borderBottomColor: Colors.light.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 18,
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
    borderColor: Colors.light.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  modalContent: {
    gap: 12,
    padding: 18,
    paddingBottom: 36,
  },
  detailSection: {
    backgroundColor: Colors.light.card,
    borderColor: Colors.light.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  detailSectionTitle: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: "800",
  },
  detailRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  detailLabel: {
    color: Colors.light.secondary,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  detailValue: {
    color: Colors.light.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "right",
  },
  detailFlightRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  detailFlightText: {
    flex: 1,
  },
  detailFlightTitle: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: "800",
  },
  detailMuted: {
    color: Colors.light.secondary,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  warningDetailText: {
    color: Colors.light.warning,
    fontSize: 14,
    fontWeight: "700",
  },
  decisionDetailHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  decisionTitleGroup: {
    flex: 1,
  },
  decisionDetailTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  reasoningItem: {
    color: Colors.light.secondary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  openDecisionsButton: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 16,
  },
  openDecisionsButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
