import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  DateTimeAvailabilitySelector
} from '../components/booking/DateTimeAvailabilitySelector';
import type { AvailabilityData } from '../components/booking/DateTimeAvailabilitySelector';
import {
  toKolkataIsoString,
  formatKolkataDate,
  formatKolkataTime
} from '../utils/dateTime';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface AccommodationItem {
  _id: string;
  name: string;
  type: 'PRIVATE_ROOM' | 'HALL';
  description: string;
  capacity: { adults: number; children: number };
  pricePerDay: number;
  bathroomType: string;
  active: boolean;
  available?: boolean;
  totalBeds?: number;
  availableBeds?: number;
  availableBedIds?: string[];
  beds?: Array<{
    _id: string;
    bedNumber: number;
    pricePerDay: number;
    available: boolean;
  }>;
}

const Booking: React.FC = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [accommodations, setAccommodations] = useState<AccommodationItem[]>([]);
  const [loadingAccommodations, setLoadingAccommodations] = useState(true);

  // Date, Time & Duration State
  const [checkInDate, setCheckInDate] = useState<string>('');
  const [checkInTime, setCheckInTime] = useState<string>('');
  const [durationHours, setDurationHours] = useState<number>(12);

  // Selected Accommodation & Beds
  const [selectedAccId, setSelectedAccId] = useState<string>('');
  const [selectedBedIds, setSelectedBedIds] = useState<string[]>([]);
  const [liveAvailability, setLiveAvailability] = useState<AvailabilityData | null>(null);

  // Guest Details
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  // Review & Payment
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [bookingResponse, setBookingResponse] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch all accommodations from backend on mount
  useEffect(() => {
    fetch(`${API_BASE}/accommodations`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setAccommodations(data.data);
        }
      })
      .catch(err => console.error("Error fetching accommodations:", err))
      .finally(() => setLoadingAccommodations(false));
  }, []);

  // 2. Initialize from URL parameter (e.g. /book/:id) or query params
  useEffect(() => {
    if (accommodations.length === 0) return;

    if (id) {
      const lower = id.toLowerCase();
      if (lower.includes('hall')) {
        const hall = accommodations.find(a => a.type === 'HALL');
        if (hall) setSelectedAccId(hall._id);
      } else if (lower.includes('room1') || lower.includes('room 1')) {
        const r1 = accommodations.find(a => a.name.toLowerCase().includes('room 1'));
        if (r1) setSelectedAccId(r1._id);
      } else if (lower.includes('room2') || lower.includes('room 2')) {
        const r2 = accommodations.find(a => a.name.toLowerCase().includes('room 2'));
        if (r2) setSelectedAccId(r2._id);
      } else {
        const match = accommodations.find(a => a._id === id);
        if (match) setSelectedAccId(match._id);
        else setSelectedAccId(accommodations[0]._id);
      }
    } else if (!selectedAccId && accommodations.length > 0) {
      setSelectedAccId(accommodations[0]._id);
    }
  }, [id, accommodations, selectedAccId]);

  // Prepopulate from URL search parameters if passed
  useEffect(() => {
    const qIn = searchParams.get('checkIn');
    const qOut = searchParams.get('checkOut');
    if (qIn) {
      const inDate = new Date(qIn);
      if (!isNaN(inDate.getTime())) {
        // extract YYYY-MM-DD
        const dStr = inDate.toISOString().slice(0, 10);
        const hStr = String(inDate.getHours()).padStart(2, '0');
        const mStr = inDate.getMinutes() < 30 ? '00' : '30';
        setCheckInDate(dStr);
        setCheckInTime(`${hStr}:${mStr}`);
        if (qOut) {
          const outDate = new Date(qOut);
          if (!isNaN(outDate.getTime())) {
            const diffHours = Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60));
            if (diffHours >= 12) {
              setDurationHours(diffHours);
            }
          }
        }
      }
    }
  }, [searchParams]);

  // Active accommodation object
  const activeAccommodation = useMemo(() => {
    return accommodations.find(a => a._id === selectedAccId) || null;
  }, [accommodations, selectedAccId]);

  // Real-time Bed list for Hall
  const hallBeds = useMemo(() => {
    if (!activeAccommodation || activeAccommodation.type !== 'HALL') return [];
    if (liveAvailability && liveAvailability.hall) {
      // Create bed numbers 1 to 5
      const availableSet = new Set(liveAvailability.hall.availableBedIds);
      return Array.from({ length: 5 }, (_, i) => {
        const bedNum = i + 1;
        const matchingId = liveAvailability.hall.availableBedIds[i] || `bed-id-${bedNum}`;
        return {
          id: matchingId,
          bedNumber: bedNum,
          pricePerDay: activeAccommodation.pricePerDay || 300,
          available: availableSet.has(matchingId) || (liveAvailability.hall.available >= bedNum)
        };
      });
    }
    return Array.from({ length: 5 }, (_, i) => ({
      id: `bed-${i + 1}`,
      bedNumber: i + 1,
      pricePerDay: 300,
      available: true
    }));
  }, [activeAccommodation, liveAvailability]);

  // Computed Check-in and Check-out ISO strings
  const { checkInIso, checkOutIso, numberOfSlots } = useMemo(() => {
    if (!checkInDate || !checkInTime) {
      return { checkInIso: '', checkOutIso: '', numberOfSlots: 1 };
    }
    const inIso = toKolkataIsoString(checkInDate, checkInTime);
    const inDate = new Date(inIso);
    const outDate = new Date(inDate.getTime() + durationHours * 60 * 60 * 1000);
    const outIso = outDate.toISOString();
    const slots = Math.max(1, Math.ceil(durationHours / 12));
    return { checkInIso: inIso, checkOutIso: outIso, numberOfSlots: slots };
  }, [checkInDate, checkInTime, durationHours]);

  // Pricing Calculation based on 12-hour billing slots
  const pricing = useMemo(() => {
    if (!activeAccommodation) return { baseAmount: 0, gstRate: 12, gstAmount: 0, totalAmount: 0 };
    let base = 0;
    if (activeAccommodation.type === 'PRIVATE_ROOM') {
      base = activeAccommodation.pricePerDay * numberOfSlots;
    } else {
      const bedsCount = Math.max(1, selectedBedIds.length);
      base = activeAccommodation.pricePerDay * bedsCount * numberOfSlots;
    }
    const gstRate = 12; // 12% standard GST
    const gst = Math.round(((base * gstRate) / 100) * 100) / 100;
    return {
      baseAmount: base,
      gstRate,
      gstAmount: gst,
      totalAmount: Math.round((base + gst) * 100) / 100
    };
  }, [activeAccommodation, numberOfSlots, selectedBedIds]);

  // Bed selection toggle for Hall
  const toggleBedSelection = (bedId: string) => {
    setSelectedBedIds(prev => {
      if (prev.includes(bedId)) {
        return prev.filter(id => id !== bedId);
      } else {
        return [...prev, bedId];
      }
    });
  };

  // Determine if proceeding should be disabled
  const isSelectionUnavailable = useMemo(() => {
    if (!liveAvailability) return false;
    if (activeAccommodation?.type === 'PRIVATE_ROOM') {
      return liveAvailability.privateRooms.available <= 0;
    }
    if (activeAccommodation?.type === 'HALL') {
      return liveAvailability.hall.available <= 0;
    }
    return liveAvailability.allUnavailable;
  }, [liveAvailability, activeAccommodation]);

  // Step 1: Proceed to Review
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!checkInDate || !checkInTime) {
      setErrorMessage("Please select both check-in date and check-in time.");
      return;
    }

    if (!activeAccommodation) {
      setErrorMessage("Please select an accommodation option.");
      return;
    }

    if (isSelectionUnavailable) {
      setErrorMessage("Sorry, no accommodation is available for your selected date and time. Please choose another date or time.");
      return;
    }

    if (activeAccommodation.type === 'HALL' && selectedBedIds.length === 0) {
      setErrorMessage("Please select at least one bed in the shared hall.");
      return;
    }

    setStep(2);
  };

  // Step 2: Create Booking in Backend
  const handleCreateBooking = async () => {
    if (!acceptedPolicy) {
      setErrorMessage("You must read and agree to the booking and no-cancellation policy to proceed.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      // Ensure valid bed IDs for hall
      let resolvedBedIds = selectedBedIds;
      if (activeAccommodation?.type === 'HALL') {
        if (liveAvailability?.hall.availableBedIds && liveAvailability.hall.availableBedIds.length > 0) {
          resolvedBedIds = liveAvailability.hall.availableBedIds.slice(0, Math.max(1, selectedBedIds.length));
        }
      }

      // If private room, automatically assign an available room ID if current selection is booked
      let targetAccommodationId = activeAccommodation?._id;
      if (activeAccommodation?.type === 'PRIVATE_ROOM' && liveAvailability?.privateRooms.availableIds.length) {
        if (!liveAvailability.privateRooms.availableIds.includes(targetAccommodationId || '')) {
          targetAccommodationId = liveAvailability.privateRooms.availableIds[0];
        }
      }

      const payload = {
        customerName,
        phone,
        address,
        checkIn: checkInIso,
        checkOut: checkOutIso,
        adults,
        children,
        childrenAges: children > 0 ? Array(children).fill(8) : [],
        accommodationType: activeAccommodation?.type,
        accommodationId: targetAccommodationId,
        bedIds: activeAccommodation?.type === 'HALL' ? resolvedBedIds : undefined,
        policyAccepted: true
      };

      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success && data.data) {
        setBookingResponse(data.data);
        setStep(3);
      } else {
        setErrorMessage(data.message || "Failed to initialize booking. Please try another time slot.");
      }
    } catch (err: any) {
      setErrorMessage("An unexpected network error occurred while creating your reservation.");
    } finally {
      setSubmitting(false);
    }
  };

  // Step 3: Initiate PhonePe Payment Gateway
  const handlePaymentSubmit = async () => {
    if (!bookingResponse?.bookingId) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE}/payments/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: bookingResponse.bookingId })
      });
      const data = await res.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setErrorMessage(data.message || "Payment initiation failed. Please select another slot if unavailable.");
      }
    } catch (err) {
      setErrorMessage("Failed to connect to PhonePe gateway.");
    } finally {
      setSubmitting(false);
    }
  };

  // Test Mode Skip Payment
  const handleMockPayment = async () => {
    if (!bookingResponse?.bookingId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingResponse.bookingId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentReference: `TEST-UTR-${Date.now()}` })
      });
      const data = await res.json();
      if (data.success) {
        navigate(`/status?id=${bookingResponse.bookingId}`);
      } else {
        setErrorMessage(data.message || "Mock payment failed.");
      }
    } catch (err) {
      setErrorMessage("Error submitting test payment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingAccommodations) {
    return (
      <div style={{ padding: '6rem 2rem', textAlign: 'center', color: 'var(--color-primary)' }}>
        <h2>Loading temple accommodation options...</h2>
      </div>
    );
  }

  return (
    <section className="animate-fade-in" style={{ padding: '3.5rem 1.5rem', maxWidth: '880px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>
          Pilgrim Reservation
        </span>
        <h1 className="heading-serif" style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: 'var(--color-primary)', marginTop: '0.25rem' }}>
          Temple Accommodation Booking
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '580px', margin: '0.5rem auto 0 auto' }}>
          Sacred stay just 200m from Sri Venkateswara Swamy Temple. Stays are scheduled in 12-hour intervals for devotee darshan convenience.
        </p>
      </div>

      {/* Progress Steps Header */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: 'clamp(0.4rem, 2.5vw, 1.25rem)', 
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}
        role="navigation"
        aria-label="Booking steps navigation"
      >
        {/* Step 1: Stay & Details */}
        <button
          type="button"
          onClick={() => {
            setErrorMessage(null);
            setStep(1);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: step === 1 ? 'rgba(112, 26, 30, 0.08)' : 'transparent',
            border: step === 1 ? '1px solid rgba(112, 26, 30, 0.2)' : '1px solid transparent',
            padding: '0.45rem 0.75rem',
            borderRadius: '10px',
            color: step >= 1 ? 'var(--color-primary)' : '#A0AEC0',
            fontWeight: step === 1 ? 700 : 600,
            cursor: step > 1 ? 'pointer' : 'default',
            transition: 'all 0.2s ease'
          }}
          title={step > 1 ? "Click to go back and edit stay or devotee details" : "Current step: Stay & Details"}
        >
          <span style={{ 
            width: '28px', 
            height: '28px', 
            borderRadius: '50%', 
            backgroundColor: step >= 1 ? 'var(--color-primary)' : '#E2E8F0', 
            color: step >= 1 ? '#FFF' : '#718096', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '0.85rem',
            fontWeight: 700
          }}>
            {step > 1 ? '✓' : '1'}
          </span>
          <div style={{ textAlign: 'left' }}>
            <span style={{ display: 'block', fontSize: '0.92rem' }}>Stay & Details</span>
            {step > 1 && (
              <span style={{ fontSize: '0.72rem', color: 'var(--color-secondary)', fontWeight: 700 }}>Click to Edit ✏️</span>
            )}
          </div>
        </button>

        <span style={{ color: '#CBD5E0', fontSize: '1.1rem', userSelect: 'none' }}>→</span>

        {/* Step 2: Review */}
        <button
          type="button"
          onClick={() => {
            if (step === 3) {
              setErrorMessage(null);
              setStep(2);
            } else if (step === 1) {
              if (!checkInDate || !checkInTime) {
                setErrorMessage("Please select both check-in date and check-in time first.");
                return;
              }
              if (!activeAccommodation) {
                setErrorMessage("Please select an accommodation option first.");
                return;
              }
              if (activeAccommodation.type === 'HALL' && selectedBedIds.length === 0) {
                setErrorMessage("Please select at least one bed in the shared hall.");
                return;
              }
              setErrorMessage(null);
              setStep(2);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: step === 2 ? 'rgba(112, 26, 30, 0.08)' : 'transparent',
            border: step === 2 ? '1px solid rgba(112, 26, 30, 0.2)' : '1px solid transparent',
            padding: '0.45rem 0.75rem',
            borderRadius: '10px',
            color: step >= 2 ? 'var(--color-primary)' : '#A0AEC0',
            fontWeight: step === 2 ? 700 : 600,
            cursor: step === 3 || (step === 1 && Boolean(checkInDate && checkInTime && activeAccommodation)) ? 'pointer' : 'default',
            transition: 'all 0.2s ease'
          }}
          title={step === 3 ? "Click to go back and review booking details" : step === 1 ? "Click to proceed to Review" : "Current step: Review"}
        >
          <span style={{ 
            width: '28px', 
            height: '28px', 
            borderRadius: '50%', 
            backgroundColor: step >= 2 ? 'var(--color-primary)' : '#E2E8F0', 
            color: step >= 2 ? '#FFF' : '#718096', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '0.85rem',
            fontWeight: 700
          }}>
            {step > 2 ? '✓' : '2'}
          </span>
          <div style={{ textAlign: 'left' }}>
            <span style={{ display: 'block', fontSize: '0.92rem' }}>Review</span>
            {step === 3 && (
              <span style={{ fontSize: '0.72rem', color: 'var(--color-secondary)', fontWeight: 700 }}>Click to Review ↩️</span>
            )}
          </div>
        </button>

        <span style={{ color: '#CBD5E0', fontSize: '1.1rem', userSelect: 'none' }}>→</span>

        {/* Step 3: Payment */}
        <button
          type="button"
          onClick={() => {
            if (step < 3 && bookingResponse) {
              setErrorMessage(null);
              setStep(3);
            }
          }}
          disabled={step === 3 || !bookingResponse}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: step === 3 ? 'rgba(112, 26, 30, 0.08)' : 'transparent',
            border: step === 3 ? '1px solid rgba(112, 26, 30, 0.2)' : '1px solid transparent',
            padding: '0.45rem 0.75rem',
            borderRadius: '10px',
            color: step === 3 ? 'var(--color-primary)' : '#A0AEC0',
            fontWeight: step === 3 ? 700 : 500,
            cursor: step < 3 && bookingResponse ? 'pointer' : 'default',
            transition: 'all 0.2s ease'
          }}
          title={step === 3 ? "Current step: Payment" : bookingResponse ? "Return to active payment screen" : "Complete review to access payment"}
        >
          <span style={{ 
            width: '28px', 
            height: '28px', 
            borderRadius: '50%', 
            backgroundColor: step === 3 ? 'var(--color-primary)' : '#E2E8F0', 
            color: step === 3 ? '#FFF' : '#718096', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '0.85rem',
            fontWeight: 700
          }}>
            3
          </span>
          <div style={{ textAlign: 'left' }}>
            <span style={{ display: 'block', fontSize: '0.92rem' }}>Payment</span>
          </div>
        </button>
      </div>

      {errorMessage && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#FFF5F5', border: '1.5px solid #FEB2B2', borderRadius: '8px', color: '#C53030', fontWeight: 600, fontSize: '0.92rem' }}>
          ⚠️ {errorMessage}
        </div>
      )}

      <div className="card" style={{ padding: '2.25rem 2rem', backgroundColor: '#FFFFFF', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
        {/* ==================================================== */}
        {/* STEP 1: DATE, TIME, INVENTORY & GUEST DETAILS */}
        {/* ==================================================== */}
        {step === 1 && (
          <form onSubmit={handleProceedToReview}>
            {/* 1. Accommodation Selection */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.65rem' }}>
                1. Select Accommodation Type
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                {accommodations.map(acc => {
                  const isSelected = selectedAccId === acc._id;
                  return (
                    <div
                      key={acc._id}
                      onClick={() => {
                        setSelectedAccId(acc._id);
                        if (acc.type === 'HALL' && selectedBedIds.length === 0) {
                          setSelectedBedIds(['bed-1']);
                        }
                      }}
                      style={{
                        padding: '1rem',
                        borderRadius: '10px',
                        border: `2px solid ${isSelected ? 'var(--color-primary)' : '#E2E8F0'}`,
                        backgroundColor: isSelected ? 'rgba(112, 26, 30, 0.04)' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>
                          {acc.type === 'PRIVATE_ROOM' ? '🛏️' : '🛌'} {acc.name}
                        </span>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.95rem' }}>
                          ₹{acc.pricePerDay}
                          <small style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/12h</small>
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.4rem 0 0 0' }}>
                        {acc.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Date, Time & Live Availability Component */}
            <div style={{ marginBottom: '2rem', borderTop: '1px solid #E2E8F0', paddingTop: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.85rem' }}>
                2. Select Stay Date & Time (Asia/Kolkata)
              </label>

              <DateTimeAvailabilitySelector
                checkInDate={checkInDate}
                onCheckInDateChange={setCheckInDate}
                checkInTime={checkInTime}
                onCheckInTimeChange={setCheckInTime}
                durationHours={durationHours}
                onDurationHoursChange={setDurationHours}
                accommodationTypeFilter={activeAccommodation?.type}
                onAvailabilityChange={setLiveAvailability}
              />
            </div>

            {/* Hall Bed Selection (if Hall is active) */}
            {activeAccommodation?.type === 'HALL' && (
              <div style={{ marginBottom: '2rem', padding: '1.25rem', backgroundColor: '#F8F9FA', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  🛌 Select Hall Bed(s) to Reserve ({selectedBedIds.length} selected)
                </label>
                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  {hallBeds.map((bed, idx) => {
                    const isSelected = selectedBedIds.includes(bed.id);
                    return (
                      <button
                        key={bed.id || idx}
                        type="button"
                        disabled={!bed.available}
                        onClick={() => toggleBedSelection(bed.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          border: `1.5px solid ${!bed.available ? '#CBD5E0' : isSelected ? 'var(--color-primary)' : '#A0AEC0'}`,
                          backgroundColor: !bed.available ? '#EDF2F7' : isSelected ? 'var(--color-primary)' : '#FFFFFF',
                          color: !bed.available ? '#A0AEC0' : isSelected ? '#FFFFFF' : 'var(--text-main)',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: !bed.available ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Bed #{bed.bedNumber} {!bed.available ? '(Booked)' : isSelected ? '✓' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Guest Information */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.85rem' }}>
                3. Devotee Details
              </label>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Full Name <span style={{ color: '#E53E3E' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  required
                  placeholder="Enter full name of primary guest"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Mobile Number (Mandatory for owner confirmation & SMS) <span style={{ color: '#E53E3E' }}>*</span>
                </label>
                <input
                  type="tel"
                  className="input-field"
                  pattern="[0-9]{10}"
                  required
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Address / Native Place <span style={{ color: '#E53E3E' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  required
                  placeholder="City, State (e.g. Hyderabad, Telangana)"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    Adults {activeAccommodation?.type === 'PRIVATE_ROOM' ? '(Max 2 per room)' : ''}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={activeAccommodation?.type === 'PRIVATE_ROOM' ? 2 : 10}
                    className="input-field"
                    required
                    value={adults}
                    onChange={e => setAdults(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    Children (Under 15) {activeAccommodation?.type === 'PRIVATE_ROOM' ? '(Max 2)' : ''}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={activeAccommodation?.type === 'PRIVATE_ROOM' ? 2 : 10}
                    className="input-field"
                    required
                    value={children}
                    onChange={e => setChildren(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSelectionUnavailable || !checkInDate || !checkInTime}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.9rem',
                fontSize: '1rem',
                backgroundColor: isSelectionUnavailable || !checkInDate || !checkInTime ? '#A0AEC0' : 'var(--color-primary)',
                cursor: isSelectionUnavailable || !checkInDate || !checkInTime ? 'not-allowed' : 'pointer'
              }}
            >
              {isSelectionUnavailable ? '⚠️ Slot Unavailable - Choose Another Time' : 'Continue to Review & Pricing →'}
            </button>
          </form>
        )}

        {/* ==================================================== */}
        {/* STEP 2: REVIEW & PRICING */}
        {/* ==================================================== */}
        {step === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--color-primary)', margin: 0 }}>
                Booking Summary & Terms
              </h2>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setStep(1);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  backgroundColor: 'rgba(112, 26, 30, 0.08)',
                  border: '1.5px solid rgba(112, 26, 30, 0.25)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                ✏️ Edit Stay & Details
              </button>
            </div>

            {/* Summary Details */}
            <div style={{ backgroundColor: '#F8F9FA', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div>
                  <strong>Accommodation:</strong> {activeAccommodation?.name} ({activeAccommodation?.type === 'PRIVATE_ROOM' ? 'Private Room' : 'Hall Bed'})
                </div>
                <div>
                  <strong>Duration:</strong> {durationHours} Hours ({numberOfSlots} billing slot{numberOfSlots > 1 ? 's' : ''})
                </div>
                <div>
                  <strong>Check-in:</strong> {formatKolkataDate(checkInIso)}, {formatKolkataTime(checkInIso)}
                </div>
                <div>
                  <strong>Check-out:</strong> {formatKolkataDate(checkOutIso)}, {formatKolkataTime(checkOutIso)}
                </div>
                <div>
                  <strong>Devotee:</strong> {customerName} ({phone})
                </div>
                <div>
                  <strong>Guests:</strong> {adults} Adult{adults > 1 ? 's' : ''} {children > 0 ? `, ${children} Children` : ''}
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1.5px solid var(--color-secondary)', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.92rem' }}>
                <span>Base Charge ({numberOfSlots} × 12h slot{activeAccommodation?.type === 'HALL' ? ` × ${selectedBedIds.length} bed(s)` : ''}):</span>
                <span>₹{pricing.baseAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.92rem' }}>
                <span>GST (12%):</span>
                <span>₹{pricing.gstAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.15rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <span>Total Amount:</span>
                <span style={{ color: 'var(--color-primary)' }}>₹{pricing.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Policy Alert */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#FFF5F5', borderLeft: '4px solid var(--color-primary)', borderRadius: '6px', fontSize: '0.88rem', color: '#742A2A', lineHeight: 1.5 }}>
              <strong>Temple Accommodation Policy:</strong> Stays are strictly for devotees and families visiting Sri Venkateswara Swamy Temple. Once confirmed by the accommodation owner, bookings cannot be cancelled or transferred.
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', marginBottom: '1.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={acceptedPolicy}
                onChange={e => setAcceptedPolicy(e.target.checked)}
                style={{ width: '1.2rem', height: '1.2rem', marginTop: '0.15rem' }}
              />
              <span>I confirm that all guest details are accurate and agree to the booking guidelines and strict no-cancellation policy.</span>
            </label>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setStep(1);
                }}
                className="btn btn-secondary"
                style={{ flex: '1 1 180px', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                ← Edit Stay & Details
              </button>
              <button
                type="button"
                onClick={handleCreateBooking}
                disabled={!acceptedPolicy || submitting}
                className="btn btn-primary"
                style={{ flex: '2 1 240px', padding: '0.85rem', backgroundColor: !acceptedPolicy || submitting ? '#A0AEC0' : 'var(--color-primary)' }}
              >
                {submitting ? 'Reserving Slot...' : 'Proceed to PhonePe Payment →'}
              </button>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 3: PAYMENT GATEWAY */}
        {/* ==================================================== */}
        {step === 3 && (
          bookingResponse ? (
            <div>
              {/* Top Back & Edit Navigation for Step 3 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setStep(2);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(112, 26, 30, 0.06)'
                  }}
                >
                  ← Back to Review
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setStep(1);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    backgroundColor: '#F1F5F9'
                  }}
                >
                  ✏️ Edit Details (Step 1)
                </button>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛕</div>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '0.35rem' }}>
                  Complete Payment via PhonePe
                </h2>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                  Booking ID: <strong>{bookingResponse.bookingId}</strong>
                </div>
              </div>

              {/* Payment Section - Clear Room Rent + GST Breakdown */}
              {(() => {
                const payableBase = bookingResponse?.baseAmount ?? pricing.baseAmount;
                const payableGstRate = bookingResponse?.gstRate ?? pricing.gstRate ?? 12;
                const payableGst = bookingResponse?.gstAmount ?? (Math.round(((payableBase * payableGstRate) / 100) * 100) / 100);
                const payableTotal = bookingResponse?.totalAmount ?? (payableBase + payableGst);

                return (
                  <div style={{ backgroundColor: '#F8F9FA', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.75rem', border: '1.5px solid #E2E8F0' }}>
                    <div style={{ textAlign: 'center', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px dashed #CBD5E0' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                        Total Payable Amount (Room Rent + GST)
                      </div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.25rem' }}>
                        ₹{payableTotal.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#4A5568', marginTop: '0.25rem', fontWeight: 500 }}>
                        (Includes Room Rent and {payableGstRate}% GST)
                      </div>
                    </div>

                    {/* Clear Breakdown: Room Rent + GST = Total */}
                    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '1rem', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.55rem', fontSize: '0.92rem' }}>
                        <span style={{ color: 'var(--text-main)' }}>
                          🏨 Room Rent ({numberOfSlots} × 12h slot{activeAccommodation?.type === 'HALL' ? ` × ${selectedBedIds.length} bed(s)` : ''}):
                        </span>
                        <span style={{ fontWeight: 600 }}>₹{payableBase.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.55rem', fontSize: '0.92rem', color: '#2B6CB0' }}>
                        <span style={{ fontWeight: 600 }}>
                          ➕ GST ({payableGstRate}%):
                        </span>
                        <span style={{ fontWeight: 700 }}>₹{payableGst.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1.5px solid #E2E8F0', paddingTop: '0.65rem', marginTop: '0.5rem', fontSize: '1.05rem', fontWeight: 800 }}>
                        <span style={{ color: 'var(--color-primary)' }}>Total to Pay at Gateway:</span>
                        <span style={{ color: 'var(--color-primary)' }}>₹{payableTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={handlePaymentSubmit}
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', backgroundColor: '#5F259F', borderColor: '#5F259F' }}
                >
                  {submitting ? 'Connecting...' : '💳 Pay via PhonePe Gateway'}
                </button>

                <button
                  type="button"
                  onClick={handleMockPayment}
                  disabled={submitting}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '0.85rem', backgroundColor: '#EDF2F7', color: '#4A5568', borderColor: '#CBD5E0', fontSize: '0.9rem' }}
                >
                  🧪 Test Mode: Skip Real Payment
                </button>
              </div>

              {/* Bottom Edit & Back Options */}
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.5rem', marginTop: '1.75rem' }}>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.85rem', textAlign: 'center', fontWeight: 500 }}>
                  Need to change dates, accommodation type, or guest details before paying?
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setStep(2);
                    }}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.8rem 1rem',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      backgroundColor: '#FFFFFF',
                      borderColor: '#CBD5E0'
                    }}
                  >
                    ← Back to Review
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setStep(1);
                    }}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.8rem 1rem',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      backgroundColor: '#FFFFFF',
                      borderColor: '#CBD5E0'
                    }}
                  >
                    ✏️ Edit Stay & Details
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>ℹ️</div>
              <h3 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>No Active Booking Session</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                Please select your dates and devotee details first to proceed to payment.
              </p>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setStep(1);
                }}
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.5rem' }}
              >
                Go to Step 1: Stay & Details
              </button>
            </div>
          )
        )}
      </div>
    </section>
  );
};

export default Booking;
