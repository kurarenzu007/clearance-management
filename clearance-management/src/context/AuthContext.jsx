import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

const STORAGE_KEY = 'scms_user';

function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const profile = await authService.getCurrentUserProfile();
        if (profile) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
          setUser(profile);
        } else {
          localStorage.removeItem(STORAGE_KEY);
          setUser(null);
        }
      } catch (err) {
        console.error('Session check failed:', err);
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      }
    };

    checkSession();

    // The auth state listener is intentionally minimal — it only handles
    // SIGNED_OUT to clear state. SIGNED_IN is handled inside login() directly
    // to avoid a race where two concurrent users-table fetches block each other.
    const { data: { subscription } } = authService.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const { email, password } = credentials;

      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const { profile } = await authService.signIn(email, password);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      setUser(profile);
      return profile;
    } catch (err) {
      const errorMessage = err.message || 'Invalid credentials';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.signOut();
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Logout failed:', err);
      // Still clear local state even if API call fails
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
      setError(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}