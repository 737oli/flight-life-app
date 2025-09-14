// This file will be used to parse calender events from a pdf or other sources
import { MOCK_DUTY_DAYS, MOCK_FLIGHT_EVENTS, MOCK_OFF_DAYS, MOCK_REST_PERIODS, MOCK_TAXI_EVENTS, MOCK_UP_GROUND_PERIODS } from "@/data/events";
import { FlightEvent, GroundPeriod } from "@/types";

// calculate the walk time to the aircraft, if in AMS
export const calculateWalkTime = (event: FlightEvent) : number => {
    const FIXED_WALK_TIME = 40; // minutes, to be replaced with actual walk time if available
    return FIXED_WALK_TIME;
}

const generateId = () : string => {
    let id = "id" + Math.random().toString(16).slice(2)

    return id
}

// create a GroundPeriod between 2 flights
export const createGroundPeriod = (nextFlight: FlightEvent, prevFlight: FlightEvent) : GroundPeriod => {
    // if first flight of the day check if in AMS otherwise return empty
        // calculate time in between flights
        const id = generateId()
        const startDate = new Date(prevFlight.endDate);
        const endDate = new Date(nextFlight.startDate);
        const type = "groundPeriod";
        const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60); // in minutes
        
        // check if in AMS, if yes set boolean to true
        const toWalk = (nextFlight?.details?.departure === "AMS");
        let title = undefined;

        // retract the walk time from the end time to get the time to start walking
        let walkTime: number | undefined = undefined;
        if (toWalk) {
            walkTime = endDate.setMinutes(endDate.getMinutes() - calculateWalkTime(nextFlight));;
            title = "GroundTime"
        } else {
            title = "TurnaroundTime"
        }

        return { id, type, title,startDate, endDate, toWalk, walkTime };
}

export const fetchGroundPeriods = async() => {
     await new Promise(resolve => setTimeout(resolve, 1));

    return MOCK_UP_GROUND_PERIODS;
}

export const fetchFlightEvents = async () => {
    await new Promise(resolve => setTimeout(resolve, 1));

    return MOCK_FLIGHT_EVENTS;
}

export const fetchTaxiEvents = async () => {
    await new Promise(resolve => setTimeout(resolve, 1));

    return MOCK_TAXI_EVENTS;
}

export const fetchOffDays = async () => {
    await new Promise(resolve => setTimeout(resolve, 1));

    return MOCK_OFF_DAYS;
}

export const fetchDutyDays = async () => {
    await new Promise(resolve => setTimeout(resolve, 1));

    return MOCK_DUTY_DAYS;
}

export const fetchRestPeriods = async () => {
    await new Promise(resolve => setTimeout(resolve, 1));

    return MOCK_REST_PERIODS;
}




