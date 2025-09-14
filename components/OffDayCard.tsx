import Colors from '@/constants/Colors';
import { formatDateOnly } from '@/services/timeFormatting';
import { OffDay } from '@/types';
import { Home } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface OffDayCardProps {
  event: OffDay;
  onPress?: () => void;
}

export function OffDayCard({ event, onPress }: OffDayCardProps) {
  // Determine off day type based on title keywords
  const getOffDayType = () => {
    const title = event.title.toLowerCase();
    if (title.includes('lvec')) {
      return 'Weekend Off';
    }
    if (title.includes('lves')) {
      return 'Requested Off';
    }
    return 'Off Day';
  };

  // Calculate duration in hours or days
  const getDuration = () => {
    const durationMs = event.endDate.getTime() - event.startDate.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 1) {
      return `${days} days`;
    } else if (hours > 24) {
      return `${Math.floor(hours / 24)} day`;
    } else {
      return `${hours}h`;
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Home color={Colors.light.success} size={20} />
        </View>
        <View style={styles.content}>
          <Text style={styles.dateText}>{formatDateOnly(event.startDate)}</Text>
          <Text style={styles.typeText}>{getOffDayType()}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>OFF</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.success + '10',
    borderRadius: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: Colors.light.success + '30',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.success,
    marginBottom: 2,
  },
  durationText: {
    fontSize: 12,
    color: Colors.light.secondary,
  },
  badge: {
    backgroundColor: Colors.light.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
});