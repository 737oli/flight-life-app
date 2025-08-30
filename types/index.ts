export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
  calendar: 'Work';
  type?: 'flight' | 'duty' | 'layover' |'other' | 'taxi';
  source?: 'demo';
  calendarId?: string;
  details?: {
    flightNumber?: string;
    aircraft?: string;
    hotel?: string;
    isOutstation?: boolean;
    isEarlyDeparture?: boolean;
    isLateReturn?: boolean;
    walkTime?: number; // minutes to walk to aircraft
    departureTime?: string; // time to get going (HH:MM)
    route?: string; // e.g., "BHX-AMS"
    departure?: string; // departure airport code
    arrival?: string; // arrival airport code
    groundTime?: string; // ground time duration (HH:MM)
    turnaroundTime?: string; // turnaround time duration (HH:MM)
    // Flight Ops fields
    ctot?: string;            // "08:32Z"
    registration?: string;    // "PH-EZX"
    prevLegArr?: { status: "arrived"|"enroute"|"unknown"; actualArrLocal?: string };
    delay?: { isDelayed: boolean; newDepLocal?: string; reason?: string };
  };
}

