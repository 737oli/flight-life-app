export interface FlightEvent {
  id: string;
  type: string; // flight
  title: string;
  startDate: Date;
  endDate: Date;
  description?: string;
  details?: {
    flightNumber?: string;
    aircraft?: string;
    hotel?: string;
    isOutstation?: boolean;
    isEarlyDeparture?: boolean;
    isLateReturn?: boolean;
    departureTime?: string; // time to get going (HH:MM)
    route?: string; // e.g., "BHX-AMS"
    departure?: string; // departure airport code
    arrival?: string; // arrival airport code
    // Flight Ops fields
    ctot?: string;            // "08:32Z"
    registration?: string;    // "PH-EZX"
    prevLegArr?: { status: "arrived"|"enroute"|"unknown"; actualArrLocal?: string };
    delay?: { isDelayed: boolean; newDepLocal?: string; reason?: string };
  };
}

export interface FlightDuty {
  id: string,
  type: string; // duty
  title: string,
  startDate: Date,
  endDate: Date
}

export interface RestPeriod {
  id: string,
  type: string; // rest
  title: string;
  location: string;
  description: string;
  startDate: Date; 
  endDate: Date; 
  duration: number; 
  hotelInfo?: string;
  lastArrivalAirport?: string;
  details: {
      hotel: "Radisson Hotel & Suites",
      isOutstation: true,
      arrival: "GDN",
    },
}

export interface GroundPeriod {
  id: string,
  type: string; // ground
  title: string;
  startDate: Date; 
  endDate: Date; 
  duration: number; 
  toWalk: boolean
  walkTime?: number; // minutes to walk to aircraft
}

export interface TaxiEvent {
    id: string,
    type: string; // taxi
    title: string,
    startDate: Date; 
    endDate: Date; 
}

export interface OffDay {
  id : string,
  type: string; // off
  title: string,
  startDate: Date; 
  endDate: Date; 
}
