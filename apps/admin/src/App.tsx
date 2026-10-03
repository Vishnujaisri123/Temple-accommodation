import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const [stats, setStats] = useState({ checkIns: 0, checkOuts: 0, pendingConfirmations: 0, pendingPayments: 0 });

  useEffect(() => {
    fetch(`${API_BASE}/admin/dashboard`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.data);
      });
  }, []);

  return (
    <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
      
      <div className="card">
        <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Today's Check-ins</h3>
        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)', marginTop: '0.5rem' }}>{stats.checkIns}</p>
      </div>
      
      <div className="card">
        <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Pending Confirmations</h3>
        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--status-pending)', marginTop: '0.5rem' }}>{stats.pendingConfirmations}</p>
      </div>

      <div className="card">
        <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase' }}>Available Hall Beds</h3>
        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--status-confirmed)', marginTop: '0.5rem' }}>-</p>
      </div>

    </div>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: '250px', backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border-color)', padding: '1.5rem' }}>
        <h2 style={{ color: 'var(--color-primary)', marginBottom: '2rem', fontSize: '1.25rem' }}>Admin Dashboard</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link to="/" style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', backgroundColor: 'var(--bg-main)' }}>Dashboard</Link>
          <Link to="/bookings" style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)' }}>Bookings</Link>
          <Link to="/rooms" style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)' }}>Rooms & Beds</Link>
          <Link to="/settings" style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)' }}>Settings</Link>
        </nav>
      </aside>
      <main style={{ flex: 1, backgroundColor: 'var(--bg-main)' }}>
        <header style={{ height: '64px', backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 2rem', justifyContent: 'flex-end' }}>
          <span style={{ fontWeight: 500 }}>Owner Account</span>
        </header>
        <div style={{ padding: '2rem' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

const BookingsList = () => {
  const [bookings, setBookings] = useState<any[]>([]);

  const fetchBookings = () => {
    fetch(`${API_BASE}/admin/bookings`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setBookings(data.data);
      });
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleConfirm = async (id: string) => {
    if (!confirm("Are you sure you want to confirm this booking?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/bookings/${id}/confirm`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        alert("Booking confirmed successfully.");
        fetchBookings();
      } else {
        alert("Failed to confirm: " + data.message);
      }
    } catch (err) {
      alert("Error confirming booking.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to completely delete this booking? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/bookings/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert("Booking deleted successfully.");
        fetchBookings();
      } else {
        alert("Failed to delete: " + data.message);
      }
    } catch (err) {
      alert("Error deleting booking.");
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Recent Bookings</h2>
      
      {bookings.length === 0 && <p>No bookings found.</p>}

      {bookings.map(booking => (
        <div key={booking._id} className="card" style={{ marginBottom: '1rem', borderLeft: `4px solid ${booking.bookingStatus === 'CONFIRMED' ? 'var(--status-confirmed)' : 'var(--status-submitted)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                {booking.customerName} 
                <span className={`badge ${booking.bookingStatus === 'CONFIRMED' ? 'bg-confirmed' : 'bg-submitted'}`} style={{ marginLeft: '0.5rem' }}>
                  {booking.bookingStatus.replace('_', ' ')}
                </span>
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Booking ID: {booking.bookingId} | Phone: {booking.phone}</p>
              <p style={{ fontSize: '0.875rem' }}><strong>Stay:</strong> {new Date(booking.checkIn).toLocaleDateString()} → {new Date(booking.checkOut).toLocaleDateString()} ({booking.accommodationType})</p>
              <p style={{ fontSize: '0.875rem' }}><strong>Guests:</strong> {booking.adults} Adults, {booking.children} Child | <strong>Amount:</strong> ₹{booking.totalAmount}</p>
              {booking.paymentReference && (
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'var(--status-submitted)' }}><strong>UTR:</strong> {booking.paymentReference}</p>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button className="btn btn-primary" onClick={() => window.location.href=`tel:${booking.phone}`}>📞 Call Customer</button>
              {booking.bookingStatus === 'PAYMENT_SUBMITTED' && (
                <button className="btn btn-secondary" style={{ backgroundColor: '#10b981', color: 'white' }} onClick={() => handleConfirm(booking._id)}>Verify & Confirm</button>
              )}
              <button className="btn btn-secondary" style={{ backgroundColor: '#ef4444', color: 'white', borderColor: '#dc2626' }} onClick={() => handleDelete(booking._id)}>🗑️ Delete</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bookings" element={<BookingsList />} />
          <Route path="/rooms" element={<div><h2>Rooms Management</h2><p>Manage Prices, Availability Overrides</p></div>} />
          <Route path="/settings" element={<div><h2>Settings</h2><p>Configure GST, Contact details, PhonePe UPI</p></div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
