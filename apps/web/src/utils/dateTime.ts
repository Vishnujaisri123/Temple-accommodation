/**
 * Asia/Kolkata DateTime and Slot Utilities for Frontend Vadapalli Accommodation
 * Ensures accurate date/time rendering and dynamic slot calculations.
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
 * Returns the current time parts (hours 0-23, minutes 0-59, totalMinutes) in Asia/Kolkata.
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
  time: string; // "HH:mm"
  label: string; // "hh:mm A" (e.g. "12:00 AM", "01:30 PM")
  totalMinutes: number;
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
 * - For today: begins at 12:00 AM, hiding/disabling slots that have already passed.
 * - For future dates: displays all slots beginning at 12:00 AM through 11:30 PM.
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

  // Today: show only future time slots
  const { totalMinutes: currentMinutes } = getKolkataTimeParts(now);
  return allSlots.filter(s => s.totalMinutes > currentMinutes);
};

/**
 * Combines date string (YYYY-MM-DD) and time string (HH:mm) into an ISO string with Asia/Kolkata offset (+05:30).
 */
export const toKolkataIsoString = (dateStr: string, timeStr: string): string => {
  return `${dateStr}T${timeStr}:00+05:30`;
};

/**
 * Formats a date into a clean display string, e.g. "20 November 2026"
 */
export const formatKolkataDate = (date: Date | string): string => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
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

/**
 * Converts a 24-hr time string "HH:mm" to 12-hr label "hh:mm A"
 */
export const formatTimeSlotLabel = (timeStr: string): string => {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const period = h < 12 ? 'AM' : 'PM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
};
