import Colors from "@/constants/Colors";
import { fetchNextSevenDaysSchedule, ScheduleDay } from "@/services/backendApi";
import { loadScheduleCache, saveScheduleCache } from "@/services/scheduleCache";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import {
  AlertCircle,
  Clock,
  FileUp,
  Plane,
  RefreshCw,
  WifiOff,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
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

export default function TodayScreen() {
  const [schedule, setSchedule] = useState<NextSevenDaysSchedule | null>(null);
  const [cachedSchedule, setCachedSchedule] = useState<CachedSchedule | null>(null);
  const [source, setSource] = useState<ScheduleSource>("empty");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      } else {
        setSchedule(null);
        setSource("empty");
        setErrorMessage(error instanceof Error ? error.message : "Schedule unavailable");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSchedule();
    }, [loadSchedule])
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
              <ScheduleDayCard key={day.date} day={day} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ScheduleDayCard({ day }: { day: ScheduleDay }) {
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
              {day.flights.map((flight) => (
                <View key={`${day.date}-${flight.sequence}-${flight.flight_number}`} style={styles.flightRow}>
                  <Plane color={Colors.light.tint} size={16} />
                  <View style={styles.flightMain}>
                    <Text style={styles.flightTitle}>{flight.flight_number}</Text>
                    <Text style={styles.flightRoute}>
                      {flight.dep_airport} {formatRosterTime(flight.scheduled_departure_time)} →{" "}
                      {flight.arr_airport} {formatRosterTime(flight.scheduled_arrival_time)}
                    </Text>
                  </View>
                  {flight.aircraft_code && (
                    <Text style={styles.aircraftCode}>{flight.aircraft_code}</Text>
                  )}
                </View>
              ))}
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
});
