import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section style={{ 
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '2rem',
        background: 'linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(245,158,11,0.1) 100%)'
      }}>
        <div className="glass-panel" style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3rem', color: 'var(--color-primary)', marginBottom: '1rem' }}>
            Vadapalli Temple Accommodation
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Experience a peaceful and comfortable stay just minutes away from Sri Venkateswara Swamy Temple, Vadapalli.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/rooms" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              Book Your Stay
            </Link>
            <Link to="/contact" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem' }}>Why Choose Us?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛏️</div>
            <h3>Comfortable Rooms</h3>
            <p style={{ color: 'var(--text-muted)' }}>Well-maintained private rooms and halls designed for families and large groups.</p>
          </div>

          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚶‍♂️</div>
            <h3>Walking Distance</h3>
            <p style={{ color: 'var(--text-muted)' }}>Located extremely close to the temple, perfect for early morning darshan.</p>
          </div>

          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
            <h3>Secure & Safe</h3>
            <p style={{ color: 'var(--text-muted)' }}>A safe environment for families with 24/7 support from the property owner.</p>
          </div>

        </div>
      </section>
    </div>
  );
};

export default Home;
