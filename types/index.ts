// types/index.ts
export interface User {
  id: string;
  name: string;
  email: string;
  availability: string; // Free form availability info
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  location: string; // Home address
  email: string;
  phone?: string;
  createdAt: Date;
  bookings: ClientBooking[]; // Array of booking references
}

export interface ClientBooking {
  id: string;
  pswWorkerId: string;
  pswWorkerName: string;
  date: Date;
  startTime: string; // HH:MM format
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface PSWWorker {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  location: string; // Work/home address
  email: string;
  phone?: string;
  specialties?: string[]; // e.g., ['elderly care', 'mobility assist']
  hourlyRate: number;
  availability: WorkerAvailability[];
  bookings: WorkerBooking[]; // Array of booking references
  createdAt: Date;
}

export interface WorkerAvailability {
  id: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string;
  isRecurring: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface WorkerBooking {
  id: string;
  clientId: string;
  clientName: string;
  date: Date;
  startTime: string; // HH:MM format
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: Date;
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

export interface MatchedWorker {
  worker: PSWWorker;
  conflicts: number; // Number of time conflicts (0 = available)
  distance?: number; // Distance from client location (if available)
  hourlyRate: number;
  score: number; // Matching score (0-100)
}
