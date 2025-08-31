import Colors from '@/constants/Colors';
import { CalendarEvent, FlightDay } from '@/types';
import { ChevronDown, ChevronUp, Crown, Plane, User, Users } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';


interface FlightDayCardProps {
  date: Date;
  flights: CalendarEvent[];
  onFlightPress?: (flight: CalendarEvent) => void;
  flightDay?: FlightDay;
}

export function FlightDayCard({ date, flights, onFlightPress, flightDay }: FlightDayCardProps) {
    const [isExpanded, setExpanded] = React.useState(false);
    const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null);
    const [modalVisible, setModalVisible] = React.useState(false);
    const [flightOpsData, setFlightOpsData] = React.useState<Record<string, any>>({});

    // format date as "Monday, January 1"
    const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    };

    // format time as "14:30"
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        });
    };

    // format duration
    const formatDuration = (start: Date, end: Date) => {
        const durationMs = end.getTime() - start.getTime();
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

  // Handle a click on a flight to show details
    const handleEventPress = (event: CalendarEvent) => {
        if (onFlightPress) {
            onFlightPress(event);
        } else {
            setSelectedEvent(event);
            setModalVisible(true);
        };
    };

    // If the flight day has a duty period, prioritize that
    const handleDayPress = () => {
        if (flightDay?.dutyPeriod) {
            onFlightPress?.(flightDay.dutyPeriod);
        } else if (flights.length > 0) {
            onFlightPress?.(flights[0]);
        }
    };

    // Handle toggle expand/collapse
    const handleToggleExpand = () => {
        setExpanded(!isExpanded);
    };

    // get the duty times
    const getDutyTimes = () => {
        if (flightDay?.dutyPeriod) {
        return `${formatTime(flightDay.dutyPeriod.start)} - ${formatTime(flightDay.dutyPeriod.end)}`;
        }
        if (flights.length > 0) {
        return `${formatTime(flights[0].start)} - ${formatTime(flights[flights.length - 1].end)}`;
        }
        return '';
    };


    // Determine flight day type
    const getFlightDayType = () => {
        if (flightDay?.dutyPeriod) {
            const title = flightDay.dutyPeriod.title.toLowerCase();
            if (title.includes('tstr') || title.includes("tsdoh")) {
                return "Simulator Session";
            } else if (title.includes('sby')) {
                return "Standby Duty";
            } else {
                return "Flight Day";
            }
        }
    }
    const AircraftBadge = ({ aircraft }: { aircraft: string }) => (
        <View style={styles.aircraftBadge}>
        <Plane size={12} color={Colors.light.tint} style={styles.aircraftIcon} />
        <Text style={styles.aircraftText}>{aircraft}</Text>
        </View>
    );

    // Create a timeline of all events for the day
    const createTimeline = () => {
        const timeline: { event: CalendarEvent; type: 'taxi' | 'flight' | 'ground' | 'turnaround' }[] = [];

        //Add Taxi if present
        if (flightDay?.taxi) {
            timeline.push({ event: flightDay.taxi, type: 'taxi' });
        }

        // Add flights with ground times and turnarounds in between
        flights.forEach((flight, index) => {
            timeline.push({ event: flight, type: 'flight' });

            if (index < flights.length - 1) {
                // Find ground time between this flight and the next
                const nextFlight = flights[index + 1];
                const groundTime = flightDay?.groundTimes.find(gt => gt.start >= flight.end && gt.end <= nextFlight.start);
                const turnaround = flightDay?.turnarounds.find(tr => tr.start >= flight.end && tr.end <= nextFlight.start);

                if (groundTime) {
                    timeline.push({ event: groundTime, type: 'ground' });
                } else if (turnaround) {
                    timeline.push({ event: turnaround, type: 'turnaround' });
                }
            }
        });

        return timeline;
    }

    // Generate the timeline once
    const timeline = createTimeline();

    // Format ground time and turnaround info
    const formatGroundAndTurnaroundInfo = (event: CalendarEvent) : String => {
        if (event.title.toLowerCase().includes('grondtijd')) {
            const parts: string[] = [];
        
            if (event.details?.groundTime) {
                parts.push(`Ground Time: ${event.details.groundTime}`);
            }
            if (event.details?.walkTime) {
                parts.push(`Walk Time: ${event.details.walkTime}`);
            }
            if (event.details?.departureTime) {
                parts.push(`Dep Time: ${event.details.departureTime}`);
            }
            if (parts.length > 0) {
                return parts.join(' | ');
            }
        }
        if (event.title.toLowerCase().includes('omdraai')) {
            if (event.details?.turnaroundTime) {
                return event.details.turnaroundTime;
            } 
        }
        return event.title;
    }

    // Format a line of meta information for a flight or event
    const formatFlightMetaLine = (event: CalendarEvent) : String => {
        const parts: string[] = [];

        // Add route
        if (event.details?.route) {
            const route = event.details.route.replace(" - ", "→");
            parts.push(route);
        }

        // Add times
        const timeRange = `${formatTime(event.start)} - ${formatTime(event.end)}`;
        parts.push(timeRange);

        return parts.join(' | ');
    };

    // Parse crew members from event description
    const parseCrewMembersInfo = (description: string) => {
        if (!description) return [];

        const lines = description.split(/\\n|\n/).filter(line => line.trim());
        const crewMembers: { name: string; rank: 'CPT' | 'CS' | 'CM' }[] = [];

        lines.forEach((line, index) => {
            const match = line.match(/(.+?)\s*\(([^)]+)\)/);
            if (match) {
                const name = match[1].trim();
                const rankText = match[2].trim().toUpperCase();
                
                let rank: 'CPT' | 'CS' | 'CM' = 'CM';
                if (rankText.includes('CPT')) {
                    rank = 'CPT';
                } else if (rankText.includes('CS')) {
                    rank = 'CS';
                } else if (rankText.includes('CA')) {
                    rank = 'CM'; // CA2/3 are cabin crew members
                }
                crewMembers.push({ name, rank });
            }
        });
        
        return crewMembers;
    }

    // Create crew member icon based on rank
    const getCrewIcon = (rank: 'CPT' | 'CS' | 'CM') => {
    switch (rank) {
      case 'CPT': return Crown;
      case 'CS': return User;
      case 'CM': return Users;
    }
  };

    // Create crew member icon color based on rank  
    const getCrewIconColor = (rank: 'CPT' | 'CS' | 'CM') => {
        switch (rank) {
        case 'CPT': return Colors.light.warning; // Gold for Captain
        case 'CS': return Colors.light.tint;     // Blue for Senior Cabin Attendant
        case 'CM': return Colors.light.secondary; // Gray for Cabin Member
        }
    };

    //ops Data

    // Display crew members
    const CrewDisplay = ({ event}: { event: CalendarEvent }) => {
        const crewMembers = parseCrewMembersInfo(event.description || '');

        if (crewMembers.length === 0) return null;

        return (
          <View style={styles.crewContainer}>
            <Text style={styles.crewTitle}>Crew:</Text>
            {crewMembers.map((member, index) => {
              const CrewIcon = getCrewIcon(member.rank);
              return (
                <View key={index} style={styles.crewMember}>
                  <CrewIcon
                    size={14}
                    color={getCrewIconColor(member.rank)}
                    style={styles.crewIcon}
                  />
                  <Text style={styles.crewName}>{member.name}</Text>
                  <Text style={styles.crewRank}>({member.rank})</Text>
                </View>
              );
            })}
          </View>
        );
    };

    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.header]}
          onPress={handleDayPress}
          activeOpacity={0.7}
        >
          <View style={styles.headerLeft}>
            <View style={styles.headerText}>
              <Text style={styles.dateText}>{formatDate(date)}</Text>
              <Text style={styles.flightCount}>
                {getFlightDayType()} • {getDutyTimes()}
              </Text>
              <Text style={styles.flightSubtext}>
                {flights.length} flight{flights.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
          {(flights.length > 1 || timeline.length > flights.length) && (
            <TouchableOpacity
              style={styles.expandIcon}
              onPress={handleToggleExpand}
              activeOpacity={0.7}
            >
              {isExpanded ? (
                <ChevronUp color={Colors.light.secondary} size={20} />
              ) : (
                <ChevronDown color={Colors.light.secondary} size={20} />
              )}
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {isExpanded && timeline.length > 0 && (
          <View style={styles.flightsContainer}>
            {timeline.map((item, index) => (
              <View key={`${item.event.id}-${index}`}>
                <TouchableOpacity
                  style={[
                    styles.flightItem,
                    item.type === "flight"
                      ? styles.flightItemFlight
                      : styles.flightItemOther,
                  ]}
                  onPress={() => handleEventPress(item.event)}
                  activeOpacity={0.7}
                >
                  {item.type === "flight" ? (
                    <>
                      <View style={styles.flightHeader}>
                        <Text style={styles.flightTitle}>
                          {item.event.details?.flightNumber || item.event.title}
                        </Text>
                      </View>

                      <View style={styles.flightMetaLine}>
                        <Text style={styles.flightMeta}>
                          {formatFlightMetaLine(item.event)}
                        </Text>

                      </View>

                      {item.event.location && (
                        <Text style={styles.flightLocation}>
                          {item.event.location}
                        </Text>
                      )}

                      <CrewDisplay event={item.event} />
                    </>
                  ) : (
                    <>
                      <View style={styles.groundHeader}>
                        <Text style={styles.groundTitle}>
                          {item.type === "taxi"
                            ? "Taxi"
                            : formatGroundAndTurnaroundInfo(item.event)}
                        </Text>
                      </View>

                      {item.type === "taxi" && (
                        <Text style={styles.taxiInfo}>
                          Pickup: {formatTime(item.event.start)} • Duration:{" "}
                          {formatDuration(item.event.start, item.event.end)}
                        </Text>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

      </View>
    );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.tint + '08',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  flightCount: {
    fontSize: 12,
    color: Colors.light.secondary,
  },
  expandIcon: {
    padding: 4,
  },
  flightsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  flightItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    marginTop: 8,
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },

  flightTime: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.tint,
  },
  flightLocation: {
    fontSize: 12,
    color: Colors.light.secondary,
    marginBottom: 2,
  },
  flightDetails: {
    fontSize: 11,
    color: Colors.light.secondary,
  },
  restPeriod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 12,
  },
  restLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  restContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingVertical: 4,
  },
  restText: {
    fontSize: 11,
    color: Colors.light.secondary,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  flightSubtext: {
    fontSize: 10,
    color: Colors.light.secondary,
    marginTop: 2,
  },
  flightItemFlight: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.tint,
  },
  flightItemOther: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.secondary,
    backgroundColor: Colors.light.background + '80',
  },
  flightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  flightMetaLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  flightMeta: {
    fontSize: 13,
    color: Colors.light.secondary,
    flex: 1,
  },
  aircraftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.tint + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  aircraftIcon: {
    marginRight: 4,
  },
  aircraftText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  groundHeader: {
    marginBottom: 4,
  },
  groundTitle: {
    fontSize: 13,
    fontWeight: '400',
    fontStyle: 'italic',
    color: Colors.light.secondary,
  },
  headerOffDay: {
    backgroundColor: Colors.light.success + '08',
  },
  iconContainerOffDay: {
    backgroundColor: Colors.light.success + '15',
    borderRadius: 8,
    padding: 4,
  },

  taxiInfo: {
    fontSize: 11,
    color: Colors.light.secondary,
    fontStyle: 'italic',
  },
  crewContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  crewTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  crewMember: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  crewIcon: {
    marginRight: 6,
  },
  crewName: {
    fontSize: 11,
    color: Colors.light.text,
    flex: 1,
  },
  crewRank: {
    fontSize: 10,
    color: Colors.light.secondary,
    fontWeight: '500',
  },
  opsBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  delayBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.danger + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  delayBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.danger,
  },
  ctotBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6' + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ctotBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  registrationBadge: {
    backgroundColor: Colors.light.secondary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  registrationText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.secondary,
  },
  badgeIcon: {
    marginRight: 3,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  realDataBadgeSmall: {
    backgroundColor: Colors.light.success + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  realDataBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.success,
  },
  gateBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.tint + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  gateChangedBadgeSmall: {
    backgroundColor: Colors.light.warning + '20',
    borderWidth: 1,
    borderColor: Colors.light.warning,
  },
  gateBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  gateChangedBadgeText: {
    color: Colors.light.warning,
  },
  gateChangedIndicator: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.warning,
    marginLeft: 2,
  },
  standBadge: {
    backgroundColor: Colors.light.secondary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  standText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.secondary,
  },
});

