import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import EventDetailModal from "@/components/EventDetailModal";
import { FlightDayCard } from "@/components/FlightDayCard";
import { OffDayCard } from "@/components/OffDayCard";
import { RestPeriodCard } from "@/components/RestPeriodCard";

import Colors from '@/constants/Colors';
import { fetchListOfFlightDayGroupsFrom } from "@/scripts/fetchFlightDayGroup";
import { fetchOffDays, fetchRestPeriods } from "@/services/calenderParser";
import { formatDateOnly } from "@/services/timeFormatting";

import type {
  FlightDay,
  FlightDuty,
  FlightEvent,
  GroundPeriod,
  OffDay,
  RestPeriod,
  TaxiEvent
} from "@/types";


// utils/dates.ts
export const dayISO = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate())
    .toISOString()
    .slice(0, 10);

export const sortByDate = <T extends { date: Date }>(arr: T[]) =>
  arr.sort((a, b) => a.date.getTime() - b.date.getTime());

const getDayEnd = (fd: FlightDay): Date | undefined =>
  fd.dutyPeriod?.endDate ?? fd.flights[fd.flights.length - 1]?.endDate;

function findNextAfter(
  fd: FlightDay,
  rests: RestPeriod[] = [],
  offs: OffDay[] = [],
  windowMin = 60
): { rest?: RestPeriod; off?: OffDay } {
  const end = getDayEnd(fd);
  if (!end) return {};

  // rest that starts within X minutes after day end
  const rest = rests.find(
    (r) => Math.abs((r.startDate.getTime() - end.getTime()) / 60000) <= windowMin
  );
  if (rest) return { rest };

  // else, is next calendar day an off day?
  const nextStart = new Date(end);
  nextStart.setHours(0, 0, 0, 0);
  nextStart.setDate(nextStart.getDate() + 1);
  const nextEnd = new Date(nextStart);
  nextEnd.setHours(23, 59, 59, 999);

  const off = offs.find(
    (o) =>
      o.startDate.getTime() >= nextStart.getTime() &&
      o.startDate.getTime() <= nextEnd.getTime()
  );
  return off ? { off } : {};
}

/* ---------------- Component ---------------- */

export default function TodayScreen() {
  const [flightDays, setFlightDays] = useState<FlightDay[]>([]);
  const [restPeriods, setRestPeriods] = useState<RestPeriod[]>([]);
  const [offDays, setOffDays] = useState<OffDay[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal selection (single, simple)
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<
    FlightEvent | GroundPeriod | TaxiEvent | FlightDuty | RestPeriod | OffDay | null
  >(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Start day = today @ 00:00
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      // Fetch N days including the start day
      const DAYS = 14;
      const flightDays = await fetchListOfFlightDayGroupsFrom(start, DAYS);

      setFlightDays(sortByDate(flightDays));

      setRestPeriods(await fetchRestPeriods());
      
      setOffDays(await fetchOffDays());

      setLoading(false);
    };

    load();
  }, []);

  const handlePress = (item: any) => {
    setSelected(item);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Today</Text>
          <Text style={styles.date}>{formatDateOnly(new Date())}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          {(loading) ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Loading schedule...</Text>
            </View>
          ) : (
            null
          )}
            <View>
              {flightDays.map((flightDay) => {
                const next = findNextAfter(flightDay, restPeriods, offDays);

                return (
                  <View key={`flight-${flightDay.date.toISOString()}`}>
                    <FlightDayCard
                      date={flightDay.date}
                      flights={flightDay.flights}
                      groundTimes={flightDay.groundTimes}
                      taxi={flightDay.taxi}
                      onFlightPress={handlePress}
                      dutyPeriod={flightDay.dutyPeriod}
                    />

                    {next.rest && (
                      <RestPeriodCard
                        startDate={next.rest.startDate}
                        endDate={next.rest.endDate}
                        duration={next.rest.duration}
                        type={next.rest.type}
                        hotelInfo={next.rest.hotelInfo}
                        lastArrivalAirport={next.rest.lastArrivalAirport}
                        isOutstation={next.rest.lastArrivalAirport !== "AMS"}
                        outstationCode={
                          next.rest.lastArrivalAirport !== "AMS"
                            ? next.rest.lastArrivalAirport
                            : undefined
                        }
                        onPress={() => handlePress(next.rest!)}
                      />
                    )}

                    {!next.rest && next.off && (
                      <OffDayCard
                        event={next.off}
                        onPress={() => handlePress(next.off!)}
                      />
                    )}
                  </View>
                );
              })}
            </View>
        </View>
      </ScrollView>

      <EventDetailModal
        visible={modalVisible}
        event={selected}
        onClose={() => {
          setModalVisible(false);
          setSelected(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: Colors.light.secondary,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 12,
  },
  commuteRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  commuteLabel: {
    fontSize: 14,
    color: Colors.light.secondary,
  },
  commuteValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  trafficNote: {
    fontSize: 12,
    color: Colors.light.warning,
    marginTop: 8,
    fontStyle: "italic",
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.secondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.secondary,
  },
});
