// lib/aiParser.ts
import { ParsedBookingRequest } from '@/types';

/**
 * Simple AI parser that processes natural language booking requests
 * Supports patterns like: "book meetings with Evan, Efrem, Charlie for Mondays and Wednesdays at 10:00-12:00 for December"
 */
export function parseBookingRequest(input: string): ParsedBookingRequest | null {
  try {
    // Extract attendees
    const attendeesMatch = input.match(/with\s+([^f]+?)(?:\s+for\s+)/i);
    let attendees: string[] = [];
    if (attendeesMatch) {
      attendees = attendeesMatch[1]
        .split(/[,\s]+(?:and\s+)?/)
        .map((name) => name.trim().toLowerCase())
        .filter((name) => name.length > 0);
    }

    // Extract days of week
    const daysPattern = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/gi;
    const daysMatches = input.match(daysPattern) || [];
    const daysOfWeek = [...new Set(daysMatches.map((d) => d.toLowerCase()))];

    // Extract time range
    const timeMatch = input.match(/at\s+(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/i);
    let startTime = '09:00';
    let endTime = '10:00';
    if (timeMatch) {
      const [, startHour, startMin, endHour, endMin] = timeMatch;
      startTime = `${startHour.padStart(2, '0')}:${startMin}`;
      endTime = `${endHour.padStart(2, '0')}:${endMin}`;
    }

    // Extract month and year
    let month = new Date().getMonth() + 1;
    let year = new Date().getFullYear();

    const monthMatch = input.match(
      /(January|February|March|April|May|June|July|August|September|October|November|December)/i
    );
    if (monthMatch) {
      const monthMap: { [key: string]: number } = {
        january: 1,
        february: 2,
        march: 3,
        april: 4,
        may: 5,
        june: 6,
        july: 7,
        august: 8,
        september: 9,
        october: 10,
        november: 11,
        december: 12,
      };
      month = monthMap[monthMatch[1].toLowerCase()];
    }

    const yearMatch = input.match(/(\d{4})/);
    if (yearMatch) {
      year = parseInt(yearMatch[1]);
    }

    // Extract title (if provided after "meeting" keyword)
    const titleMatch = input.match(/book\s+([^w]+?)(?:\s+with|\s+for)/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Team Meeting';

    return {
      attendees: attendees.length > 0 ? attendees : [],
      daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : [],
      startTime,
      endTime,
      month,
      year,
      title,
    };
  } catch (error) {
    console.error('Error parsing booking request:', error);
    return null;
  }
}

/**
 * Converts day names to day of week numbers (0 = Sunday, 1 = Monday, etc.)
 */
export function dayNameToNumber(dayName: string): number {
  const dayMap: { [key: string]: number } = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  return dayMap[dayName.toLowerCase()] || -1;
}

/**
 * Gets all dates in a month that match specified days of week
 */
export function getDatesForMonth(
  year: number,
  month: number,
  daysOfWeek: string[]
): Date[] {
  const dates: Date[] = [];
  const daysToMatch = daysOfWeek.map(dayNameToNumber);

  const lastDay = new Date(year, month, 0).getDate();

  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, month - 1, day);
    if (daysToMatch.includes(date.getDay())) {
      dates.push(date);
    }
  }

  return dates;
}

/**
 * Normalizes user names to match available users (fuzzy matching)
 */
export function normalizeUserName(input: string, availableUsers: string[]): string | null {
  const lowerInput = input.toLowerCase().trim();

  // Exact match
  const exactMatch = availableUsers.find((name) => name.toLowerCase() === lowerInput);
  if (exactMatch) return exactMatch;

  // Partial match
  const partialMatch = availableUsers.find((name) =>
    name.toLowerCase().includes(lowerInput) || lowerInput.includes(name.toLowerCase())
  );
  if (partialMatch) return partialMatch;

  return null;
}
