import Colors from '@/constants/Colors';
import { Moon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RestPeriodCardProps {
  startDate: Date;
  endDate: Date;
  duration: number; // in hours
  type?: string; // 'rest' or 'hotel'
  isOutstation?: boolean;
  outstationCode?: string;
  hotelInfo?: string; // Raw hotel information from ICS
  lastArrivalAirport?: string; // For determining if it's outstation
  onPress?: () => void;
}

export function RestPeriodCard({ 
  startDate, 
  endDate, 
  duration, 
  type = 'rest', 
  isOutstation, 
  outstationCode, 
  hotelInfo,
  lastArrivalAirport,
  onPress 
}: RestPeriodCardProps) {
  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDuration = (hours: number) => {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    const minutes = Math.floor((hours % 1) * 60);

    if (days > 0) {
      if (remainingHours > 0) {
        return `${days}d ${remainingHours}h`;
      }
      return `${days}d`;
    } else if (remainingHours > 0) {
      if (minutes > 0) {
        return `${remainingHours}h ${minutes}m`;
      }
      return `${remainingHours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  const getRestType = () => {
    if (duration >= 24) {
      return { icon: Moon, text: 'Long Rest Period', color: Colors.light.success };
    } else if (duration >= 12) {
      return { icon: Moon, text: 'Medium Rest Period', color: Colors.light.warning };
    } else {
      return { icon: Moon, text: 'Short Rest Period', color: Colors.light.danger };
    }
  };

  const restType = getRestType();
  const Icon = restType.icon;

  const CardComponent = onPress ? TouchableOpacity : View;
  
  return (
    <View style={styles.container}>
      <CardComponent 
        style={styles.content} 
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <View style={styles.iconContainer}>
          <Icon color={restType.color} size={16} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.restTypeText, { color: restType.color }]}>
            {restType.text}
          </Text>
          <Text style={styles.durationText}>
            {formatDuration(duration)} rest
          </Text>
          <Text style={styles.timeText}>
            {formatDateTime(startDate)} → {formatDateTime(endDate)}
          </Text>
          {/* Outstation and Hotel Info */}
          {(isOutstation || hotelInfo) && (
            <View style={styles.badgeContainer}>
              {isOutstation && outstationCode && (
                <Text style={styles.outstationText}>Outstation • {outstationCode}</Text>
              )}
              {hotelInfo && hotelInfo.trim().length > 0 && (
                <Text style={styles.hotelText}>• Hotel</Text>
              )}
            </View>
          )}
          {onPress && (
            <Text style={styles.tapHint}>Tap for details</Text>
          )}
        </View>
      </CardComponent>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.border,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  restTypeText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 11,
    color: Colors.light.secondary,
  },
  badgeContainer: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  outstationText: {
    fontSize: 10,
    color: Colors.light.secondary,
    fontWeight: '500',
  },
  hotelText: {
    fontSize: 10,
    color: Colors.light.secondary,
    fontWeight: '500',
    marginLeft: 2,
  },
  tapHint: {
    fontSize: 10,
    color: Colors.light.tint,
    fontStyle: 'italic',
    marginTop: 4,
  },
});