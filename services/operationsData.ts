//this file will be used to fetch flight operations data from an API
import { MOCK_OPS_DATA, MOCK_UP_AIRCRAFT } from "@/data/events";
import { FlightEvent } from "@/types";

//create mockup data for aircraft with an aircraft type of on of these [E75, E90, E295] and registrations starting with PH-


// Function to simulate fetching ops data for a flight
 export const getOpsDataForFlight = async (params: { flightNumber: string; date: Date; }) : Promise<FlightEvent["details"]> => {
    const opsData = MOCK_OPS_DATA

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return opsData;
}

// set the opsdata of a flight event
export const setOpsDataForEvent = async (event: FlightEvent) => {
    if (event.type === "flight" && event.details?.flightNumber) {
        // take a random aircraft from the list above
        const randomAircraft = MOCK_UP_AIRCRAFT[Math.floor(Math.random() * MOCK_UP_AIRCRAFT.length)];
        const randomReg = randomAircraft.registrations[Math.floor(Math.random() * randomAircraft.registrations.length)];
        const randomType = randomAircraft.type;

        //fetch ops data
        const opsData = await getOpsDataForFlight({ flightNumber: event.details.flightNumber, date: event.startDate });

        //if opsData is valid, set it to the event details
        if (opsData) {
            event.details = {
                registration: randomReg,
                ctot: opsData.ctot,
                prevLegArr: opsData.prevLegArr,
                delay: opsData.delay,
                aircraft: randomType,
                ...event.details, // keep existing details
            }
        }
    }
    return event;
}