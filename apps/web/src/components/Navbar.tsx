import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OwnerLoginModal from './OwnerLoginModal';

interface NavbarProps {
  onOpenOwnerLogin?: () => void;
}

const Navbar: React.FC<NavbarProps> = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isAuthenticated, isDashboardActive, setIsDashboardActive, logout } = useAuth();

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: '#FFFDF9',
          borderBottom: '1px solid var(--border-color)',
          boxShadow: '0 2px 8px rgba(112, 26, 30, 0.04)'
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          {/* Logo & Brand */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: 'var(--color-primary)',
              textDecoration: 'none'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'rgba(112, 26, 30, 0.08)',
                border: '1px solid var(--color-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)'
              }}
            >
              {/* Kalash / Temple Tower Motif */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.2, color: 'var(--color-primary)', letterSpacing: '-0.01em' }}>
                Vadapalli Accommodation
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-telugu)' }}>
                శ్రీ వేంకటేశ్వర స్వామి సన్నిధి
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Link to="/" style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.95rem' }}>
              Home
            </Link>
            <a href="#rooms" style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.95rem' }}>
              Rooms & Beds
            </a>
            <a href="#facilities" style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.95rem' }}>
              Facilities
            </a>
            <Link to="/status" style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.95rem' }}>
              Check Status
            </Link>
            <a href="#location" style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.95rem' }}>
              Location
            </a>

            {/* Authenticated Owner Switcher OR Discreet Owner Login */}
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => setIsDashboardActive(!isDashboardActive)}
                  style={{
                    backgroundColor: isDashboardActive ? '#701A1E' : '#FFFDF9',
                    color: isDashboardActive ? '#FFFFFF' : '#701A1E',
                    border: '1.5px solid #701A1E',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.45rem 0.9rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  {isDashboardActive ? 'View Public Site' : 'Owner Dashboard'}
                </button>
                <button
                  onClick={logout}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#991B1B',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '0.4rem'
                  }}
                  title="Logout"
                >
                  Exit
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-gold)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-muted)',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.2s'
                }}
                title="Management login"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span>Owner</span>
              </button>
            )}
          </nav>

          {/* Mobile menu toggle button */}
          <div className="hide-on-desktop" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isAuthenticated && (
              <button
                onClick={() => setIsDashboardActive(!isDashboardActive)}
                style={{
                  backgroundColor: '#701A1E',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {isDashboardActive ? 'Public' : 'Owner'}
              </button>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-primary)',
                padding: '0.5rem'
              }}
              aria-label="Toggle navigation menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {isMobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </>
                ) : (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: '#FFFDF9',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--text-main)', fontWeight: 500 }}>
              Home
            </Link>
            <a href="#rooms" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--text-main)', fontWeight: 500 }}>
              Rooms & Beds
            </a>
            <a href="#facilities" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--text-main)', fontWeight: 500 }}>
              Facilities
            </a>
            <Link to="/status" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--text-main)', fontWeight: 500 }}>
              Check Booking Status
            </Link>
            <a href="#location" onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--text-main)', fontWeight: 500 }}>
              Temple Location
            </a>
            
            <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              {isAuthenticated ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => {
                      setIsDashboardActive(!isDashboardActive);
                      setIsMobileMenuOpen(false);
                    }}
                    className="btn btn-primary"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                  >
                    {isDashboardActive ? 'Switch to Public Site' : 'Open Owner Dashboard'}
                  </button>
                  <button onClick={logout} style={{ color: '#991B1B', background: 'none', border: 'none', fontWeight: 600 }}>
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsLoginModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border-gold)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem',
                    width: '100%',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  🔒 Owner Login
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Owner Login Modal */}
      <OwnerLoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
};

export default Navbar;
