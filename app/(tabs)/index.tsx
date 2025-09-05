import EventDetailModal from "@/components/EventDetailModal";
import { FlightDayCard } from "@/components/FlightDayCard";
import { OffDayCard } from "@/components/OffDayCard";
import { RestPeriodCard } from "@/components/RestPeriodCard";
import Colors from "@/constants/Colors";
import { fetchDutyDays, fetchFlightEvents, fetchGroundPeriods, fetchOffDays, fetchTaxiEvents } from "@/services/calenderParser";
import { FlightDay, FlightDuty, FlightEvent, GroundPeriod, OffDay, RestPeriod, TaxiEvent } from "@/types";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";


export interface GroupedResult {
  flights: FlightEvent[];
  taxi: TaxiEvent[];
  offDays: OffDay[];
  duties: FlightDuty[];
  groundPeriods: GroundPeriod[];
  all: (FlightEvent | TaxiEvent | OffDay | FlightDuty | GroundPeriod)[];
}

export const groupEvents = (allEvents: {
  flightEvents: FlightEvent[];
  taxiEvents: TaxiEvent[];
  offDays: OffDay[];
  dutyDays: FlightDuty[];
  groundPeriods: GroundPeriod[];
}): GroupedResult => {
  const flights = allEvents.flightEvents ?? [];
  const taxi = allEvents.taxiEvents ?? [];
  const offDays = allEvents.offDays ?? [];
  const duties = allEvents.dutyDays ?? [];
  const groundPeriods = allEvents.groundPeriods ?? [];

  // Flatten and sort all events by startDate
  const all = [...flights, ...taxi, ...offDays, ...duties].sort(
    (a, b) =>
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  return { flights, taxi, offDays, duties, all, groundPeriods };
};



export default function HomeScreen() {
  const [todayData, setTodayData] = useState<{ groupedData: GroupedResult }>({
    groupedData: {
      flights: [],
      taxi: [],
      offDays: [],
      duties: [],
      groundPeriods: [],
      all: [],
    },
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FlightEvent | null>(null);

  useEffect(() => {
    // In a real app, fetch and set events here
    const fetchData = async () => {
      const flightEvents = await fetchFlightEvents();
      const offDays = await fetchOffDays();
      const dutyDays = await fetchDutyDays();
      const taxiEvents = await fetchTaxiEvents();
      const groundPeriods = await fetchGroundPeriods();

      const allEvents = {
        flightEvents: flightEvents,
        offDays: offDays,
        dutyDays: dutyDays,
        taxiEvents: taxiEvents,
        groundPeriods: groundPeriods
      };

      const groupAllEvents = groupEvents(allEvents);

      setTodayData({ groupedData: groupAllEvents });
    };

    fetchData();
  }, []);

  const handleEventPress = (event: FlightEvent) => {
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
        {todayData.groupedData.length > 0 ? (
          <View>
            {todayData.groupedData.allDays.map((dayItem, index) => {
              if (dayItem.type === "off") {
                return (
                  <OffDayCard
                    key={`off-${dayItem.date.toDateString()}`}
                    event={dayItem.data as FlightEvent}
                    onPress={() =>
                      handleEventPress(dayItem.data as FlightEvent)
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
