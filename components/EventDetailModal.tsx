import Colors from '@/constants/Colors';
import { getOpsDataForFlight, refreshMockOpsData } from '@/services/operationsData';
import { formatDateTime, formatDescription, formatDuration } from '@/services/timeFormatting';
import { CalendarEvent } from '@/types';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  DoorOpen,
  MapPin,
  Navigation,
  ParkingCircle,
  Plane,
  RefreshCw,
  X,
  Zap
} from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Modal, SafeAreaView, ScrollView,
  StyleSheet,
  Text, TouchableOpacity, View
} from 'react-native';

interface EventDetailModalProps {
  visible: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
}

export default function EventDetailModal({ visible, event, onClose }: EventDetailModalProps) {
  const [flightOps, setFlightOps] = React.useState<any>(null);
  const [loadingOps, setLoadingOps] = React.useState(false);

  // Load flight ops data when event changes
  const loadFlightOps = React.useCallback(async () => {
    if (!event?.details?.flightNumber || !event?.details?.departure || !event?.details?.arrival) {
      return;
    }

    setLoadingOps(true);

    // Fetch ops data
    try {
      const ops = await getOpsDataForFlight(
        { flightNumber: event.details.flightNumber, date: event.start }
      );
      setFlightOps(ops);
    } catch (error) {
      console.error("Error loading flight ops:", error);
      setFlightOps(null);
    } finally {
      setLoadingOps(false);
    }
  }, [event]);

  // Refresh/mock new ops data
  const handleFreshOps = React.useCallback(async() => {
    refreshMockOpsData();
    await loadFlightOps();
  }, [loadFlightOps]);

  // Check if flight is departing within 3 hours
  const isDepartingSoon = (start: string | Date) => {
    const now = new Date();
    const eventStart = new Date(start);
    const timeDiff = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60); // in hours
    return timeDiff <= 3;
  };

  // When modal becomes visible for a flight event within 3 hours, load ops data
  React.useEffect(() => {
    if (visible && event?.type === 'flight' && event.details?.flightNumber && isDepartingSoon(event.start)) {
        loadFlightOps();
    } else {
      //reset ops data if not a flight or not departing soon
      setFlightOps(null);
      setLoadingOps(false);
    }
  }, [visible, event, loadFlightOps]);

  //reset ops data when modal is closed
  React.useEffect(() => {
    if (!visible) {
      setFlightOps(null);
      setLoadingOps(false);
    }
  }, [visible]);

  // Render nothing if not visible or no event
  if (!event) return null;

  // Determine icon based on event type
   const getIcon = () => {
    switch (event.type) {
      case 'flight': return Plane;
      case 'layover': return MapPin;
      default: return Clock;
    }
  };

  // Determine calendar color
  const getCalendarColor = () => {
    switch (event.calendar) {
      case 'Work': return Colors.light.tint;
      default: return Colors.light.secondary;
    }
  };

  // Check if the previous leg has arrived or enroute
  const formatPrevLegStatus = (prevLegArr: any) => {
    if (!prevLegArr) return 'No data';
    
    switch (prevLegArr.status) {
      case 'arrived':
        return `Arrived ${prevLegArr.actualArrLocal || 'recently'}`;
      case 'enroute':
        return `ETA ${prevLegArr.actualArrLocal || 'unknown'}`;
      default:
        return 'No data';
    }
  };
  
  const formatWalkTime = (walkMins: number) => {
    return `Start walking in ${walkMins} min`;
  };

  const Icon = getIcon();


    return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <X size={24} color={Colors.light.text} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              <Icon color={getCalendarColor()} size={24} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{event.title}</Text>
              <Text style={[styles.calendar, { color: getCalendarColor() }]}>
                {event.calendar}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time & Duration</Text>
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>Start:</Text>
              <Text style={styles.timeValue}>{formatDateTime(event.start)}</Text>
            </View>
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>End:</Text>
              <Text style={styles.timeValue}>{formatDateTime(event.end)}</Text>
            </View>
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>Duration:</Text>
              <Text style={styles.timeValue}>{formatDuration(event)}</Text>
            </View>
          </View>

          {event.location && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.locationText}>{event.location}</Text>
            </View>
          )}



          {event.type === 'flight' && event.details?.flightNumber && isDepartingSoon(event.start) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Flight Ops (beta)</Text>
                <TouchableOpacity 
                  onPress={handleFreshOps}
                  style={styles.refreshButton}
                  disabled={loadingOps}
                >
                  {loadingOps ? (
                    <ActivityIndicator size="small" color={Colors.light.tint} />
                  ) : (
                    <RefreshCw size={16} color={Colors.light.tint} />
                  )}
                </TouchableOpacity>
              </View>
              
              {loadingOps? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors.light.secondary} />
                  <Text style={styles.loadingText}>Loading ops data...</Text>
                </View>
              ) : flightOps ? (
                <View style={styles.opsContainer}>
                  {/* Real data indicator */}
                  {flightOps?.isRealData && (
                    <View style={styles.realDataBadge}>
                      <Text style={styles.realDataText}>Live from Schiphol</Text>
                    </View>
                  )}
                  
                  {/* Gate */}
                  {flightOps.gate && (
                    <View style={styles.opsRow}>
                      <View style={styles.opsIconContainer}>
                        <DoorOpen size={16} color={Colors.light.tint} />
                      </View>
                      <View style={styles.opsContent}>
                        <Text style={styles.opsLabel}>Gate:</Text>
                        <View style={styles.gateContainer}>
                          <View style={[styles.gateBadge, flightOps.gateChanged && styles.gateChangedBadge]}>
                            <Text style={[styles.gateText, flightOps.gateChanged && styles.gateChangedText]}>
                              {flightOps.gate}
                            </Text>
                          </View>
                          {flightOps.gateChanged && (
                            <Text style={styles.gateChangedLabel}>CHANGED</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  )}
                  
                  {/* Scheduled vs Actual Departure */}
                  {(flightOps.scheduledDeparture || flightOps.actualDeparture || flightOps.estimatedDeparture) && (
                    <View style={styles.opsRow}>
                      <View style={styles.opsIconContainer}>
                        <Clock size={16} color={Colors.light.secondary} />
                      </View>
                      <View style={styles.opsContent}>
                        <Text style={styles.opsLabel}>Departure:</Text>
                        {flightOps.scheduledDeparture && (
                          <Text style={styles.opsValue}>Scheduled: {flightOps.scheduledDeparture}</Text>
                        )}
                        {(flightOps.actualDeparture || flightOps.estimatedDeparture) && (
                          <Text style={[styles.opsValue, (flightOps.delay?.isDelayed || flightOps?.isRealData) && styles.delayedTime]}>
                            {flightOps.actualDeparture ? 'Actual: ' : 'Estimated: '}
                            {flightOps.actualDeparture || flightOps.estimatedDeparture}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                  
                  {/* Aircraft Stand */}
                  {flightOps.stand && (
                    <View style={styles.opsRow}>
                      <View style={styles.opsIconContainer}>
                        <ParkingCircle size={16} color={Colors.light.secondary} />
                      </View>
                      <View style={styles.opsContent}>
                        <Text style={styles.opsLabel}>Stand:</Text>
                        <Text style={styles.opsValueBold}>{flightOps.stand}</Text>
                      </View>
                    </View>
                  )}
                  {/* CTOT */}
                  <View style={styles.opsRow}>
                    <View style={styles.opsIconContainer}>
                      <Zap size={16} color={Colors.light.warning} />
                    </View>
                    <View style={styles.opsContent}>
                      <Text style={styles.opsLabel}>CTOT:</Text>
                      {flightOps.ctot ? (
                        <View style={styles.ctotBadge}>
                          <Text style={styles.ctotText}>{flightOps.ctot}</Text>
                        </View>
                      ) : (
                        <Text style={styles.opsValue}>—</Text>
                      )}
                    </View>
                  </View>
                  
                  {/* Aircraft Registration */}
                  <View style={styles.opsRow}>
                    <View style={styles.opsIconContainer}>
                      <Plane size={16} color={Colors.light.tint} />
                    </View>
                    <View style={styles.opsContent}>
                      <Text style={styles.opsLabel}>Aircraft:</Text>
                      <Text style={styles.opsValueBold}>{flightOps.registration}</Text>
                      <Text style={styles.opsSubtext}>assigned</Text>
                    </View>
                  </View>
                  
                  {/* Previous Leg */}
                  <View style={styles.opsRow}>
                    <View style={styles.opsIconContainer}>
                      <Navigation size={16} color={Colors.light.secondary} />
                    </View>
                    <View style={styles.opsContent}>
                      <Text style={styles.opsLabel}>Previous leg:</Text>
                      <Text style={styles.opsValue}>{formatPrevLegStatus(flightOps.prevLegArr)}</Text>
                    </View>
                  </View>
                  
                  {/* Walk Time */}
                  <View style={styles.opsRow}>
                    <View style={styles.opsIconContainer}>
                      <MapPin size={16} color={Colors.light.secondary} />
                    </View>
                    <View style={styles.opsContent}>
                      <Text style={styles.opsLabel}>Walk:</Text>
                      <Text style={styles.opsValue}>{formatWalkTime(flightOps.walkMins)}</Text>
                    </View>
                  </View>
                  
                  {/* Delay Status */}
                  <View style={styles.opsRow}>
                    <View style={styles.opsIconContainer}>
                      {flightOps.delay?.isDelayed ? (
                        <AlertTriangle size={16} color={Colors.light.danger} />
                      ) : (
                        <CheckCircle size={16} color={Colors.light.success} />
                      )}
                    </View>
                    <View style={styles.opsContent}>
                      <Text style={styles.opsLabel}>Status:</Text>
                      {flightOps.delay?.isDelayed ? (
                        <View>
                          <View style={styles.delayBadge}>
                            <Text style={styles.delayText}>DELAYED</Text>
                          </View>
                          <Text style={styles.opsValue}>New dep {flightOps.delay.newDepLocal}</Text>
                          {flightOps.delay.reason && (
                            <Text style={styles.opsSubtext}>{flightOps.delay.reason}</Text>
                          )}
                        </View>
                      ) : (
                        <Text style={[styles.opsValue, { color: Colors.light.success }]}>On time</Text>
                      )}
                    </View>
                  </View>
                </View>
              ) : null}
              
              <Text style={styles.mockDataCaption}>
                {flightOps?.isRealData ? 'Live data + mock supplements' : 'Mock data'}
              </Text>
            </View>
          )}
          
          {event.type === 'flight' && event.details?.flightNumber && !isDepartingSoon(event.start) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Flight Ops</Text>
              <Text style={styles.opsNotAvailable}>
                Live ops data available 3 hours before departure
              </Text>
            </View>
          )}
          
          {event.details && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Flight Details</Text>
              {event.details.flightNumber && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Flight Number:</Text>
                  <Text style={styles.detailValue}>{event.details.flightNumber}</Text>
                </View>
              )}
              {event.details.aircraft && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Aircraft:</Text>
                  <Text style={styles.detailValue}>{event.details.aircraft}</Text>
                </View>
              )}
              {event.details.hotel && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Hotel:</Text>
                  <Text style={styles.detailValue}>{event.details.hotel}</Text>
                </View>
              )}
              {event.details.isEarlyDeparture && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Early Departure</Text>
                </View>
              )}
              {event.details.isLateReturn && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Late Return</Text>
                </View>
              )}
              {event.details.isOutstation && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Outstation</Text>
                </View>
              )}
            </View>
          )}

          {event.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.descriptionText}>
                {formatDescription(event.description)}
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  headerContent: {
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  calendar: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: Colors.light.secondary,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  locationText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.light.secondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  badge: {
    backgroundColor: Colors.light.tint + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.tint,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshButton: {
    padding: 4,
    borderRadius: 6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.secondary,
    marginLeft: 8,
  },
  opsContainer: {
    gap: 12,
  },
  opsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  opsIconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  opsContent: {
    flex: 1,
  },
  opsLabel: {
    fontSize: 13,
    color: Colors.light.secondary,
    marginBottom: 2,
  },
  opsValue: {
    fontSize: 14,
    color: Colors.light.text,
  },
  opsValueBold: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  opsSubtext: {
    fontSize: 12,
    color: Colors.light.secondary,
    marginTop: 1,
  },
  ctotBadge: {
    backgroundColor: '#8B5CF6' + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  ctotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  delayBadge: {
    backgroundColor: Colors.light.danger + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  delayText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.danger,
  },
  mockDataCaption: {
    fontSize: 11,
    color: Colors.light.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
  },
  realDataBadge: {
    backgroundColor: Colors.light.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  realDataText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.success,
  },
  gateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gateBadge: {
    backgroundColor: Colors.light.tint + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gateChangedBadge: {
    backgroundColor: Colors.light.warning + '20',
    borderWidth: 1,
    borderColor: Colors.light.warning,
  },
  gateText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.tint,
  },
  gateChangedText: {
    color: Colors.light.warning,
  },
  gateChangedLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.warning,
    backgroundColor: Colors.light.warning + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  delayedTime: {
    color: Colors.light.danger,
    fontWeight: '600',
  },
  opsNotAvailable: {
    fontSize: 14,
    color: Colors.light.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
});