/**
 * Asia/Kolkata DateTime and Slot Utilities for Vadapalli Accommodation
 * Ensures strict timezone consistency and avoids UTC date/time conversion bugs.
 */

export const TIMEZONE = 'Asia/Kolkata';

/**
 * Returns today's date string in Asia/Kolkata formatted as YYYY-MM-DD.
 */
export const getKolkataTodayString = (date: Date = new Date()): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

/**
 * Returns the current time parts (hours 0-23, minutes 0-59, and totalMinutes from midnight) in Asia/Kolkata.
 */
export const getKolkataTimeParts = (date: Date = new Date()): { hours: number; minutes: number; totalMinutes: number } => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  }).formatToParts(date);

  const hours = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minutes = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  return { hours, minutes, totalMinutes: hours * 60 + minutes };
};

export interface TimeSlot {
  time: string; // "HH:mm" (24-hour)
  label: string; // "hh:mm A" (12-hour display, e.g. "12:00 AM", "01:30 PM")
  totalMinutes: number; // minutes from midnight (0 to 1410)
}

/**
 * Generates all 48 30-minute time slots for a day starting from 12:00 AM to 11:30 PM.
 */
export const generateAllTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const period = h < 12 ? 'AM' : 'PM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const label = `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
      slots.push({
        time,
        label,
        totalMinutes: h * 60 + m
      });
    }
  }
  return slots;
};

/**
 * Returns available time slots for a given date in Asia/Kolkata.
 * - For today: slots from 12:00 AM, filtering out slots that have already passed.
 * - For future dates: all slots beginning at 12:00 AM through 11:30 PM.
 * - For past dates: empty array.
 */
export const getAvailableTimeSlots = (selectedDate: string, now: Date = new Date()): TimeSlot[] => {
  const today = getKolkataTodayString(now);
  const allSlots = generateAllTimeSlots();

  if (selectedDate < today) {
    return [];
  }

  if (selectedDate > today) {
    return allSlots;
  }

  // Today: only slots in the future
  const { totalMinutes: currentMinutes } = getKolkataTimeParts(now);
  return allSlots.filter(s => s.totalMinutes > currentMinutes);
};

/**
 * Combines a date string (YYYY-MM-DD) and time string (HH:mm) into an ISO string with Asia/Kolkata offset (+05:30).
 */
export const toKolkataIsoString = (dateStr: string, timeStr: string): string => {
  return `${dateStr}T${timeStr}:00+05:30`;
};

/**
 * Parses a date + time in Asia/Kolkata into a JavaScript Date object.
 */
export const parseKolkataDateTime = (dateStr: string, timeStr: string): Date => {
  return new Date(toKolkataIsoString(dateStr, timeStr));
};

/**
 * Checks whether a given Date or ISO string is in the past relative to now in Asia/Kolkata.
 * Allows a configurable buffer (default 5 minutes) to avoid rejecting near-current submissions.
 */
export const isPastDateTimeKolkata = (targetDate: Date | string, bufferMinutes = 5, now: Date = new Date()): boolean => {
  const targetTime = targetDate instanceof Date ? targetDate.getTime() : new Date(targetDate).getTime();
  const cutoffTime = now.getTime() - bufferMinutes * 60 * 1000;
  return targetTime < cutoffTime;
};

/**
 * Formats a date into a clean display string, e.g. "20 November 2026"
 */
export const formatKolkataDate = (date: Date | string): string => {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d);
};

/**
 * Formats a time into a clean 12-hour display string, e.g. "10:30 AM"
 */
export const formatKolkataTime = (date: Date | string): string => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(d);
};
