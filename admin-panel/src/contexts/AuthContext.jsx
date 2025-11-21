import { createContext, useContext, createSignal, onMount } from 'solid-js';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider(props) {
  const [user, setUser] = createSignal(null);
  const [loading, setLoading] = createSignal(true);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const data = await api.checkAuthStatus();

      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    window.location.href = api.getLoginUrl();
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
      // Use window.location instead of navigate
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  onMount(() => {
    checkAuth();
  });

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {props.children}
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
