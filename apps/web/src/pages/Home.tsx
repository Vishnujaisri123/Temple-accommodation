import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="animate-fade-in">
      {/* Premium Hero Section */}
      <section style={{ 
        minHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '2rem',
        background: 'radial-gradient(circle at 50% 0%, rgba(255, 140, 0, 0.15) 0%, rgba(255, 253, 249, 1) 70%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decorative elements */}
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '300px', height: '300px', background: 'var(--color-primary)', filter: 'blur(100px)', opacity: 0.1, borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '400px', height: '400px', background: 'var(--color-secondary)', filter: 'blur(120px)', opacity: 0.08, borderRadius: '50%' }}></div>

        <div className="glass-panel" style={{ padding: '4rem 3rem', maxWidth: '850px', margin: '0 auto', position: 'relative', zIndex: 1, borderTop: '4px solid var(--color-primary)' }}>
          <p style={{ fontFamily: 'var(--font-telugu)', fontSize: '1.5rem', color: 'var(--color-secondary)', marginBottom: '1rem', fontWeight: '500' }}>
            వాడపల్లి శ్రీ వేంకటేశ్వర స్వామి సన్నిధికి స్వాగతం
          </p>
          <h1 style={{ fontSize: '3.5rem', color: 'var(--text-main)', marginBottom: '1.5rem', letterSpacing: '-0.02em', lineHeight: '1.1' }}>
            Vadapalli Temple Accommodation
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem auto' }}>
            Experience a peaceful and comfortable stay just minutes away from Sri Venkateswara Swamy Temple. A perfect blend of tradition and modern comfort.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/rooms" className="btn btn-primary" style={{ padding: '1.1rem 2.5rem', fontSize: '1.1rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
              Book Your Stay
            </Link>
            <Link to="/contact" className="btn btn-secondary" style={{ padding: '1.1rem 2.5rem', fontSize: '1.1rem', borderColor: 'var(--text-muted)', color: 'var(--text-main)' }}>
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--text-main)' }}>Why Choose Us?</h2>
          <div style={{ width: '60px', height: '4px', background: 'var(--color-primary)', margin: '1rem auto', borderRadius: '2px' }}></div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
          
          <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', borderTop: '4px solid var(--color-primary)' }}>
            <div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem auto', background: 'rgba(255, 140, 0, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Comfortable Rooms</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>Well-maintained private rooms and large air-conditioned halls designed for families and groups of all sizes.</p>
          </div>

          <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', borderTop: '4px solid var(--color-secondary)' }}>
            <div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem auto', background: 'rgba(128, 0, 0, 0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-secondary)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z"/><circle cx="12" cy="9" r="2.5"/></svg>
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Walking Distance</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>Located just minutes away from the temple, making it incredibly convenient for early morning darshan and sevas.</p>
          </div>

          <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', borderTop: '4px solid var(--color-accent)' }}>
            <div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem auto', background: 'rgba(255, 215, 0, 0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B7950B' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Secure & Safe</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>A completely safe and secure environment for your family with 24/7 dedicated support from the property owner.</p>
          </div>

        </div>
      </section>
    </div>
  );
};

export default Home;
