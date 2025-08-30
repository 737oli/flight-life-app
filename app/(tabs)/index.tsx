import Colors from '@/constants/Colors';
import { CalendarEvent } from '@/types';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

//mock data for testing

interface FlightDay {
  date: Date;
  dutyPeriod?: CalendarEvent; // Flight day event with on-duty/off-duty times
  flights: CalendarEvent[];
  groundTimes: CalendarEvent[];
  turnarounds: CalendarEvent[];
  taxi?: CalendarEvent;
  standby: CalendarEvent[];
}

interface restPeriod {
  startDate: Date; 
  endDate: Date; 
  duration: number; 
  type: string;
  hotelInfo?: string;
  lastArrivalAirport?: string;
}

// Function to group events into flight days
const groupFlightDays = (events: CalendarEvent[]): any => {
  // Filter out work events, excluding 'other' types and those with 'click' in the title
  const workEvents = events.filter(event => event.calendar === 'Work' && event.type !== 'other' && !event.title.toLowerCase().includes('click'));

  // non-work events can be ignored for flight day grouping
  const nonWorkEvents = events.filter(event => event.calendar !== 'Work');

  //group work events by date
  const flightDayGroups: { [key: string]: FlightDay } = {};
  const offDayGroups: { [key: string]: CalendarEvent } = {};
  const restPeriods: restPeriod[] = [];
  const hotelPeriods: CalendarEvent[] = [];
  const standbyPeriods: CalendarEvent[] = [];


  workEvents.forEach(event => {
    const dateKey = event.start.toDateString();

    // Check for off days (LVEC or LVES in title) and group them separately
    if (event.title.toLowerCase().includes('LVEC') || event.title.toLowerCase().includes('LVES')) {
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
    if (
      event.type === 'duty' &&
      normalizedTitle.includes('flight day')
    ) {
      group.dutyPeriod = event;
    } else if (event.type === 'flight') {
      group.flights.push(event);
    } else if (event.type === 'duty' && event.title.toLowerCase().includes('grondtijd')) {
      group.groundTimes.push(event);
    } else if (event.type === 'duty' && event.title.toLowerCase().includes('omdraai')) {
      group.turnarounds.push(event);
    } else if (event.type === 'taxi') {
      group.taxi = event;
    } else if (event.type === 'layover' && event.title.toLowerCase().includes('hotel')) {
      hotelPeriods.push(event);
    } else if (event.type === 'duty' && event.title.toLowerCase().includes('sby_h')) {
      standbyPeriods.push(event);
    }
  });

  //sort flights and ground times within each flight day
  Object.values(flightDayGroups).forEach(group => {
    group.flights.sort((a, b) => a.start.getTime() - b.start.getTime());
    group.groundTimes.sort((a, b) => a.start.getTime() - b.start.getTime());
    group.turnarounds.sort((a, b) => a.start.getTime() - b.start.getTime());
  });

  // Calculate rest periods between flight days
  const sortedFlightDays = Object.values(flightDayGroups).sort((a, b) => a.date.getTime() - b.date.getTime());
  const minimumRestHours = 4; // Minimum rest period to consider

  for (let i = 0; i < sortedFlightDays.length - 1; i++) {
    const currentDay = sortedFlightDays[i];
    const nextDay = sortedFlightDays[i + 1];

    // Use duty period end time if available, otherwise use last flight end time
    const currentEnd = currentDay.dutyPeriod?.end || (currentDay.flights.length > 0 ? currentDay.flights[currentDay.flights.length - 1].end : currentDay.date);

    // Use duty period start time if available, otherwise use first flight start time
    const nextStart = nextDay.dutyPeriod?.start || (nextDay.flights.length > 0 ? nextDay.flights[0].start : nextDay.date);

    if (currentEnd && nextStart) {
      const restDurationMinutes = nextStart.getTime() - currentEnd.getTime();
      const restDurationHours = Math.floor(restDurationMinutes / (1000 * 60 * 60));

      //Only Show rest periods longer than X hours
      if (restDurationHours >= minimumRestHours) {
        const lastFlight = currentDay.flights[currentDay.flights.length - 1];
        const lastArrivalAirport = lastFlight?.details?.arrival || 'AMS';
        
        restPeriods.push({
          startDate: currentEnd,
          endDate: nextStart,
          duration: restDurationHours,
          type: 'rest',
          lastArrivalAirport,
        });
      }
    }
  }
}

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
    fontWeight: 'bold',
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
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  commuteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commuteLabel: {
    fontSize: 14,
    color: Colors.light.secondary,
  },
  commuteValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  trafficNote: {
    fontSize: 12,
    color: Colors.light.warning,
    marginTop: 8,
    fontStyle: 'italic',
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
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
