import Colors from '@/constants/Colors';
import { setOpsDataForEvent } from '@/services/operationsData';
import { formatDateOnly, formatDuration, formatTimeOnly, } from '@/services/timeFormatting';
import { isFlightDuty, isFlightEvent, isGroundPeriod, isTaxiEvent } from '@/services/typeGuards';
import { FlightDay, FlightDuty, FlightEvent, GroundPeriod, TaxiEvent } from '@/types';
import { ChevronDown, ChevronUp, Crown, Plane, User, Users } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FlightDayCardProps {
  date: Date;
  flights: FlightEvent[];
  onFlightPress?: (flight: FlightEvent) => void;
  flightDay?: FlightDay
  groundTimes: GroundPeriod[];
  taxi?: TaxiEvent;
  dutyPeriod: FlightDuty;
}

export function FlightDayCard({ date, flights, onFlightPress, flightDay, groundTimes, taxi, dutyPeriod }: FlightDayCardProps) {
    const [isExpanded, setExpanded] = React.useState(false);
    const [modalVisible, setModalVisible] = React.useState(false);
    const [flightOpsData, setFlightOpsData] = React.useState<Record<string, any>>({});
    const [selectedEvent, setSelectedEvent] = React.useState<
      FlightEvent | GroundPeriod | TaxiEvent | FlightDuty | null
    >(null);

  // Handle a click on a flight to show details
    const handleEventPress = (event: FlightEvent | GroundPeriod | TaxiEvent) => {
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

    // Extract aircraft type from event details
    const getAircraftType = (event: FlightEvent): string | undefined => {
    if (event.details?.aircraft) {
      return event.details.aircraft;
    }
    
    return undefined;
  };

    // Aircraft badge component
    const AircraftBadge = ({ aircraft }: { aircraft: string }) => (
        <View style={styles.aircraftBadge}>
        <Plane size={12} color={Colors.light.tint} style={styles.aircraftIcon} />
        <Text style={styles.aircraftText}>{aircraft}</Text>
        </View>
    );

    // Create a timeline of all events for the day
    const createTimeline = () => {
        const timeline: (FlightEvent | GroundPeriod | TaxiEvent)[] = [];
        let dutyStart: Date | null = null;
        let dutyEnd: Date | null = null;

        // If duty period exists, set start and end
        if (isFlightDuty(dutyPeriod)) {
            dutyStart = dutyPeriod.startDate;
            dutyEnd = dutyPeriod.endDate;
        }

        // Add taxi if exists
        if (isTaxiEvent(taxi)) {
            timeline.push(taxi);
        }

        // Add flights and ground times within duty period if defined
        flights.forEach(flight => {
          //check if not flightduty
            if ((!dutyStart || flight.startDate >= dutyStart) && (!dutyEnd || flight.endDate <= dutyEnd)) {
                timeline.push(flight);
            }
        });

        // Add ground times within duty period if defined
        groundTimes.forEach(ground => {
            if ((!dutyStart || ground.startDate >= dutyStart) && (!dutyEnd || ground.endDate <= dutyEnd)) {
                timeline.push(ground);
            }
        });

        // Sort timeline by start date
        timeline.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

        return timeline;
    }

    // Generate the timeline once
    const timeline = createTimeline();

    // Format a line of meta information for a flight or event
    const formatFlightMetaLine = (event: FlightEvent) : String => {
        const parts: string[] = [];

        // Add route
        if (event.details?.route) {
            const route = event.details.route.replace(" - ", "→");
            parts.push(route);
        }

        // Add times
        const timeRange = `${formatTimeOnly(event.startDate)} - ${formatTimeOnly(event.endDate)}`;
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

    // Fetch flight operations data when component mounts or date/flights change
    React.useEffect(() => {
        const fetchOpsData = async () => {
            const opsData: Record<string, any> = {};
            for (const flight of flights) {
                const updatedFlight = await setOpsDataForEvent(flight);
                opsData[flight.id] = updatedFlight.details;
            }
            setFlightOpsData(opsData);
        };

        fetchOpsData();
    }, [date, flights]);

    // Display crew members
    const CrewDisplay = ({ event}: { event: FlightEvent }) => {
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

    // Flight operations badges
    const FlightOpsBadges = ({ event }: { event: FlightEvent }) => {
        return (
          <View style={styles.opsBadgesContainer}>
            {event.details?.ctot && (
              <View style={styles.ctotBadgeSmall}>
                <Text style={styles.ctotBadgeText}>CTOT: {event.details.ctot}</Text>
              </View>
            )}
            {event.details?.registration && (
              <View style={styles.registrationBadge}>
                <Text style={styles.registrationText}>{event.details.registration}</Text>
              </View>
            )}
            {event.details?.delay?.isDelayed && event.details.delay.newDepLocal && (
              <View style={styles.delayBadgeSmall}>
                <Text style={styles.delayBadgeText}>Delayed to {event.details.delay.newDepLocal}</Text> 
              </View>
            )}
          </View>
        );
    };

    // Format ground time and turnaround info using event details if available
    const formatGroundTimeInfo = (event: GroundPeriod) => {
      //convert duration from minutes to hours and minutes
      const parts: string[] = [];
      parts.push(`Ground Time: ${formatDuration(event)}`);
      if (event.toWalk) {
        
        if (event.walkTime) {
          parts.push(`Walk: ${event.walkTime}m`);
          const leaveTime = new Date(event.startDate.getTime() - event.walkTime * 60000);
          parts.push(`Leave: ${formatTimeOnly(leaveTime)}`);
        }
        if (parts.length > 0) {
          return parts.join(' • ');
        }
      }

    return parts;
  };

    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.header]}
          onPress={handleDayPress}
          activeOpacity={0.7}
        >
          {/* Icon indicating flight day or off day */}
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Plane color={Colors.light.tint} size={20} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.dateText}>{formatDateOnly(date)}</Text>
              <Text style={styles.flightCount}>
                
                Duty Period • {formatTimeOnly(dutyPeriod.startDate)} {formatTimeOnly(dutyPeriod.endDate)}
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

         {/*Expanded flight list*/}
        {isExpanded && timeline.length > 0 && (
          <View style={styles.flightsContainer}>
            {timeline.map((item, index) => (
              <View key={`${item.id}-${index}`}>
                <TouchableOpacity
                  style={[
                    styles.flightItem,
                    isFlightEvent(item)
                      ? styles.flightItemFlight
                      : styles.flightItemOther,
                  ]}
                  onPress={() => handleEventPress(item)}
                  activeOpacity={0.7}
                >

                  {/* Taxi event display */}
                  {isTaxiEvent(item) && (
                    <>
                      <View style={styles.groundHeader}>
                        <Text style={styles.flightTitle}>
                          Taxi
                        </Text>
                        <Text style={styles.groundTitle}>
                          Pickup: {formatTimeOnly(item.startDate)} • Duration: {formatDuration(item)}
                        </Text>
                      </View>
                    </>
                  )}

                  {/* Ground period display */}
                  {isGroundPeriod(item) && (
                    <>
                      <View style={styles.groundHeader}>
                        <Text style={styles.groundTitle}>
                          {formatGroundTimeInfo(item)}
                        </Text>
                      </View>
                    </>
                  )}

                  {/* Flight event display */}
                  {isFlightEvent(item) && (
                    <>
                      <View style={styles.flightHeader}>
                        <Text style={styles.flightTitle}>
                          {item.title}
                        </Text>
                      </View>

                      <View style={styles.flightMetaLine}>
                        <Text style={styles.flightMeta}>
                          {formatFlightMetaLine(item)}
                        </Text>
                        <View style={styles.badgesRow}>
                          {
                            (item.details?.aircraft) ? (<AircraftBadge aircraft={getAircraftType(item)!} />) : 
                            (<AircraftBadge aircraft="No Type" />)
                          }
                        </View>
                      </View>

                      <FlightOpsBadges event={item} />

                      <CrewDisplay event={item} />
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

