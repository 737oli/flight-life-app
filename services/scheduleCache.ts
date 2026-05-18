import AsyncStorage from "@react-native-async-storage/async-storage";

import type { NextSevenDaysSchedule } from "@/services/backendApi";

const SCHEDULE_CACHE_KEY = "flightLife.nextSevenDaysSchedule";

export type CachedSchedule = {
  cachedAt: string;
  schedule: NextSevenDaysSchedule;
};

export const saveScheduleCache = async (
  schedule: NextSevenDaysSchedule
): Promise<CachedSchedule> => {
  const cachedSchedule = {
    cachedAt: new Date().toISOString(),
    schedule,
  };
  await AsyncStorage.setItem(SCHEDULE_CACHE_KEY, JSON.stringify(cachedSchedule));
  return cachedSchedule;
};

export const loadScheduleCache = async (): Promise<CachedSchedule | null> => {
  const value = await AsyncStorage.getItem(SCHEDULE_CACHE_KEY);
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as CachedSchedule;
    if (!parsed.schedule || !Array.isArray(parsed.schedule.days)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};
