import React, { useEffect, useMemo, useState } from 'react';
import {
  getKolkataTodayString,
  getAvailableTimeSlots,
  toKolkataIsoString,
  formatKolkataDate,
  formatKolkataTime
} from '../../utils/dateTime';
import type { TimeSlot } from '../../utils/dateTime';

export interface AvailabilityData {
  selectedCheckIn: string;
  selectedCheckOut: string;
  formattedCheckIn: string;
  formattedCheckOut: string;
  durationHours: number;
  privateRooms: {
    total: number;
    booked: number;
    available: number;
    availableIds: string[];
    isFull: boolean;
  };
  hall: {
    total: number;
    booked: number;
    available: number;
    availableBedIds: string[];
    isFull: boolean;
  };
  hasAvailability: boolean;
  allUnavailable: boolean;
}

interface DateTimeAvailabilitySelectorProps {
  checkInDate: string;
  onCheckInDateChange: (date: string) => void;
  checkInTime: string;
  onCheckInTimeChange: (time: string) => void;
  durationHours: number;
  onDurationHoursChange: (hours: number) => void;
  accommodationTypeFilter?: 'PRIVATE_ROOM' | 'HALL' | 'ALL';
  onAvailabilityChange?: (availability: AvailabilityData | null) => void;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const DateTimeAvailabilitySelector: React.FC<DateTimeAvailabilitySelectorProps> = ({
  checkInDate,
  onCheckInDateChange,
  checkInTime,
  onCheckInTimeChange,
  durationHours,
  onDurationHoursChange,
  accommodationTypeFilter = 'ALL',
  onAvailabilityChange
}) => {
  const todayKolkata = useMemo(() => getKolkataTodayString(), []);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // 1. Dynamic Available Time Slots calculation
  const availableSlots: TimeSlot[] = useMemo(() => {
    if (!checkInDate) return [];
    return getAvailableTimeSlots(checkInDate);
  }, [checkInDate]);

  // 2. Clear invalid time if selected date changes and previously selected time is no longer valid
  useEffect(() => {
    if (!checkInDate) return;
    if (checkInTime) {
      const isValidSlot = availableSlots.some(s => s.time === checkInTime);
      if (!isValidSlot) {
        onCheckInTimeChange('');
        setAvailability(null);
        if (onAvailabilityChange) onAvailabilityChange(null);
      }
    }
  }, [checkInDate, checkInTime, availableSlots, onCheckInTimeChange, onAvailabilityChange]);

  // 3. Computed Check-In and Check-Out ISO Dates
  const computedIso = useMemo(() => {
    if (!checkInDate || !checkInTime) return null;
    const checkInIso = toKolkataIsoString(checkInDate, checkInTime);
    const inDate = new Date(checkInIso);
    if (isNaN(inDate.getTime())) return null;

    const outDate = new Date(inDate.getTime() + durationHours * 60 * 60 * 1000);
    const checkOutIso = outDate.toISOString();

    return {
      checkInIso,
      checkOutIso,
      inDate,
      outDate
    };
  }, [checkInDate, checkInTime, durationHours]);

  // 4. Live Availability Fetch whenever Date, Time, or Duration changes
  useEffect(() => {
    if (!computedIso) {
      setAvailability(null);
      setAvailabilityError(null);
      if (onAvailabilityChange) onAvailabilityChange(null);
      return;
    }

    let isMounted = true;
    setLoadingAvailability(true);
    setAvailabilityError(null);

    const fetchAvailability = async () => {
      try {
        const query = `checkIn=${encodeURIComponent(computedIso.checkInIso)}&checkOut=${encodeURIComponent(computedIso.checkOutIso)}`;
        const res = await fetch(`${API_BASE}/bookings/availability?${query}`);
        const data = await res.json();

        if (!isMounted) return;

        if (data.success && data.summary) {
          setAvailability(data.summary);
          if (onAvailabilityChange) onAvailabilityChange(data.summary);
        } else {
          setAvailability(null);
          setAvailabilityError(data.message || 'Unable to fetch availability');
          if (onAvailabilityChange) onAvailabilityChange(null);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setAvailability(null);
        setAvailabilityError('Failed to connect to accommodation server.');
        if (onAvailabilityChange) onAvailabilityChange(null);
      } finally {
        if (isMounted) setLoadingAvailability(false);
      }
    };

    const timer = setTimeout(fetchAvailability, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [computedIso?.checkInIso, computedIso?.checkOutIso, onAvailabilityChange]);

  const isToday = checkInDate === todayKolkata;

  // Determine specific availability for the active accommodation filter
  const isSelectedUnavailable = useMemo(() => {
    if (!availability) return false;
    if (accommodationTypeFilter === 'PRIVATE_ROOM') {
      return availability.privateRooms.isFull;
    }
    if (accommodationTypeFilter === 'HALL') {
      return availability.hall.isFull;
    }
    return availability.allUnavailable;
  }, [availability, accommodationTypeFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Date, Time & Duration Selection Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          alignItems: 'flex-start'
        }}
      >
        {/* 1. Date Picker (Blocks past dates dynamically) */}
        <div>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            📅 Check-in Date <span style={{ color: '#E53E3E' }}>*</span>
          </label>
          <input
            type="date"
            min={todayKolkata}
            value={checkInDate}
            onChange={(e) => onCheckInDateChange(e.target.value)}
            className="input-field"
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1.5px solid var(--border-color, #E2E8F0)',
              fontSize: '0.95rem'
            }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
            {isToday ? 'Today (Asia/Kolkata)' : checkInDate ? formatKolkataDate(checkInDate) : 'Select today or future date'}
          </span>
        </div>

        {/* 2. Time Slot Dropdown (Starts 12:00 AM, filters past times for today) */}
        <div>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            ⏰ Check-in Time <span style={{ color: '#E53E3E' }}>*</span>
          </label>
          <select
            value={checkInTime}
            onChange={(e) => onCheckInTimeChange(e.target.value)}
            disabled={!checkInDate || availableSlots.length === 0}
            className="input-field"
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1.5px solid var(--border-color, #E2E8F0)',
              fontSize: '0.95rem',
              backgroundColor: !checkInDate || availableSlots.length === 0 ? '#F7FAFC' : '#FFFFFF'
            }}
          >
            <option value="">
              {!checkInDate
                ? 'Select date first'
                : availableSlots.length === 0
                ? 'No future slots remaining today'
                : 'Select time slot (from 12:00 AM)'}
            </option>
            {availableSlots.map((slot) => (
              <option key={slot.time} value={slot.time}>
                {slot.label}
              </option>
            ))}
          </select>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
            {isToday
              ? 'Showing only future time slots for today'
              : 'All 30-min slots starting from 12:00 AM'}
          </span>
        </div>

        {/* 3. Duration Selector (12-hour intervals) */}
        <div>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            ⏱️ Stay Duration (12-Hr Slots) <span style={{ color: '#E53E3E' }}>*</span>
          </label>
          <select
            value={durationHours}
            onChange={(e) => onDurationHoursChange(parseInt(e.target.value, 10))}
            className="input-field"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1.5px solid var(--border-color, #E2E8F0)',
              fontSize: '0.95rem'
            }}
          >
            <option value={12}>12 Hours (Half Day Darshan)</option>
            <option value={24}>24 Hours (1 Full Day)</option>
            <option value={36}>36 Hours (1.5 Days)</option>
            <option value={48}>48 Hours (2 Full Days)</option>
            <option value={72}>72 Hours (3 Full Days)</option>
          </select>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
            Pilgrim billing is scheduled in 12-hour intervals
          </span>
        </div>
      </div>

      {/* Calculated Check-Out Summary Pill */}
      {computedIso && (
        <div
          style={{
            backgroundColor: '#F8F9FA',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '0.65rem 1rem',
            fontSize: '0.86rem',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}
        >
          <div>
            <strong>Check-in:</strong> {formatKolkataDate(computedIso.inDate)}, {formatKolkataTime(computedIso.inDate)}
          </div>
          <div>
            <strong>Check-out:</strong> {formatKolkataDate(computedIso.outDate)}, {formatKolkataTime(computedIso.outDate)} ({durationHours}h)
          </div>
        </div>
      )}

      {/* Availability Loading State */}
      {loadingAvailability && (
        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-primary)', fontSize: '0.9rem' }}>
          <span>🔄 Verifying live temple inventory...</span>
        </div>
      )}

      {/* Live Availability Display Card */}
      {availability && !loadingAvailability && (
        <div
          style={{
            backgroundColor: isSelectedUnavailable ? '#FFF5F5' : '#F7FAFC',
            border: `1.5px solid ${isSelectedUnavailable ? '#FEB2B2' : 'var(--color-secondary, #C5A059)'}`,
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
          }}
        >
          <div style={{ marginBottom: '0.85rem' }}>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
              <strong>Selected date:</strong> {formatKolkataDate(computedIso?.inDate || checkInDate)}
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              <strong>Selected time:</strong> {formatKolkataTime(computedIso?.inDate || '') || checkInTime} ({durationHours} Hours duration)
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginTop: '1rem',
              borderTop: '1px solid #E2E8F0',
              paddingTop: '1rem'
            }}
          >
            {/* Private Rooms Inventory */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                borderLeft: `4px solid ${availability.privateRooms.available > 0 ? '#38A169' : '#E53E3E'}`
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-primary)', marginBottom: '0.4rem' }}>
                🛏️ Private rooms:
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                <div>• {availability.privateRooms.total} total rooms</div>
                <div>• {availability.privateRooms.booked} room{availability.privateRooms.booked !== 1 ? 's' : ''} booked</div>
                <div style={{ fontWeight: 600, color: availability.privateRooms.available > 0 ? '#2F855A' : '#C53030' }}>
                  • {availability.privateRooms.available} room{availability.privateRooms.available !== 1 ? 's' : ''} available
                </div>
              </div>
            </div>

            {/* Hall Beds Inventory */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                borderLeft: `4px solid ${availability.hall.available > 0 ? '#38A169' : '#E53E3E'}`
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-primary)', marginBottom: '0.4rem' }}>
                🛌 Hall:
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                <div>• {availability.hall.total} total beds</div>
                <div>• {availability.hall.booked} bed{availability.hall.booked !== 1 ? 's' : ''} booked</div>
                <div style={{ fontWeight: 600, color: availability.hall.available > 0 ? '#2F855A' : '#C53030' }}>
                  • {availability.hall.available} bed{availability.hall.available !== 1 ? 's' : ''} available
                </div>
              </div>
            </div>
          </div>

          {/* Prominent Out-of-Inventory Warning */}
          {isSelectedUnavailable && (
            <div
              style={{
                marginTop: '1.25rem',
                padding: '0.85rem 1.15rem',
                backgroundColor: '#FFF5F5',
                border: '1.5px solid #E53E3E',
                borderRadius: '8px',
                color: '#C53030',
                fontWeight: 600,
                fontSize: '0.92rem',
                textAlign: 'center'
              }}
            >
              ⚠️ Sorry, no accommodation is available for your selected date and time. Please choose another date or time.
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {availabilityError && (
        <div style={{ padding: '0.75rem', backgroundColor: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: '8px', color: '#C53030', fontSize: '0.85rem' }}>
          {availabilityError}
        </div>
      )}
    </div>
  );
};
