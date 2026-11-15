import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

interface BookingRecord {
  _id: string;
  bookingId: string;
  customerName: string;
  phone: string;
  address: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  childrenAges?: number[];
  accommodationType: 'PRIVATE_ROOM' | 'HALL';
  accommodationId?: any;
  bedIds?: any[];
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  paymentReference?: string;
  bookingStatus: 'PENDING_PAYMENT' | 'PAYMENT_SUBMITTED' | 'CONFIRMATION_PENDING' | 'CONFIRMED' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
  adminNotes?: string;
}

interface DashboardMetrics {
  totalBookings: number;
  checkIns: number;
  checkOuts: number;
  pendingPayments: number;
  pendingConfirmations: number;
  confirmedBookings: number;
  room1Available: boolean;
  room2Available: boolean;
  hallBedsAvailable: number;
  totalHallBeds: number;
}

interface InventoryData {
  accommodations: Array<{
    _id: string;
    name: string;
    type: string;
    pricePerDay: number;
    active: boolean;
  }>;
  beds: Array<{
    _id: string;
    bedNumber: number;
    pricePerDay: number;
    active: boolean;
  }>;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const OwnerDashboard: React.FC = () => {
  const { token, owner, logout, setIsDashboardActive } = useAuth();
  const [activeTab, setActiveTab] = useState<'bookings' | 'verification' | 'rooms' | 'calendar' | 'settings'>('bookings');
  
  // State
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Detail Modal
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [metricsRes, bookingsRes, invRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/dashboard`, { headers: authHeaders }),
        fetch(`${API_BASE}/admin/bookings`, { headers: authHeaders }),
        fetch(`${API_BASE}/admin/inventory`, { headers: authHeaders }),
        fetch(`${API_BASE}/admin/settings`, { headers: authHeaders })
      ]);

      const [metricsData, bookingsData, invData, settingsData] = await Promise.all([
        metricsRes.json(),
        bookingsRes.json(),
        invRes.json(),
        settingsRes.json()
      ]);

      if (metricsData.success) setMetrics(metricsData.data);
      if (bookingsData.success) setBookings(bookingsData.data);
      if (invData.success) setInventory(invData.data);
      if (settingsData.success) setSettings(settingsData.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Actions
  const handleConfirm = async (id: string) => {
    if (!confirm('Confirm this booking? This will lock the room/beds for the guest.')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/bookings/${id}/confirm`, {
        method: 'PATCH',
        headers: authHeaders
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchDashboardData();
      } else {
        alert('Confirmation failed: ' + data.message);
      }
    } catch {
      alert('Error confirming booking.');
    }
  };

