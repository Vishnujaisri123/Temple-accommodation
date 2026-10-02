import { useState } from 'react';

const BookingStatus = () => {
  const [searchId, setSearchId] = useState('');
  const [statusResult, setStatusResult] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId) return;

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_BASE}/bookings/status/${searchId}`);
      const data = await res.json();
      
      if (data.success) {
        // Map the backend structure to the UI structure expected
        setStatusResult({
          bookingId: data.data.bookingId,
          customerName: data.data.customerName,
          checkIn: new Date(data.data.checkIn).toLocaleDateString(),
          checkOut: new Date(data.data.checkOut).toLocaleDateString(),
          status: data.data.bookingStatus,
          amount: data.data.totalAmount,
          accommodation: data.data.accommodationType
        });
      } else {
        alert("Booking not found or error occurred.");
        setStatusResult(null);
      }
    } catch (err) {
      alert("Error checking booking status");
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '4rem 2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', color: 'var(--color-primary)', marginBottom: '2rem', textAlign: 'center' }}>
        Check Booking Status
      </h1>

      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSearch}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Booking ID or Mobile Number</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. VAD-2026-00001" 
              required 
              value={searchId} 
              onChange={e => setSearchId(e.target.value)} 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Check Status</button>
        </form>

        {statusResult && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Booking Details</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Booking ID</span>
              <span style={{ fontWeight: 500 }}>{statusResult.bookingId}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Customer Name</span>
              <span style={{ fontWeight: 500 }}>{statusResult.customerName}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Stay Dates</span>
              <span style={{ fontWeight: 500 }}>{statusResult.checkIn} to {statusResult.checkOut}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status</span>
              <span style={{ 
                fontWeight: 'bold', 
                color: statusResult.status === 'CONFIRMED' ? 'var(--status-confirmed)' : 'var(--status-submitted)'
              }}>
                {statusResult.status.replace('_', ' ')}
              </span>
            </div>

            {statusResult.status === 'CONFIRMED' ? (
              <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', borderLeft: '4px solid #10b981', borderRadius: 'var(--radius-sm)' }}>
                Your booking is confirmed. Confirmed bookings cannot be cancelled.
              </div>
            ) : (
              <div style={{ padding: '1rem', backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6', borderRadius: 'var(--radius-sm)' }}>
                Your payment has been submitted. The owner will call you shortly to verify and confirm your booking.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingStatus;
