import AsyncStorage from "@react-native-async-storage/async-storage";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { clearOperationSnapshots } from "@/services/operationsSnapshotCache";
import { clearScheduleCache } from "@/services/scheduleCache";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  removeItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe("local cache clearing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("clears the cached 7-day schedule", async () => {
    await clearScheduleCache();

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith("flightLife.nextSevenDaysSchedule");
  });

  it("clears cached operation snapshots", async () => {
    await clearOperationSnapshots();

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith("flightLife.operationsSnapshots.v1");
  });
});
