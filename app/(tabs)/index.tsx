import EventDetailModal from "@/components/EventDetailModal";
import { FlightDayCard } from "@/components/FlightDayCard";
import { OffDayCard } from "@/components/OffDayCard";
import { RestPeriodCard } from "@/components/RestPeriodCard";
import Colors from "@/constants/Colors";
import { mockEvents } from "@/data/events";
import { CalendarEvent, FlightDay, RestPeriod } from "@/types";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";


export interface GroupedResult {
  flightDays: { [key: string]: FlightDay };
  offDays: { [key: string]: CalendarEvent };
  restPeriods: RestPeriod[];
  hotelPeriods: CalendarEvent[];       // keep for debugging/analytics
  standbyPeriods: CalendarEvent[];     // expose since you collect it
  allDays: Array<{
    type: "flight" | "off";
    date: Date;
    data: FlightDay | CalendarEvent;
  }>;
  nonWorkEvents: CalendarEvent[];
}

export const groupFlightDays = (events: CalendarEvent[]): GroupedResult => {
  // Work vs non-work
  const workEvents = events.filter(
    (e) =>
      e.calendar === "Work" &&
      e.type !== "other" &&
      !e.title.toLowerCase().includes("click")
  );
  const nonWorkEvents = events.filter((e) => e.calendar !== "Work");

  // Buckets
  const flightDayGroups: { [key: string]: FlightDay } = {};
  const offDayGroups: { [key: string]: CalendarEvent } = {};
  const restPeriods: RestPeriod[] = [];
  const hotelPeriods: CalendarEvent[] = [];
  const standbyPeriods: CalendarEvent[] = [];

  // Work-day grouping
  workEvents.forEach((event) => {
    const dateKey = event.start.toDateString();
    const titleL = event.title.toLowerCase();

    // Off days: LVEC/LVES
    if (titleL.includes("lvec") || titleL.includes("lves")) {
      offDayGroups[dateKey] = event;
      return;
    }

    // Init group
    if (!flightDayGroups[dateKey]) {
      flightDayGroups[dateKey] = {
        date: new Date(dateKey),
        taxi: undefined,
        flights: [],
        groundTimes: [],
        turnarounds: [],
        standby: [],
      };
    }
    const group = flightDayGroups[dateKey];

    // Categorize
    if (event.type === "duty" && titleL.includes("flight day")) {
      group.dutyPeriod = event;
    } else if (event.type === "flight") {
      group.flights.push(event);
    } else if (event.type === "duty" && titleL.includes("grondtijd")) {
      group.groundTimes.push(event);
    } else if (event.type === "duty" && titleL.includes("omdraai")) {
      group.turnarounds.push(event);
    } else if (event.type === "taxi") {
      group.taxi = event;
    } else if (event.type === "layover" && titleL.includes("hotel")) {
      hotelPeriods.push(event);
    } else if (event.type === "duty" && titleL.includes("sby_h")) {
      standbyPeriods.push(event);
      group.standby.push(event);
    }
  });

  // Sort inner arrays
  Object.values(flightDayGroups).forEach((g) => {
    const byStart = (a: CalendarEvent, b: CalendarEvent) =>
      a.start.getTime() - b.start.getTime();
    g.flights.sort(byStart);
    g.groundTimes.sort(byStart);
    g.turnarounds.sort(byStart);
  });

  // Compute calculated rest periods between consecutive flight days
  const sortedFlightDays = Object.values(flightDayGroups).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  const MIN_REST_MINUTES = 4 * 60; // 4h

  for (let i = 0; i < sortedFlightDays.length - 1; i++) {
    const current = sortedFlightDays[i];
    const next = sortedFlightDays[i + 1];

    const currentEnd =
      current.dutyPeriod?.end ??
      (current.flights.length
        ? current.flights[current.flights.length - 1].end
        : current.date);

    const nextStart =
      next.dutyPeriod?.start ??
      (next.flights.length ? next.flights[0].start : next.date);

    if (currentEnd && nextStart) {
      const minutes =
        (nextStart.getTime() - currentEnd.getTime()) / 60000;
      if (minutes >= MIN_REST_MINUTES) {
        const lastFlight = current.flights[current.flights.length - 1];
        const lastArrivalAirport = lastFlight?.details?.arrival ?? "AMS";
        restPeriods.push({
          startDate: currentEnd,
          endDate: nextStart,
          duration: Math.round(minutes), // store minutes
          type: "rest",
          lastArrivalAirport,
        });
      }
    }
  }

  // Overlay hotel layovers as rest (and remove overlapping calculated rests)
  hotelPeriods.forEach((hotel) => {
    const hotelStart = hotel.start.getTime();
    const hotelEnd = hotel.end.getTime();
    const durationMinutes = Math.max(0, Math.round((hotelEnd - hotelStart) / 60000));

    const hotelInfo =
      hotel.description || hotel.details?.hotel || hotel.location;

    // remove overlaps of type "rest"
    for (let i = restPeriods.length - 1; i >= 0; i--) {
      const r = restPeriods[i];
      const rStart = r.startDate.getTime();
      const rEnd = r.endDate.getTime();
      const overlaps =
        rStart < hotelEnd && rEnd > hotelStart && r.type === "rest";
      if (overlaps) restPeriods.splice(i, 1);
    }

    restPeriods.push({
      startDate: hotel.start,
      endDate: hotel.end,
      duration: durationMinutes,    // minutes
      type: "hotel",
      hotelInfo,
      lastArrivalAirport: hotel.details?.arrival ?? "AMS",
    });
  });

  // Build allDays (flight + off) and sort
  const allDays: GroupedResult["allDays"] = [];
  Object.values(flightDayGroups).forEach((fd) =>
    allDays.push({ type: "flight", date: fd.date, data: fd })
  );
  Object.values(offDayGroups).forEach((off) =>
    allDays.push({ type: "off", date: off.start, data: off })
  );
  allDays.sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    flightDays: flightDayGroups,
    offDays: offDayGroups,
    restPeriods: restPeriods.sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime()
    ),
    hotelPeriods,
    standbyPeriods,
    allDays,
    nonWorkEvents,
  };
};


