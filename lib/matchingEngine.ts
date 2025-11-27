// lib/matchingEngine.ts
import { Client, PSWWorker, MatchedWorker } from '@/types';

/**
 * Check if a time range conflicts with existing bookings
 */
function hasTimeConflict(
  date: Date,
  startTime: string,
  endTime: string,
  workerBookings: any[]
): boolean {
  const bookingDate = date.toDateString();

  return workerBookings.some((booking) => {
    const bookingDateStr = new Date(booking.date).toDateString();
    if (bookingDateStr !== bookingDate) return false;

    const newStart = parseInt(startTime.replace(':', ''));
    const newEnd = parseInt(endTime.replace(':', ''));
    const existingStart = parseInt(booking.startTime.replace(':', ''));
    const existingEnd = parseInt(booking.endTime.replace(':', ''));

    // Check for overlap
    return !(newEnd <= existingStart || newStart >= existingEnd);
  });
}

/**
 * Check if worker is available on the given day of week
 */
function isWorkerAvailableOnDay(worker: PSWWorker, dayOfWeek: number): boolean {
  return worker.availability.some((avail) => {
    if (!avail.isRecurring) return false;
    return avail.dayOfWeek === dayOfWeek;
  });
}

/**
 * Check if time is within worker's availability window
 */
function isTimeWithinAvailability(
  worker: PSWWorker,
  dayOfWeek: number,
  startTime: string,
  endTime: string
): boolean {
  const availSlot = worker.availability.find((avail) => avail.dayOfWeek === dayOfWeek);
  if (!availSlot) return false;

  const newStart = parseInt(startTime.replace(':', ''));
  const newEnd = parseInt(endTime.replace(':', ''));
  const availStart = parseInt(availSlot.startTime.replace(':', ''));
  const availEnd = parseInt(availSlot.endTime.replace(':', ''));

  return newStart >= availStart && newEnd <= availEnd;
}

/**
 * Calculate simple distance between two location strings (naive implementation)
 * In production, you'd use actual geocoding/distance calculation
 */
function calculateDistance(loc1: string, loc2: string): number {
  // Simple string similarity score as distance proxy
  // Lower score = more similar (closer)
  const loc1Lower = loc1.toLowerCase();
  const loc2Lower = loc2.toLowerCase();

  if (loc1Lower === loc2Lower) return 0;

  const commonChars = [...loc1Lower].filter((char) =>
    loc2Lower.includes(char)
  ).length;

  return Math.abs(loc1Lower.length - loc2Lower.length) + (loc1Lower.length - commonChars);
}

/**
 * Find available PSW workers for a client booking
 */
export function findAvailableWorkers(
  client: Client,
  workers: PSWWorker[],
  dates: Date[],
  startTime: string,
  endTime: string,
  includeDistance: boolean = true
): MatchedWorker[] {
  const matched: MatchedWorker[] = [];

  workers.forEach((worker) => {
    let totalConflicts = 0;
    let availableDatesCount = 0;

    // Check each requested date
    dates.forEach((date) => {
      const dayOfWeek = date.getDay();

      // Check if worker is available on this day
      if (!isWorkerAvailableOnDay(worker, dayOfWeek)) {
        totalConflicts++;
        return;
      }

      // Check if time is within worker's availability window
      if (!isTimeWithinAvailability(worker, dayOfWeek, startTime, endTime)) {
        totalConflicts++;
        return;
      }

      // Check for existing booking conflicts
      if (hasTimeConflict(date, startTime, endTime, worker.bookings)) {
        totalConflicts++;
        return;
      }

      availableDatesCount++;
    });

    // Only include workers with zero conflicts
    if (totalConflicts === 0) {
      const distance = includeDistance
        ? calculateDistance(client.location, worker.location)
        : 0;

      // Calculate matching score (0-100)
      // Factors: specialties, hourly rate, distance, availability
      let score = 100;
      score -= distance > 0 ? Math.min(distance * 2, 20) : 0; // Distance penalty
      score = Math.max(0, score);

      matched.push({
        worker,
        conflicts: totalConflicts,
        distance,
        hourlyRate: worker.hourlyRate,
        score,
      });
    }
  });

  // Sort by score (highest first)
  return matched.sort((a, b) => b.score - a.score);
}

/**
 * Get a single best match for a client booking
 */
export function findBestMatch(
  client: Client,
  workers: PSWWorker[],
  dates: Date[],
  startTime: string,
  endTime: string
): MatchedWorker | null {
  const matches = findAvailableWorkers(client, workers, dates, startTime, endTime, true);
  return matches.length > 0 ? matches[0] : null;
}

/**
 * Check if a specific worker is available for booking
 */
export function isWorkerAvailableForBooking(
  worker: PSWWorker,
  dates: Date[],
  startTime: string,
  endTime: string
): boolean {
  return dates.every((date) => {
    const dayOfWeek = date.getDay();

    if (!isWorkerAvailableOnDay(worker, dayOfWeek)) return false;
    if (!isTimeWithinAvailability(worker, dayOfWeek, startTime, endTime)) return false;
    if (hasTimeConflict(date, startTime, endTime, worker.bookings)) return false;

    return true;
  });
}
