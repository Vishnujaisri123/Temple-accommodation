import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface OwnerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OwnerLoginModal: React.FC<OwnerLoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorPin, setTwoFactorPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const result = await login(username, password);
      if (result.success) {
        onClose();
      } else {
        setErrorMessage(result.message || 'Login failed. Please verify your credentials.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(26, 18, 16, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: '440px',
          width: '100%',
          backgroundColor: '#FFFDF9',
          border: '1px solid #D4AF37',
          boxShadow: '0 20px 40px rgba(112, 26, 30, 0.25)',
          padding: '2.5rem 2rem',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#718096',
            padding: '0.25rem'
          }}
          aria-label="Close login dialog"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: 'rgba(112, 26, 30, 0.08)',
              border: '1px solid #C5A059',
              color: '#701A1E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.5rem', color: '#701A1E', margin: 0, fontWeight: 700 }}>
            Owner Access
          </h2>
          <p style={{ color: '#6B5B52', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Vadapalli Temple Accommodation Management Portal
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              color: '#991B1B',
              border: '1px solid #FCA5A5',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
              lineHeight: 1.4
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#231815', marginBottom: '0.35rem' }}>
              Owner Username or Email
            </label>
            <input
              type="text"
              required
              autoFocus
              className="input-field"
              placeholder="e.g. owner or owner@vadapallitemple.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#231815' }}>
                Secure Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', color: '#701A1E', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              className="input-field"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Optional 2FA PIN Accordion */}
          <div style={{ marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setShowTwoFactor(!showTwoFactor)}
              style={{
                background: 'none',
                border: 'none',
                color: '#6B5B52',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: 0
              }}
            >
              <span>{showTwoFactor ? '− Hide Authenticator 2FA' : '+ Add Authenticator 2FA (Optional)'}</span>
            </button>
            {showTwoFactor && (
              <input
                type="text"
                maxLength={6}
                className="input-field"
                placeholder="6-digit authenticator code"
                value={twoFactorPin}
                onChange={(e) => setTwoFactorPin(e.target.value.replace(/\D/g, ''))}
                style={{ marginTop: '0.5rem', letterSpacing: '0.2em', textAlign: 'center', fontWeight: 'bold' }}
                disabled={isSubmitting}
              />
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '0.9rem',
              backgroundColor: '#701A1E',
              color: '#FFFFFF',
              border: 'none',
              boxShadow: '0 4px 15px rgba(112, 26, 30, 0.35)'
            }}
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In to Management'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#A0AEC0', marginTop: '1.5rem', marginBottom: 0 }}>
          🔒 Protected with Rate Limiting & 15-Minute Lockout Defense
        </p>
      </div>
    </div>
  );
};

export default OwnerLoginModal;