export default function HomeScreen() {
  const grouped = groupFlightDays(mockEvents);
  const [todayData, setTodayData] = useState<{ groupedData: GroupedResult }>({
    groupedData: grouped,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    // In a real app, fetch and set events here
    const grouped = groupFlightDays(mockEvents);
    setTodayData({ groupedData: grouped });
  }, []);

  const handleEventPress = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setModalVisible(true);
    console.log("Pressed event:", event);
  };

  const handleRestPeriodPress = (rest: RestPeriod) => {
    // Handle rest period press (e.g., show details)
    console.log("Pressed rest period:", rest);
  };

  // Format date as "Monday, January 1, 2024"
  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.header}>
        <Text style={styles.title}>Today</Text>
        <Text style={styles.date}>{formatDateTime(new Date())}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Schedule</Text>

        {/* Combined Schedule */}
        {todayData.groupedData.allDays.length > 0 ? (
          <View>
            {todayData.groupedData.allDays.map((dayItem, index) => {
              if (dayItem.type === "off") {
                return (
                  <OffDayCard
                    key={`off-${dayItem.date.toDateString()}`}
                    event={dayItem.data as CalendarEvent}
                    onPress={() =>
                      handleEventPress(dayItem.data as CalendarEvent)
                    }
                  />
                );
              } else {
                const flightDay = dayItem.data as FlightDay;
                const restPeriod = todayData.groupedData.restPeriods.find(
                  (rest) => {
                    const dayEndTime =
                      flightDay.dutyPeriod?.end ||
                      flightDay.flights[flightDay.flights.length - 1]?.end;
                    if (!dayEndTime) return false;

                    // Check if rest period starts around the same time as this day ends
                    const timeDiff = Math.abs(
                      rest.startDate.getTime() - dayEndTime.getTime()
                    );
                    return timeDiff < 60 * 60 * 1000; // Within 1 hour
                  }
                );

                return (
                  <View key={`flight-${flightDay.date.toDateString()}`}>
                    <FlightDayCard
                      date={flightDay.date}
                      flights={flightDay.flights}
                      onFlightPress={handleEventPress}
                      flightDay={flightDay}
                    />
                    {restPeriod && (
                      <RestPeriodCard
                        startDate={restPeriod.startDate}
                        endDate={restPeriod.endDate}
                        duration={restPeriod.duration}
                        type={restPeriod.type}
                        hotelInfo={restPeriod.hotelInfo}
                        lastArrivalAirport={restPeriod.lastArrivalAirport}
                        isOutstation={restPeriod.lastArrivalAirport !== "AMS"}
                        outstationCode={
                          restPeriod.lastArrivalAirport !== "AMS"
                            ? restPeriod.lastArrivalAirport
                            : undefined
                        }
                        onPress={() => handleRestPeriodPress(restPeriod)}
                      />
                    )}
                  </View>
                );
              }
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No flights scheduled</Text>
            <Text style={styles.emptySubtext}>Enjoy your time off! ✈️</Text>
          </View>
        )}
      </View>
      <EventDetailModal
        visible={modalVisible}
        event={selectedEvent}
        onClose={() => {
          setModalVisible(false);
          setSelectedEvent(null);
        }}
      />
    </ScrollView>
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
