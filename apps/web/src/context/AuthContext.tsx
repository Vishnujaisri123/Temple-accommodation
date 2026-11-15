import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface OwnerInfo {
  id: string;
  username: string;
  email: string;
  role: string;
  lastLogin?: string;
}

interface AuthContextType {
  owner: OwnerInfo | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDashboardActive: boolean;
  setIsDashboardActive: (active: boolean) => void;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [owner, setOwner] = useState<OwnerInfo | null>(() => {
    const saved = localStorage.getItem('vadapalli_owner_data');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('vadapalli_owner_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDashboardActive, setIsDashboardActive] = useState<boolean>(false);

  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem('vadapalli_owner_token');
    localStorage.removeItem('vadapalli_owner_data');
    setOwner(null);
    setToken(null);
    setIsDashboardActive(false);

    try {
      fetch(`${API_BASE}/admin/logout`, { method: 'POST' }).catch(() => {});
    } catch {}
  }, []);

  // Inactivity auto-logout handler
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (token) {
      inactivityTimerRef.current = setTimeout(() => {
        alert('You have been logged out due to 30 minutes of inactivity.');
        logout();
      }, INACTIVITY_TIMEOUT_MS);
    }
  }, [token, logout]);

  // Set up user activity listeners for inactivity tracking
  useEffect(() => {
    if (!token) return;

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetInactivityTimer();

    activityEvents.forEach(evt => window.addEventListener(evt, handleActivity));
    resetInactivityTimer();

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, handleActivity));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [token, resetInactivityTimer]);

  // Validate session on initial load
  const refreshSession = useCallback(async () => {
    const storedToken = localStorage.getItem('vadapalli_owner_token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/me`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      });
      const data = await res.json();

      if (data.success && data.owner) {
        setOwner(data.owner);
        setToken(storedToken);
      } else {
        logout();
      }
    } catch {
      // If offline or server error, retain token if still valid
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('vadapalli_owner_token', data.token);
        localStorage.setItem('vadapalli_owner_data', JSON.stringify(data.owner));
        setToken(data.token);
        setOwner(data.owner);
        setIsDashboardActive(true);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Authentication failed.' };
      }
    } catch {
      return { success: false, message: 'Unable to connect to the authentication service. Please check your internet connection.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        owner,
        token,
        isAuthenticated: !!token,
        isLoading,
        isDashboardActive,
        setIsDashboardActive,
        login,
        logout,
        refreshSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
