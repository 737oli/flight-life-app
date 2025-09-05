// this service will handle all time formatting needs
import { FlightDuty, FlightEvent, GroundPeriod, OffDay, RestPeriod } from "@/types";

// e.g., converting to local time, formatting for display, etc.
export const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

// Format duration between two dates
export const formatDuration = (event: FlightEvent | OffDay | RestPeriod | GroundPeriod | FlightDuty) => {
    const durationMs = event.endDate.getTime() - event.startDate.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  // Format time as HH:MM
  export const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };
