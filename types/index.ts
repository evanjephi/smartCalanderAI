// types/index.ts
export interface User {
  id: string;
  name: string;
  email: string;
  availability: string; // Free form availability info
}

export interface TimeSlot {
  id: string;
  userId: string;
  date: Date;
  startTime: string; // HH:MM format
  endTime: string;
  title: string;
  attendees: string[]; // User IDs
  description?: string;
}

export interface ParsedBookingRequest {
  attendees: string[];
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  month: number;
  year: number;
  title: string;
}

export interface BookingResult {
  success: boolean;
  bookings: TimeSlot[];
  message: string;
}
