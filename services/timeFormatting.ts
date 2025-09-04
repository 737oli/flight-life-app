// this service will handle all time formatting needs
import { CalendarEvent } from "@/types";

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
export const formatDuration = (event: CalendarEvent) => {
    const durationMs = event.end.getTime() - event.start.getTime();
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

  // Clean up and format description text
export const formatDescription = (description: string) => {
    // Description is already unescaped by the ICS parser, just format for display
    return description.trim();
  };