  const handleVerifyPayment = async (id: string) => {
    const utr = prompt('Enter or verify Payment UTR / Transaction Reference:');
    if (utr === null) return;
    try {
      const res = await fetch(`${API_BASE}/admin/bookings/${id}/verify-payment`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ utrReference: utr.trim() })
      });
      const data = await res.json();
      if (data.success) {
        alert('Payment verified! Booking moved to pending confirmation.');
        fetchDashboardData();
      } else {
        alert('Verification failed: ' + data.message);
      }
    } catch {
      alert('Error verifying payment.');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Please enter the reason for rejecting this booking (optional):');
    if (reason === null) return;
    try {
      const res = await fetch(`${API_BASE}/admin/bookings/${id}/reject`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ reason: reason.trim() })
      });
      const data = await res.json();
      if (data.success) {
        alert('Booking rejected.');
        fetchDashboardData();
      } else {
        alert('Failed to reject: ' + data.message);
      }
    } catch {
      alert('Error rejecting booking.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this booking record? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/bookings/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();
      if (data.success) {
        alert('Booking deleted.');
        fetchDashboardData();
      } else {
        alert('Delete failed: ' + data.message);
      }
    } catch {
      alert('Error deleting booking.');
    }
  };

  const handleToggleInventory = async (type: 'accommodation' | 'bed', id: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/inventory/toggle`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ type, id })
      });
      const data = await res.json();
      if (data.success) {
        fetchDashboardData();
      } else {
        alert('Update failed: ' + data.message);
      }
    } catch {
      alert('Error toggling inventory status.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/settings`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        alert('Property settings updated successfully!');
        fetchDashboardData();
      } else {
        alert('Failed to update settings: ' + data.message);
      }
    } catch {
      alert('Error saving settings.');
    }
  };

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === 'ALL' || b.bookingStatus === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      b.customerName.toLowerCase().includes(query) ||
      b.phone.includes(query) ||
      b.bookingId.toLowerCase().includes(query) ||
      (b.paymentReference && b.paymentReference.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="animate-fade-in" style={{ backgroundColor: '#FAF6F0', minHeight: '90vh', padding: '1.5rem 1rem' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        
        {/* Top Control Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#FFFDF9',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🛕</span>
              <h1 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--color-primary)' }}>
                Owner Management Portal
              </h1>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Logged in as <strong>{owner?.username}</strong> ({owner?.email})
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={() => setIsDashboardActive(false)}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              👁️ View Public Website
            </button>
            <button
              onClick={fetchDashboardData}
              className="btn"
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', backgroundColor: '#E2E8F0', color: '#2D3748' }}
              title="Refresh records"
            >
              🔄 Refresh
            </button>
            <button
              onClick={logout}
              className="btn"
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', backgroundColor: '#FEE2E2', color: '#991B1B' }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* 9 Key Operational Metrics Widgets */}
        {metrics && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}
          >
            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--color-primary)' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Total Bookings</span>
              <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '0.25rem' }}>{metrics.totalBookings}</p>
            </div>
            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #2563EB' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Today's Check-ins</span>
              <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#2563EB', marginTop: '0.25rem' }}>{metrics.checkIns}</p>
            </div>
            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #64748B' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Today's Check-outs</span>
              <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#64748B', marginTop: '0.25rem' }}>{metrics.checkOuts}</p>
            </div>
            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #D97706' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Pending Payments</span>
              <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#D97706', marginTop: '0.25rem' }}>{metrics.pendingPayments}</p>
            </div>
            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #7C3AED' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Awaiting Confirmation</span>
              <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#7C3AED', marginTop: '0.25rem' }}>{metrics.pendingConfirmations}</p>
            </div>
            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #15803D' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Confirmed Bookings</span>
              <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#15803D', marginTop: '0.25rem' }}>{metrics.confirmedBookings}</p>
            </div>
            <div className="card" style={{ padding: '1rem', borderLeft: `4px solid ${metrics.room1Available ? '#15803D' : '#B91C1C'}` }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Room 1 Status</span>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: metrics.room1Available ? '#15803D' : '#B91C1C', marginTop: '0.5rem' }}>
                {metrics.room1Available ? '🟢 Available' : '🔴 Occupied/Held'}
              </p>
            </div>
            <div className="card" style={{ padding: '1rem', borderLeft: `4px solid ${metrics.room2Available ? '#15803D' : '#B91C1C'}` }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Room 2 Status</span>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: metrics.room2Available ? '#15803D' : '#B91C1C', marginTop: '0.5rem' }}>
                {metrics.room2Available ? '🟢 Available' : '🔴 Occupied/Held'}
              </p>
            </div>
            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--color-secondary)' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Hall Beds Free</span>
              <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-secondary)', marginTop: '0.25rem' }}>
                {metrics.hallBedsAvailable} / {metrics.totalHallBeds}
              </p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '2px solid var(--border-color)',
            marginBottom: '1.5rem',
            overflowX: 'auto',
            paddingBottom: '0.25rem'
          }}
        >
          <button
            onClick={() => setActiveTab('bookings')}
            style={{
              padding: '0.65rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'bookings' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'bookings' ? '#FFFFFF' : 'var(--text-muted)'
            }}
          >
            📋 All Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            style={{
              padding: '0.65rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'verification' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'verification' ? '#FFFFFF' : 'var(--text-muted)'
            }}
          >
            💳 Payment Verification ({bookings.filter(b => b.bookingStatus === 'PAYMENT_SUBMITTED' || b.bookingStatus === 'CONFIRMATION_PENDING').length})
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            style={{
              padding: '0.65rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'rooms' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'rooms' ? '#FFFFFF' : 'var(--text-muted)'
            }}
          >
            🛏️ Room & Bed Inventory
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            style={{
              padding: '0.65rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'calendar' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'calendar' ? '#FFFFFF' : 'var(--text-muted)'
            }}
          >
            📅 Stay Calendar
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '0.65rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'settings' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'settings' ? '#FFFFFF' : 'var(--text-muted)'
            }}
          >
            ⚙️ Property Settings
          </button>
        </div>

        {/* Tab 1: Bookings Management */}
        {activeTab === 'bookings' && (
          <div className="card" style={{ padding: '1.5rem', backgroundColor: '#FFFDF9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Search name, phone, UTR, ID..."
                  className="input-field"
                  style={{ width: '280px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                  className="input-field"
                  style={{ width: '180px' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PAYMENT_SUBMITTED">Payment Submitted</option>
                  <option value="CONFIRMATION_PENDING">Confirmation Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PENDING_PAYMENT">Pending Payment</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Showing <strong>{filteredBookings.length}</strong> bookings
              </div>
            </div>

            {loading ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading bookings...</p>
            ) : filteredBookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '1.1rem' }}>No bookings found matching current filters.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredBookings.map((b) => (
                  <div
                    key={b._id}
                    className="card"
                    style={{
                      padding: '1.25rem',
                      borderLeft: `5px solid ${
                        b.bookingStatus === 'CONFIRMED'
                          ? 'var(--status-confirmed)'
                          : b.bookingStatus === 'PAYMENT_SUBMITTED'
                          ? 'var(--status-submitted)'
                          : b.bookingStatus === 'REJECTED'
                          ? 'var(--status-rejected)'
                          : 'var(--status-pending)'
                      }`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ flex: '1 1 300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                          <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{b.customerName}</h3>
                          <span
                            className={`badge ${
                              b.bookingStatus === 'CONFIRMED'
                                ? 'badge-confirmed'
                                : b.bookingStatus === 'PAYMENT_SUBMITTED'
                                ? 'badge-submitted'
                                : b.bookingStatus === 'REJECTED'
                                ? 'badge-rejected'
                                : 'badge-pending'
                            }`}
                          >
                            {b.bookingStatus.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          <strong>ID:</strong> {b.bookingId} | <strong>Phone:</strong> {b.phone}
                        </p>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                          <strong>Stay:</strong> {new Date(b.checkIn).toLocaleString()} → {new Date(b.checkOut).toLocaleString()}
                        </p>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                          <strong>Accommodation:</strong> {b.accommodationType === 'HALL' ? 'Shared Hall (Bed Booking)' : 'Private Room'} |{' '}
                          <strong>Guests:</strong> {b.adults} Adults, {b.children} Child | <strong>Amount:</strong> ₹{b.totalAmount}
                        </p>
                        {b.paymentReference && (
                          <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#1E40AF', fontWeight: 600 }}>
                            UTR / Ref: {b.paymentReference} ({b.paymentStatus})
                          </p>
                        )}
                        {b.adminNotes && (
                          <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: '#B91C1C' }}>
                            Notes: {b.adminNotes}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', minWidth: '180px' }}>
                        <a
                          href={`tel:${b.phone}`}
                          className="btn btn-primary"
                          style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                        >
                          📞 Call Customer
                        </a>
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="btn"
                          style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', backgroundColor: '#F1F5F9', color: '#334155' }}
                        >
                          🔍 View Details
                        </button>
                        {b.bookingStatus !== 'CONFIRMED' && (
                          <button
                            onClick={() => handleConfirm(b._id)}
                            className="btn"
                            style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', backgroundColor: '#15803D', color: '#FFFFFF' }}
                          >
                            ✅ Confirm Booking
                          </button>
                        )}
                        {b.bookingStatus === 'PENDING_PAYMENT' && (
                          <button
                            onClick={() => handleVerifyPayment(b._id)}
                            className="btn"
                            style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', backgroundColor: '#2563EB', color: '#FFFFFF' }}
                          >
                            💳 Verify Payment
                          </button>
                        )}
                        {b.bookingStatus !== 'REJECTED' && (
                          <button
                            onClick={() => handleReject(b._id)}
                            className="btn"
                            style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', backgroundColor: '#F97316', color: '#FFFFFF' }}
                          >
                            ⛔ Reject
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(b._id)}
                          className="btn"
                          style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', backgroundColor: '#FEE2E2', color: '#991B1B' }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Payment Verification Queue */}
        {activeTab === 'verification' && (
          <div className="card" style={{ padding: '1.5rem', backgroundColor: '#FFFDF9' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
              Payment Verification Stream
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Review customer-submitted UPI / PhonePe UTR transactions. Verify against bank account before calling customer to confirm booking.
            </p>

            {bookings.filter(b => b.bookingStatus === 'PAYMENT_SUBMITTED' || b.paymentStatus === 'SUBMITTED').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '1.1rem' }}>🎉 No pending payment submissions right now. All caught up!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {bookings
                  .filter(b => b.bookingStatus === 'PAYMENT_SUBMITTED' || b.paymentStatus === 'SUBMITTED')
                  .map((b) => (
                    <div key={b._id} className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #2563EB' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{b.customerName}</h3>
                          <p style={{ margin: '0.2rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Booking ID: <strong>{b.bookingId}</strong> | Phone: <strong>{b.phone}</strong>
                          </p>
                          <div style={{ backgroundColor: '#EFF6FF', padding: '0.5rem 0.75rem', borderRadius: '6px', margin: '0.5rem 0' }}>
                            <span style={{ fontSize: '0.85rem', color: '#1E40AF' }}>
                              Submitted UTR / Ref: <strong>{b.paymentReference || 'Not provided'}</strong>
                            </span>
                            <div style={{ fontSize: '0.85rem', color: '#1E40AF', marginTop: '0.2rem' }}>
                              Amount Expected: <strong>₹{b.totalAmount}</strong>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <a href={`tel:${b.phone}`} className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}>
                            📞 Call
                          </a>
                          <button
                            onClick={() => handleConfirm(b._id)}
                            className="btn btn-primary"
                            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', backgroundColor: '#15803D' }}
                          >
                            ✅ Verify & Confirm
                          </button>
                          <button
                            onClick={() => handleReject(b._id)}
                            className="btn"
                            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', backgroundColor: '#FEE2E2', color: '#991B1B' }}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Room & Bed Management */}
        {activeTab === 'rooms' && (
          <div className="card" style={{ padding: '1.5rem', backgroundColor: '#FFFDF9' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
              Room & Bed Inventory Controls
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Toggle active availability of rooms and hall beds. Disabled accommodations cannot be selected or booked by visitors on the public site.
            </p>

            <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Private Rooms
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {inventory?.accommodations.map((acc) => (
                <div key={acc._id} className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{acc.name}</h4>
                      <p style={{ margin: '0.2rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        ₹{acc.pricePerDay} / day • Attached Bathroom
                      </p>
                      <span className={`badge ${acc.active ? 'badge-confirmed' : 'badge-rejected'}`}>
                        {acc.active ? 'Open for Booking' : 'Closed / Maintenance'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleInventory('accommodation', acc._id)}
                      className="btn"
                      style={{
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.8rem',
                        backgroundColor: acc.active ? '#FEE2E2' : '#DCFCE7',
                        color: acc.active ? '#991B1B' : '#166534'
                      }}
                    >
                      {acc.active ? 'Disable' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Shared Hall Beds (5 Beds)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {inventory?.beds.map((bed) => (
                <div key={bed._id} className="card" style={{ padding: '1rem', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🛏️</div>
                  <h4 style={{ margin: 0, fontSize: '1rem' }}>Bed #{bed.bedNumber}</h4>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹{bed.pricePerDay} / day</p>
                  <div style={{ margin: '0.5rem 0' }}>
                    <span className={`badge ${bed.active ? 'badge-confirmed' : 'badge-rejected'}`}>
                      {bed.active ? 'Active' : 'Locked'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleInventory('bed', bed._id)}
                    className="btn"
                    style={{
                      width: '100%',
                      padding: '0.35rem 0.5rem',
                      fontSize: '0.75rem',
                      backgroundColor: bed.active ? '#FEE2E2' : '#DCFCE7',
                      color: bed.active ? '#991B1B' : '#166534'
                    }}
                  >
                    {bed.active ? 'Block Bed' : 'Unblock Bed'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Booking Calendar */}
        {activeTab === 'calendar' && (
          <div className="card" style={{ padding: '1.5rem', backgroundColor: '#FFFDF9' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
              Stay Schedule & Reservations
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Chronological log of confirmed customer bookings and stay dates.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {bookings
                .filter(b => b.bookingStatus === 'CONFIRMED')
                .map((b) => (
                  <div
                    key={b._id}
                    style={{
                      padding: '1rem',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}
                  >
                    <div>
                      <strong>{new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}</strong>
                      <span style={{ marginLeft: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                        {b.accommodationType === 'HALL' ? 'Shared Hall' : 'Private Room'}
                      </span>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Guest: {b.customerName} ({b.phone}) • {b.adults} Adults
                      </div>
                    </div>
                    <a href={`tel:${b.phone}`} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                      📞 Call
                    </a>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Tab 5: Property Settings */}
        {activeTab === 'settings' && settings && (
          <div className="card" style={{ padding: '1.5rem', backgroundColor: '#FFFDF9' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
              Property Details & Configuration
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Update contact numbers, WhatsApp helpline, pricing, and GST settings for the public website.
            </p>

            <form onSubmit={handleSaveSettings}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Property Title
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={settings.propertyName || ''}
                    onChange={(e) => setSettings({ ...settings, propertyName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={settings.phone || ''}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    WhatsApp Support Number
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={settings.whatsapp || ''}
                    onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Google Maps Link
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={settings.mapUrl || ''}
                    onChange={(e) => setSettings({ ...settings, mapUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    UPI ID for Customer Payments
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={settings.upiId || ''}
                    onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    UPI Payee Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={settings.upiName || ''}
                    onChange={(e) => setSettings({ ...settings, upiName: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Property Physical Address
                </label>
                <textarea
                  rows={2}
                  className="input-field"
                  value={settings.address || ''}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={settings.gstEnabled || false}
                    onChange={(e) => setSettings({ ...settings, gstEnabled: e.target.checked })}
                  />
                  Enable GST on Bookings
                </label>
                {settings.gstEnabled && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="number"
                      className="input-field"
                      style={{ width: '80px' }}
                      value={settings.gstPercent || 0}
                      onChange={(e) => setSettings({ ...settings, gstPercent: Number(e.target.value) })}
                    />
                    <span>% GST</span>
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary">
                💾 Save Property Settings
              </button>
            </form>
          </div>
        )}

        {/* Booking Details Modal */}
        {selectedBooking && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
            onClick={() => setSelectedBooking(null)}
          >
            <div
              className="card"
              style={{
                maxWidth: '540px',
                width: '100%',
                backgroundColor: '#FFFDF9',
                padding: '2rem',
                position: 'relative',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedBooking(null)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                ✕
              </button>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>
                Booking Details: {selectedBooking.bookingId}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div><strong>Customer Name:</strong> {selectedBooking.customerName}</div>
                <div><strong>Phone Number:</strong> <a href={`tel:${selectedBooking.phone}`}>{selectedBooking.phone}</a></div>
                <div><strong>Address:</strong> {selectedBooking.address}</div>
                <div><strong>Check-in:</strong> {new Date(selectedBooking.checkIn).toLocaleString()}</div>
                <div><strong>Check-out:</strong> {new Date(selectedBooking.checkOut).toLocaleString()}</div>
                <div><strong>Guests:</strong> {selectedBooking.adults} Adults, {selectedBooking.children} Children</div>
                <div><strong>Accommodation:</strong> {selectedBooking.accommodationType}</div>
                <div><strong>Base Fare:</strong> ₹{selectedBooking.baseAmount}</div>
                <div><strong>GST Amount:</strong> ₹{selectedBooking.gstAmount}</div>
                <div><strong>Total Amount:</strong> ₹{selectedBooking.totalAmount}</div>
                <div><strong>Payment Status:</strong> {selectedBooking.paymentStatus}</div>
                <div><strong>Payment Reference:</strong> {selectedBooking.paymentReference || 'None'}</div>
                <div><strong>Booking Status:</strong> {selectedBooking.bookingStatus}</div>
                <div><strong>Submitted At:</strong> {new Date(selectedBooking.createdAt).toLocaleString()}</div>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <a href={`tel:${selectedBooking.phone}`} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                  📞 Call Customer
                </a>
                <button onClick={() => setSelectedBooking(null)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OwnerDashboard;
