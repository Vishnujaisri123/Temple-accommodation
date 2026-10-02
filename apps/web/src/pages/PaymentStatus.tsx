import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'FAILED'>('LOADING');

  useEffect(() => {
    // PhonePe redirects back here. We query our backend for the final status.
    const checkStatus = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${API_BASE}/bookings/status/${id}`);
        const data = await res.json();
        
        if (data.success) {
          if (data.data.bookingStatus === 'CONFIRMED') {
            setStatus('SUCCESS');
          } else if (data.data.bookingStatus === 'REJECTED') {
            setStatus('FAILED');
          } else {
            // Still pending webhook, wait 2 seconds and check again
            setTimeout(checkStatus, 2000);
          }
        }
      } catch (err) {
        setStatus('FAILED');
      }
    };

    if (id) {
      checkStatus();
    } else {
      setStatus('FAILED');
    }
  }, [id]);

  return (
    <div className="animate-fade-in" style={{ padding: '4rem 2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      
      {status === 'LOADING' && (
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Verifying Payment...</h2>
          <p style={{ color: 'var(--text-muted)' }}>Please do not close or refresh this page.</p>
        </div>
      )}

      {status === 'SUCCESS' && (
        <div className="card" style={{ padding: '3rem', borderTop: '4px solid #10b981' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h1 style={{ color: '#10b981', marginBottom: '1rem' }}>Payment Successful!</h1>
          <p style={{ marginBottom: '2rem' }}>Your booking <strong>{id}</strong> is now confirmed. We look forward to hosting you at Vadapalli.</p>
          <Link to={`/status?id=${id}`} className="btn btn-primary">View Booking Details</Link>
        </div>
      )}

      {status === 'FAILED' && (
        <div className="card" style={{ padding: '3rem', borderTop: '4px solid #ef4444' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
          <h1 style={{ color: '#ef4444', marginBottom: '1rem' }}>Payment Failed</h1>
          <p style={{ marginBottom: '2rem' }}>We were unable to process your payment for booking <strong>{id}</strong>. Please try again.</p>
          <Link to="/" className="btn btn-primary">Return Home</Link>
        </div>
      )}

    </div>
  );
};

export default PaymentStatus;
