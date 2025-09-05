//this file will be used to fetch flight operations data from an API
import { FlightEvent } from "@/types";

// Mock flight ops data
const mockOpsData: FlightEvent['details'] = {
    ctot: "08:32Z",
    registration: "PH-EZX",
    prevLegArr: { status: "arrived", actualArrLocal: "07:45" },
    delay: { isDelayed: true, newDepLocal: "09:00", reason: "Weather" },
};

// Function to simulate fetching ops data for a flight
 export const getOpsDataForFlight = async (params: { flightNumber: string; date: Date; }) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // return mock data for now
    return mockOpsData;
}

// Function to refresh/mock new ops data (for testing purposes)
export const refreshMockOpsData = () => {
    // This function can be expanded to change the mock data to simulate different scenarios
    mockOpsData.delay = { isDelayed: Math.random() > 0.5, newDepLocal: "09:00", reason: "Weather" };
}

// set the opsdata of a flight event
export const setOpsDataForEvent = async (event: FlightEvent) => {
    if (event.type === "flight" && event.details?.flightNumber) {
        const opsData = await getOpsDataForFlight({ flightNumber: event.details.flightNumber, date: event.start });
        event.details = {
            registration: opsData.registration,
            ctot: opsData.ctot,
            prevLegArr: opsData.prevLegArr,
            delay: opsData.delay
        }
    }
    return event;
}