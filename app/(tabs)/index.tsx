import Colors from "@/constants/Colors";
import { CalendarEvent, FlightDay, RestPeriod } from "@/types";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

//mock data for testing

// Function to group events into flight days
const groupFlightDays = (events: CalendarEvent[]): any => {
  // Filter out work events, excluding 'other' types and those with 'click' in the title
  const workEvents = events.filter(
    (event) =>
      event.calendar === "Work" &&
      event.type !== "other" &&
      !event.title.toLowerCase().includes("click")
  );

  // non-work events can be ignored for flight day grouping
  const nonWorkEvents = events.filter((event) => event.calendar !== "Work");

  //group work events by date
  const flightDayGroups: { [key: string]: FlightDay } = {};
  const offDayGroups: { [key: string]: CalendarEvent } = {};
  const restPeriods: RestPeriod[] = [];
  const hotelPeriods: CalendarEvent[] = [];
  const standbyPeriods: CalendarEvent[] = [];

  workEvents.forEach((event) => {
    const dateKey = event.start.toDateString();

    // Check for off days (LVEC or LVES in title) and group them separately
    if (
      event.title.toLowerCase().includes("LVEC") ||
      event.title.toLowerCase().includes("LVES")
    ) {
      offDayGroups[dateKey] = event;
      return;
    }

    // Initialize flight day group if not already present
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

    // Categorize events into flights, ground times, turnarounds, and taxi
    const normalizedTitle = event.title.toLowerCase();
    if (event.type === "duty" && normalizedTitle.includes("flight day")) {
      group.dutyPeriod = event;
    } else if (event.type === "flight") {
      group.flights.push(event);
    } else if (
      event.type === "duty" &&
      event.title.toLowerCase().includes("grondtijd")
    ) {
      group.groundTimes.push(event);
    } else if (
      event.type === "duty" &&
      event.title.toLowerCase().includes("omdraai")
    ) {
      group.turnarounds.push(event);
    } else if (event.type === "taxi") {
      group.taxi = event;
    } else if (
      event.type === "layover" &&
      event.title.toLowerCase().includes("hotel")
    ) {
      hotelPeriods.push(event);
    } else if (
      event.type === "duty" &&
      event.title.toLowerCase().includes("sby_h")
    ) {
      standbyPeriods.push(event);
    }
  });

  //sort flights and ground times within each flight day
  Object.values(flightDayGroups).forEach((group) => {
    group.flights.sort((a, b) => a.start.getTime() - b.start.getTime());
    group.groundTimes.sort((a, b) => a.start.getTime() - b.start.getTime());
    group.turnarounds.sort((a, b) => a.start.getTime() - b.start.getTime());
  });

  // Calculate rest periods between flight days
  const sortedFlightDays = Object.values(flightDayGroups).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
  const minimumRestHours = 4; // Minimum rest period to consider

  for (let i = 0; i < sortedFlightDays.length - 1; i++) {
    const currentDay = sortedFlightDays[i];
    const nextDay = sortedFlightDays[i + 1];

    // Use duty period end time if available, otherwise use last flight end time
    const currentEnd =
      currentDay.dutyPeriod?.end ||
      (currentDay.flights.length > 0
        ? currentDay.flights[currentDay.flights.length - 1].end
        : currentDay.date);

    // Use duty period start time if available, otherwise use first flight start time
    const nextStart =
      nextDay.dutyPeriod?.start ||
      (nextDay.flights.length > 0 ? nextDay.flights[0].start : nextDay.date);

    if (currentEnd && nextStart) {
      const restDurationMinutes = nextStart.getTime() - currentEnd.getTime();
      const restDurationHours = Math.floor(
        restDurationMinutes / (1000 * 60 * 60)
      );

      //Only Show rest periods longer than X hours
      if (restDurationHours >= minimumRestHours) {
        const lastFlight = currentDay.flights[currentDay.flights.length - 1];
        const lastArrivalAirport = lastFlight?.details?.arrival || "AMS";

        restPeriods.push({
          startDate: currentEnd,
          endDate: nextStart,
          duration: restDurationHours,
          type: "rest",
          lastArrivalAirport,
        });
      }
    }
  }

  // Add hotel periods as rest periods, overriding any calculated rest periods on the same day
  hotelPeriods.forEach((hotelEvent) => {
    const durationMs = hotelEvent.end.getTime() - hotelEvent.start.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    // Extract hotel information from event details
    const hotelInfo =
      hotelEvent.description ||
      hotelEvent.details?.hotel ||
      hotelEvent.location;

    // add hotel period as a rest period
    restPeriods.push({
      startDate: hotelEvent.start,
      endDate: hotelEvent.end,
      duration: durationHours,
      type: "hotel",
      hotelInfo,
      lastArrivalAirport: hotelEvent.details?.arrival || "AMS",
    });

    // Remove any overlapping calculated rest periods
    const hotelStart = hotelEvent.start.getTime();
    const hotelEnd = hotelEvent.end.getTime();
    for (let i = restPeriods.length - 1; i >= 0; i--) {
      const rest = restPeriods[i];
      if (
        rest.startDate.getTime() < hotelEnd &&
        rest.endDate.getTime() > hotelStart &&
        rest.type === "rest"
      ) {
        restPeriods.splice(i, 1);
      }
    }

    // Sort rest periods by start date
    restPeriods.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    // Create a combined list of flight days and off days
    const allDays: Array<{
      type: "flight" | "off";
      date: Date;
      data: FlightDay | CalendarEvent;
    }> = []; // example: { type: 'flight', date: Date, data: FlightDay } or { type: 'off', date: Date, data: CalendarEvent }

    // Add flight days
    Object.values(flightDayGroups).forEach((flightDay) => {
      allDays.push({ type: "flight", date: flightDay.date, data: flightDay });
    });

    // Add off days
    Object.values(offDayGroups).forEach((offDay) => {
      allDays.push({ type: "off", date: offDay.start, data: offDay });
    });

    // Sort all days by date
    allDays.sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      flightDays: flightDayGroups,
      offDays: offDayGroups,
      restPeriods,
      allDays,
      nonWorkEvents,
    };
  });
};

export default function HomeScreen() {
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
