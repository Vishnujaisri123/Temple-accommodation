import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Rooms = () => {
  const [accommodations, setAccommodations] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/accommodations`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setAccommodations(data.data);
      })
      .catch(err => console.error("Error fetching accommodations:", err));
  }, []);

  return (
    <section className="animate-fade-in" style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3rem', color: 'var(--color-primary)' }}>Our Accommodation</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Choose from our private rooms or shared hall beds.</p>
      </div>

      <div className="grid-auto-fit">
        {accommodations.map((acc) => (
          <div key={acc._id} className="card">
            <div style={{ height: '250px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
              {acc.type === 'PRIVATE_ROOM' ? '🛏️' : '🛌'}
            </div>
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>{acc.name}</h2>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                  ₹{acc.pricePerDay}<small style={{color:'var(--text-muted)', fontSize:'0.9rem'}}>{acc.type === 'PRIVATE_ROOM' ? '/day' : '/bed/day'}</small>
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{acc.description}</p>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem', color: 'var(--text-muted)' }}>
                {acc.type === 'PRIVATE_ROOM' ? (
                  <>
                    <li style={{ marginBottom: '0.5rem' }}>👥 Max {acc.capacity.adults} Adults</li>
                    <li style={{ marginBottom: '0.5rem' }}>👶 Up to {acc.capacity.children} children (under 15) allowed</li>
                  </>
                ) : (
                  <>
                    <li style={{ marginBottom: '0.5rem' }}>🛏️ {acc.capacity.adults} Individual Beds available</li>
                    <li style={{ marginBottom: '0.5rem' }}>👥 Book 1 to {acc.capacity.adults} beds</li>
                  </>
                )}
                <li style={{ marginBottom: '0.5rem' }}>🚿 {acc.bathroomType} Bathroom</li>
              </ul>
              <Link to={`/book/${acc._id}`} className={acc.type === 'PRIVATE_ROOM' ? "btn btn-primary" : "btn btn-secondary"} style={{ width: '100%', borderColor: acc.type === 'HALL' ? 'var(--color-primary)' : 'transparent', color: acc.type === 'HALL' ? 'var(--color-primary)' : '#fff' }}>
                {acc.type === 'PRIVATE_ROOM' ? 'Book Now' : 'Check Bed Availability'}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Rooms;
