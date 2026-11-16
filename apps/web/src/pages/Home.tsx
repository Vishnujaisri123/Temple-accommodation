import React, { useState, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';

const TempleCanvas = lazy(() => import('../components/3d/TempleCanvas'));

const TemplePlaceholder: React.FC = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      minHeight: '350px',
      borderRadius: '18px',
      backgroundColor: '#FFFDF9',
      border: '1px solid rgba(197, 160, 89, 0.35)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center'
    }}
  >
    <div
      style={{
        width: '42px',
        height: '42px',
        border: '3px solid #E8DFD5',
        borderTop: '3px solid #701A1E',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '1rem'
      }}
    />
    <div style={{ color: '#701A1E', fontWeight: 600, fontSize: '0.95rem' }}>
      Preparing 3D Temple Experience...
    </div>
    <div style={{ color: '#6B5B52', fontSize: '0.8rem', marginTop: '0.25rem' }}>
      Sri Venkateswara Swamy Sannidhi, Vadapalli
    </div>
  </div>
);

const Home: React.FC = () => {
  // Quick date selector state
  const [quickCheckIn, setQuickCheckIn] = useState('');
  const [quickCheckOut, setQuickCheckOut] = useState('');
  const [selectedAccType, setSelectedAccType] = useState('ALL');

  return (
    <div className="animate-fade-in" style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* 1. Cinematic 3D Temple Hero Section */}
      <section
        style={{
          position: 'relative',
          padding: '2.5rem 1.25rem 4rem 1.25rem',
          backgroundColor: '#FFFDF9',
          borderBottom: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.5rem',
            alignItems: 'center'
          }}
        >
          {/* Hero Left: Sacred Intro & CTAs */}
          <div style={{ zIndex: 2 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(197, 160, 89, 0.12)',
                border: '1px solid var(--color-secondary)',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                color: 'var(--color-primary)',
                fontFamily: 'var(--font-telugu)',
                fontSize: '0.9rem',
                fontWeight: 600,
                marginBottom: '1rem'
              }}
            >
              <span>🪔</span> వాడపల్లి శ్రీ వేంకటేశ్వర స్వామి సన్నిధి
            </div>

            <h1
              className="heading-serif"
              style={{
                fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)',
                color: 'var(--color-primary)',
                lineHeight: 1.15,
                marginBottom: '0.75rem',
                letterSpacing: '-0.01em'
              }}
            >
              Experience Divine Serenity
            </h1>

            <h2
              style={{
                fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
                color: 'var(--color-secondary)',
                fontWeight: 600,
                lineHeight: 1.4,
                marginBottom: '1rem'
              }}
            >
              Stay close to Sri Venkateswara Swamy Temple, Vadapalli
            </h2>

            <p
              style={{
                fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)',
                color: 'var(--text-muted)',
                lineHeight: 1.6,
                marginBottom: '1.5rem'
              }}
            >
              Peaceful private suites and clean individual hall beds located within a <strong>3-minute walk (200 meters)</strong> from the sacred temple gopuram. Attend early morning Suprabhata Seva and darshan in complete peace with personalized owner care.
            </p>

            {/* Badges: Verified Distance & 12h Billing */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '2rem',
                fontSize: '0.85rem'
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: 'rgba(112, 26, 30, 0.06)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  color: 'var(--color-primary)',
                  fontWeight: 600
                }}
              >
                <span>📍</span> 200m from Sanctum Sanctorum
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: 'rgba(197, 160, 89, 0.15)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  color: '#8C6B1F',
                  fontWeight: 600
                }}
              >
                <span>⏱️</span> Flexible 12-Hour Stays
              </div>
            </div>

            {/* CTAs */}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}
            >
              <a
                href="#date-selector"
                className="btn btn-primary"
                style={{
                  padding: '0.9rem 2rem',
                  fontSize: '1.05rem',
                  minHeight: '48px'
                }}
              >
                📅 Book Your Stay
              </a>
              <a
                href="#rooms"
                className="btn btn-secondary"
                style={{
                  padding: '0.9rem 1.75rem',
                  fontSize: '1.05rem',
                  minHeight: '48px',
                  backgroundColor: '#FFFDF9'
                }}
              >
                Explore Rooms & Beds
              </a>
            </div>
          </div>

          {/* Hero Right: 3D Temple Model Showcase */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 'clamp(380px, 50vh, 520px)',
              minHeight: '350px'
            }}
          >
            <Suspense fallback={<TemplePlaceholder />}>
              <TempleCanvas />
            </Suspense>
          </div>
        </div>
      </section>

      {/* 2. Quick Date & Slot Selector */}
      <section
        id="date-selector"
        style={{
          maxWidth: '1120px',
          margin: '-1.5rem auto 3rem auto',
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
            padding: '1.75rem 2rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '1.25rem' }}>✨</span>
            <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--color-primary)' }}>
              Check Stay Availability (12-Hour Billing Slots)
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
              alignItems: 'flex-end'
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Check-in Date & Time
              </label>
              <input
                type="datetime-local"
                className="input-field"
                value={quickCheckIn}
                onChange={(e) => setQuickCheckIn(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Check-out Date & Time
              </label>
              <input
                type="datetime-local"
                className="input-field"
                value={quickCheckOut}
                onChange={(e) => setQuickCheckOut(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Accommodation Preference
              </label>
              <select
                className="input-field"
                value={selectedAccType}
                onChange={(e) => setSelectedAccType(e.target.value)}
              >
                <option value="ALL">All Available Options</option>
                <option value="ROOM">Private Room (Rooms 1 & 2)</option>
                <option value="HALL">Shared Hall (Single Beds)</option>
              </select>
            </div>

            <div>
              <Link
                to={`/rooms${quickCheckIn ? `?checkIn=${encodeURIComponent(quickCheckIn)}&checkOut=${encodeURIComponent(quickCheckOut)}` : ''}`}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem 1rem', minHeight: '44px' }}
              >
                Search Options →
              </Link>
            </div>
          </div>
          <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            ℹ️ All stays are calculated in standard 12-hour intervals for devotee convenience during darshan.
          </p>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
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
        <div className="card" style={{ padding: '2.5rem', borderLeft: '5px solid var(--color-primary)' }}>
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
