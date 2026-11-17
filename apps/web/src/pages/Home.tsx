import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  DateTimeAvailabilitySelector
} from '../components/booking/DateTimeAvailabilitySelector';
import type { AvailabilityData } from '../components/booking/DateTimeAvailabilitySelector';
import { toKolkataIsoString } from '../utils/dateTime';

gsap.registerPlugin(ScrollTrigger);

const CinematicTempleJourney = lazy(() => import('../components/3d/CinematicTempleJourney'));

const JourneyPlaceholder: React.FC = () => (
  <div
    style={{
      width: '100%',
      height: '100vh',
      backgroundColor: '#120C0A',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#FFFDF9',
      padding: '2rem',
      textAlign: 'center'
    }}
  >
    <div
      style={{
        width: '46px',
        height: '46px',
        border: '3px solid rgba(197, 160, 89, 0.3)',
        borderTop: '3px solid #C5A059',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '1rem'
      }}
    />
    <style>{`
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    `}</style>
    <div style={{ fontFamily: 'var(--font-telugu)', color: '#FFD700', fontSize: '1.25rem', marginBottom: '0.4rem' }}>
      వాడపల్లి శ్రీ వేంకటేశ్వర స్వామి సన్నిధి
    </div>
    <div style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '0.04em' }}>
      Loading 3D Cinematic Darshan Experience...
    </div>
  </div>
);

