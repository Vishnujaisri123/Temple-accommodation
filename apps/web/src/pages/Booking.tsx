import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
    checkIn: '',
    checkOut: '',
    adults: 1,
    children: 0,
    childrenAges: [],
    accommodationType: id === 'hall' ? 'HALL' : 'PRIVATE_ROOM',
    accommodationId: 'mock-id-for-now',
    bedIds: []
  });

  const [pricing, setPricing] = useState({ baseAmount: 0, gstAmount: 0, totalAmount: 0 });
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [bookingResponse, setBookingResponse] = useState<any>(null);
  const [utrNumber, setUtrNumber] = useState('');

  // Simulate pricing calculation
  useEffect(() => {
    if (formData.checkIn && formData.checkOut) {
      const start = new Date(formData.checkIn);
      const end = new Date(formData.checkOut);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      
      let base = 0;
      if (formData.accommodationType === 'PRIVATE_ROOM') {
        base = 1000 * days;
      } else {
        base = 300 * Math.max(1, formData.bedIds.length) * days;
      }
      // Assuming 12% GST for demo
      const gst = base * 0.12;
      setPricing({ baseAmount: base, gstAmount: gst, totalAmount: base + gst });
    }
  }, [formData.checkIn, formData.checkOut, formData.accommodationType, formData.bedIds]);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleCreateBooking = async () => {
    if (!acceptedPolicy) {
      alert("You must accept the no-cancellation policy");
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          accommodationId: id, // Pass the accommodation ID from URL params
          bedIds: formData.accommodationType === 'HALL' ? formData.bedIds : undefined,
          policyAccepted: acceptedPolicy
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setBookingResponse(data.data);
        setStep(3);
      } else {
        alert("Booking failed: " + data.message);
      }
    } catch (err) {
      alert("An error occurred while creating the booking.");
    }
  };

  const handlePaymentSubmit = async () => {
    if (!utrNumber) {
      alert("Please enter the UTR / Payment Reference number.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingResponse.bookingId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentReference: utrNumber })
      });
      const data = await res.json();
      
      if (data.success) {
        alert(`Payment submitted successfully! Your Booking ID is ${bookingResponse.bookingId}`);
        navigate('/status');
      } else {
        alert("Failed to submit payment: " + data.message);
      }
    } catch (err) {
      alert("An error occurred while submitting payment.");
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', color: 'var(--color-primary)', marginBottom: '2rem', textAlign: 'center' }}>
        Complete Your Booking
      </h1>

      <div className="card" style={{ padding: '2rem' }}>
        {step === 1 && (
          <form onSubmit={handleNext}>
            <h2 style={{ marginBottom: '1.5rem' }}>Guest Details</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label>Check-in Date</label>
                <input type="date" className="input-field" required value={formData.checkIn} onChange={e => setFormData({...formData, checkIn: e.target.value})} />
              </div>
              <div>
                <label>Check-out Date</label>
                <input type="date" className="input-field" required value={formData.checkOut} onChange={e => setFormData({...formData, checkOut: e.target.value})} />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label>Full Name</label>
              <input type="text" className="input-field" required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label>Mobile Number (Mandatory for owner confirmation)</label>
              <input type="tel" className="input-field" pattern="[0-9]{10}" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label>Address</label>
              <input type="text" className="input-field" required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label>Adults (Max {formData.accommodationType === 'PRIVATE_ROOM' ? '2' : 'No limit'})</label>
                <input type="number" min="1" max={formData.accommodationType === 'PRIVATE_ROOM' ? "2" : "10"} className="input-field" required value={formData.adults} onChange={e => setFormData({...formData, adults: parseInt(e.target.value)})} />
              </div>
              <div>
                <label>Children (Below 15)</label>
                <input type="number" min="0" max={formData.accommodationType === 'PRIVATE_ROOM' ? "2" : "10"} className="input-field" required value={formData.children} onChange={e => setFormData({...formData, children: parseInt(e.target.value)})} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Continue to Review</button>
          </form>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Review & Payment</h2>
            
            <div style={{ backgroundColor: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Room/Bed Charge</span>
                <span>₹{pricing.baseAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>GST (12%)</span>
                <span>₹{pricing.gstAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                <span>Total Amount</span>
                <span style={{ color: 'var(--color-primary)' }}>₹{pricing.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fffbeb', borderLeft: '4px solid var(--color-primary)', borderRadius: 'var(--radius-sm)' }}>
              <strong>Important:</strong> Once your booking is confirmed by the accommodation owner, the booking cannot be cancelled.
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={acceptedPolicy} onChange={e => setAcceptedPolicy(e.target.checked)} style={{ width: '1.25rem', height: '1.25rem' }} />
              <span>I have read and agree to the booking terms and no-cancellation policy.</span>
            </label>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex: 1 }}>Back</button>
              <button onClick={handleCreateBooking} disabled={!acceptedPolicy} className="btn btn-primary" style={{ flex: 2 }}>Proceed to PhonePe</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ marginBottom: '1rem' }}>Complete Payment</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
              Please scan the QR code below or use the UPI ID in your PhonePe app to pay <strong style={{color: 'var(--text-main)'}}>₹{pricing.totalAmount.toFixed(2)}</strong>.
            </p>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ width: '200px', height: '200px', backgroundColor: '#e2e8f0', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                [UPI QR CODE]
              </div>
              <p style={{ marginTop: '0.5rem', fontWeight: 500 }}>UPI ID: vadapalli@ybl</p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label>Enter UTR / Transaction Reference Number</label>
              <input type="text" className="input-field" placeholder="e.g. 30129381203" required value={utrNumber} onChange={e => setUtrNumber(e.target.value)} />
            </div>

            <button onClick={handlePaymentSubmit} className="btn btn-primary" style={{ width: '100%' }}>Submit Payment Details</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Booking;
