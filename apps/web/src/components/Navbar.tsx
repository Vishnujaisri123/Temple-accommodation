import { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="glass-panel" style={{ position: 'sticky', top: '1rem', zIndex: 50, padding: '1rem', margin: '0 1rem 1rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ color: 'var(--color-primary)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Vadapalli Accommodation
          </Link>
        </div>

        {/* Mobile menu button */}
        <button 
          className="hide-on-desktop"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', padding: '0.5rem' }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>

        {/* Desktop Menu */}
        <div className="hide-on-mobile" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link to="/rooms" style={{ fontWeight: 500, color: 'var(--text-muted)' }}>Rooms</Link>
          <Link to="/status" style={{ fontWeight: 500, color: 'var(--text-muted)' }}>Check Status</Link>
          <Link to="/contact" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', borderRadius: 'var(--radius-full)' }}>Contact</Link>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <Link to="/rooms" onClick={() => setIsOpen(false)} style={{ fontWeight: 500, color: 'var(--text-muted)' }}>Rooms</Link>
          <Link to="/status" onClick={() => setIsOpen(false)} style={{ fontWeight: 500, color: 'var(--text-muted)' }}>Check Status</Link>
          <Link to="/contact" onClick={() => setIsOpen(false)} className="btn btn-primary" style={{ textAlign: 'center', width: '100%', borderRadius: 'var(--radius-md)' }}>Contact</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