const Home: React.FC = () => {
  // Quick date selector state (Asia/Kolkata)
  const [quickCheckInDate, setQuickCheckInDate] = useState('');
  const [quickCheckInTime, setQuickCheckInTime] = useState('');
  const [quickDurationHours, setQuickDurationHours] = useState(12);
  const [selectedAccType, setSelectedAccType] = useState<'ALL' | 'PRIVATE_ROOM' | 'HALL'>('ALL');
  const [homeAvailability, setHomeAvailability] = useState<AvailabilityData | null>(null);

  const { homeCheckInIso, homeCheckOutIso } = useMemo(() => {
    if (!quickCheckInDate || !quickCheckInTime) return { homeCheckInIso: '', homeCheckOutIso: '' };
    const inIso = toKolkataIsoString(quickCheckInDate, quickCheckInTime);
    const inD = new Date(inIso);
    const outD = new Date(inD.getTime() + quickDurationHours * 60 * 60 * 1000);
    return {
      homeCheckInIso: inIso,
      homeCheckOutIso: outD.toISOString()
    };
  }, [quickCheckInDate, quickCheckInTime, quickDurationHours]);

  // GSAP Smooth ScrollTrigger Reveals for Below-the-Hero Sections
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Date Selector card reveal
      gsap.fromTo(
        '#date-selector',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '#date-selector',
            start: 'top 88%',
            toggleActions: 'play none none none'
          }
        }
      );

      // 2. Accommodation Cards staggered glide-in
      gsap.fromTo(
        '#rooms .card',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.16,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '#rooms',
            start: 'top 82%',
            toggleActions: 'play none none none'
          }
        }
      );

      // 3. Facilities Grid items
      gsap.fromTo(
        '#facilities-grid > div',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '#facilities',
            start: 'top 82%',
            toggleActions: 'play none none none'
          }
        }
      );

      // 4. Guidelines Card
      gsap.fromTo(
        '#guidelines-card',
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '#guidelines-card',
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );

      // 5. Location Section Card
      gsap.fromTo(
        '#location .card',
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '#location',
            start: 'top 82%',
            toggleActions: 'play none none none'
          }
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="animate-fade-in" style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* 1. Full-Screen Cinematic 3D Temple & Sanctum Darshan Scroll Journey */}
      <Suspense fallback={<JourneyPlaceholder />}>
        <CinematicTempleJourney />
      </Suspense>

      {/* 2. Quick Date & Slot Selector (Smoothly transitions below the 3D journey) */}
      <section
        id="date-selector"
        style={{
          maxWidth: '1120px',
          margin: '3rem auto',
          padding: '0 1.25rem',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div
          className="card"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1.5px solid var(--color-secondary)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: '2rem 2.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '1.35rem' }}>🛕</span>
            <h2 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--color-primary)' }}>
              Check Stay Availability (12-Hour Billing Slots)
            </h2>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Book your accommodation just 200 meters from the temple. All stays are scheduled in 12-hour intervals for devotee convenience during darshan and sevas.
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            <DateTimeAvailabilitySelector
              checkInDate={quickCheckInDate}
              onCheckInDateChange={setQuickCheckInDate}
              checkInTime={quickCheckInTime}
              onCheckInTimeChange={setQuickCheckInTime}
              durationHours={quickDurationHours}
              onDurationHoursChange={setQuickDurationHours}
              accommodationTypeFilter={selectedAccType}
              onAvailabilityChange={setHomeAvailability}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              borderTop: '1px solid #E2E8F0',
              paddingTop: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Filter Preference:
              </label>
              <select
                className="input-field"
                value={selectedAccType}
                onChange={(e) => setSelectedAccType(e.target.value as any)}
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.88rem', width: 'auto' }}
              >
                <option value="ALL">All Accommodations</option>
                <option value="PRIVATE_ROOM">Private Rooms (Rooms 1 & 2)</option>
                <option value="HALL">Shared Hall (5 Beds)</option>
              </select>
            </div>

            <div>
              <Link
                to={
                  quickCheckInDate && quickCheckInTime
                    ? `/book${selectedAccType === 'HALL' ? '/hall' : ''}?checkIn=${encodeURIComponent(homeCheckInIso)}&checkOut=${encodeURIComponent(homeCheckOutIso)}`
                    : '/rooms'
                }
                className="btn btn-primary"
                style={{
                  padding: '0.75rem 1.75rem',
                  fontSize: '0.95rem',
                  opacity: homeAvailability?.allUnavailable ? 0.6 : 1,
                  pointerEvents: homeAvailability?.allUnavailable ? 'none' : 'auto'
                }}
              >
                {homeAvailability?.allUnavailable
                  ? 'Slot Fully Booked'
                  : quickCheckInDate && quickCheckInTime
                  ? 'Proceed to Reserve Selected Slot →'
                  : 'Check Availability & Book →'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Accommodation Inventory Cards */}
      <section id="rooms" style={{ maxWidth: '1240px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>
            Sacred Living
          </span>
          <h2 className="heading-serif" style={{ fontSize: '2.25rem', color: 'var(--color-primary)', marginTop: '0.25rem' }}>
            Available Accommodations
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0.5rem auto 0 auto' }}>
            Carefully curated rooms and clean hall beds designed for family peace and devotee pilgrimage comfort.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* Card 1: Room 1 */}
          <div className="card card-maroon-accent" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.75rem 1.5rem', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--color-primary)' }}>Room 1</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Private Family Suite</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>₹1,000</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>/ 12 hours</span>
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Spacious private room featuring an attached western bathroom, clean linen, and ample ventilation. Ideal for couples or small families visiting the shrine.
              </p>

              <div style={{ backgroundColor: 'var(--bg-main)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <div style={{ margin: '0.25rem 0' }}>👥 <strong>Capacity:</strong> Max 2 Adults & up to 2 Children (below 15)</div>
                <div style={{ margin: '0.25rem 0' }}>🚿 <strong>Bathroom:</strong> Attached private bathroom with geyser</div>
                <div style={{ margin: '0.25rem 0' }}>⚡ <strong>Amenities:</strong> Power backup, ceiling fan, RO water</div>
              </div>

              <Link to="/book/room1" className="btn btn-primary" style={{ width: '100%', minHeight: '44px' }}>
                Book Room 1
              </Link>
            </div>
          </div>

          {/* Card 2: Room 2 */}
          <div className="card card-maroon-accent" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.75rem 1.5rem', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--color-primary)' }}>Room 2</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Private Family Suite</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>₹1,000</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>/ 12 hours</span>
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Peaceful and quiet private room with attached bathroom, clean bedding, and private entrance. Designed for complete family privacy and spiritual tranquility.
              </p>

              <div style={{ backgroundColor: 'var(--bg-main)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <div style={{ margin: '0.25rem 0' }}>👥 <strong>Capacity:</strong> Max 2 Adults & up to 2 Children (below 15)</div>
                <div style={{ margin: '0.25rem 0' }}>🚿 <strong>Bathroom:</strong> Attached private bathroom with geyser</div>
                <div style={{ margin: '0.25rem 0' }}>⚡ <strong>Amenities:</strong> Power backup, ceiling fan, fresh towels</div>
              </div>

              <Link to="/book/room2" className="btn btn-primary" style={{ width: '100%', minHeight: '44px' }}>
                Book Room 2
              </Link>
            </div>
          </div>

          {/* Card 3: Shared Hall (5 Individual Beds) */}
          <div className="card card-gold-accent" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.75rem 1.5rem', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--color-primary)' }}>Devotee Hall</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>5 Independent Beds</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-secondary)' }}>₹300</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>per bed / 12 hours</span>
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Airy and well-kept community hall offering 5 independently bookable single cots with comfortable mattresses. Perfect for solo pilgrims or group members.
              </p>

              <div style={{ backgroundColor: 'var(--bg-main)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <div style={{ margin: '0.25rem 0' }}>🛏️ <strong>Beds:</strong> 5 Single cots (Bed #1 to #5) bookable individually</div>
                <div style={{ margin: '0.25rem 0' }}>🚿 <strong>Bathroom:</strong> Clean shared normal bathroom</div>
                <div style={{ margin: '0.25rem 0' }}>⚡ <strong>Amenities:</strong> Mobile charging points, ceiling fans</div>
              </div>

              <Link to="/book/hall" className="btn btn-gold" style={{ width: '100%', minHeight: '44px' }}>
                Select Hall Beds
              </Link>
            </div>
          </div>

        </div>

        {/* Note: There is no small room */}
        <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          📌 <em>Notice: We offer Room 1, Room 2, and the 5-Bed Hall only. There are no other room categories on this property.</em>
        </div>
      </section>

      {/* 4. Room Facilities & Amenities */}
      <section id="facilities" style={{ backgroundColor: '#FFFDF9', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '4rem 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-secondary)', fontWeight: 700 }}>
              Devotee Comfort
            </span>
            <h2 className="heading-serif" style={{ fontSize: '2rem', color: 'var(--color-primary)' }}>
              Accommodation Facilities
            </h2>
          </div>

          <div id="facilities-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚿</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>Hot & Running Water</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                24/7 uninterrupted water supply with water heaters/geysers for early morning temple snanam.
              </p>
            </div>

            <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>Power Backup</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Automatic inverter and generator backup ensuring light and fans during power outages.
              </p>
            </div>

            <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚰</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>Pure RO Drinking Water</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Hygienic and purified drinking water available round the clock for all guests.
              </p>
            </div>

            <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚗</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>Safe Vehicle Parking</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Spacious and secure parking space for four-wheelers and two-wheelers right at the property.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Booking Information & Policy */}
      <section style={{ maxWidth: '1080px', margin: '0 auto', padding: '4rem 1.5rem' }}>
        <div id="guidelines-card" className="card" style={{ padding: '2.5rem', borderLeft: '5px solid var(--color-primary)' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '1rem' }}>
            Important Booking & Confirmation Guidelines
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
            <div>
              <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.4rem' }}>1. Slot Duration & Timings</h4>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                All room and bed bookings are scheduled in <strong>12-hour slots</strong>. Please specify your exact arrival and departure times so we can prepare your accommodation.
              </p>
            </div>
            <div>
              <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.4rem' }}>2. Owner Verification Call</h4>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                After you submit your payment reference or PhonePe receipt, the property owner will personally call your mobile number to confirm your room and arrival details.
              </p>
            </div>
            <div>
              <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.4rem' }}>3. Non-Cancellation Policy</h4>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                Once your booking has been verified and marked as <strong>CONFIRMED</strong> by the owner, it is securely locked and <strong>cannot be cancelled</strong>.
              </p>
            </div>
            <div>
              <h4 style={{ color: 'var(--color-primary)', marginBottom: '0.4rem' }}>4. ID Proof Requirement</h4>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                Every adult devotee checking in is requested to carry a government-issued photo ID (Aadhaar or Voter ID) for register entry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Temple Location & Map */}
      <section id="location" style={{ backgroundColor: '#FFFDF9', borderTop: '1px solid var(--border-color)', padding: '4rem 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-secondary)', fontWeight: 700 }}>
              Convenient Proximity
            </span>
            <h2 className="heading-serif" style={{ fontSize: '2rem', color: 'var(--color-primary)' }}>
              Walking Distance to Vadapalli Temple
            </h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0.5rem auto 0 auto' }}>
              Located just 200 meters from the famous Sri Venkateswara Swamy Temple (known as Chinnathirupathi).
            </p>
          </div>

          <div className="card" style={{ padding: '2rem', backgroundColor: 'var(--bg-main)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
                  Sri Venkateswara Swamy Sannidhi, Vadapalli
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                  Dr. B.R. Ambedkar Konaseema District, Andhra Pradesh 533237.<br />
                  Devotees can easily reach the sanctum sanctorum within 3 minutes on foot for Suprabhata Seva and Sarva Darshanam without requiring local transport.
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <a
                    href="https://maps.google.com/?q=Vadapalli+Venkateswara+Swamy+Temple"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem', padding: '0.65rem 1.25rem', minHeight: '44px' }}
                  >
                    🗺️ Open in Google Maps
                  </a>
                  <a
                    href="tel:918555085539"
                    className="btn btn-primary"
                    style={{ fontSize: '0.85rem', padding: '0.65rem 1.25rem', minHeight: '44px' }}
                  >
                    📞 Call for Route Directions
                  </a>
                </div>
              </div>

              <div style={{ textAlign: 'center', backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📍</div>
                <h4 style={{ margin: 0, color: 'var(--color-primary)', fontSize: '1.1rem' }}>Location Landmark</h4>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Near Temple Car Street / Main Gopuram approach, Vadapalli.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Contact & WhatsApp Direct Action */}
      <section style={{ maxWidth: '850px', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2 className="heading-serif" style={{ fontSize: '2rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
          Need Immediate Assistance or Have Questions?
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Our property manager is available to help with your booking, custom group requirements, or arrival queries.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="tel:918555085539"
            className="btn btn-primary"
            style={{ padding: '0.85rem 1.75rem', fontSize: '1rem', minHeight: '44px' }}
          >
            📞 Call +91 85550 85539
          </a>
          <a
            href="https://wa.me/918555085539?text=Namaste,%20I%20need%20assistance%20with%20Vadapalli%20Temple%20Accommodation."
            target="_blank"
            rel="noreferrer"
            className="btn"
            style={{
              padding: '0.85rem 1.75rem',
              fontSize: '1rem',
              minHeight: '44px',
              backgroundColor: '#15803D',
              color: '#FFFFFF'
            }}
          >
            💬 WhatsApp Us
          </a>
        </div>
      </section>

      {/* 8. Footer */}
      <footer style={{ backgroundColor: '#1A1210', color: '#E2E8F0', padding: '3rem 1.5rem 2rem 1.5rem', borderTop: '3px solid var(--color-secondary)' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h3 style={{ color: '#FFFFFF', margin: 0, fontSize: '1.15rem' }}>
              Vadapalli Temple Accommodation
            </h3>
            <p style={{ color: '#A0AEC0', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
              Sri Venkateswara Swamy Temple Pilgrimage Lodging • Vadapalli, AP
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
            <Link to="/status" style={{ color: '#E2E8F0' }}>Check Status</Link>
            <Link to="/contact" style={{ color: '#E2E8F0' }}>Contact</Link>
            <a href="#rooms" style={{ color: '#E2E8F0' }}>Rooms</a>
          </div>
        </div>

        <div style={{ maxWidth: '1240px', margin: '2rem auto 0 auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.75rem', color: '#718096' }}>
          <div>
            © {new Date().getFullYear()} Vadapalli Sri Venkateswara Swamy Accommodation. All Rights Reserved.
          </div>
          <div>
            Govt. ID verification mandatory at check-in.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
