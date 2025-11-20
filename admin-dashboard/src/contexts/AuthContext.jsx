import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();

    // Check auth again when window regains focus (helpful after OAuth redirect)
    const handleFocus = () => {
      if (!user) {
        checkAuth();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  const checkAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Checking auth status...');
      const data = await api.checkAuthStatus();
      console.log('📊 Auth response:', data);

      if (data.authenticated) {
        setUser(data.user);
        console.log('✅ User authenticated:', data.user.email);
      } else {
        setUser(null);
        console.log('❌ Not authenticated');
      }
    } catch (err) {
      console.error('❌ Auth check failed:', err);
      setError(err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    // Redirect to Google OAuth
    window.location.href = api.getLoginUrl();
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
