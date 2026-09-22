import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { authService } from '../services/api.js';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<User>;
  register: (displayName: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const status: AuthStatus = loading ? 'loading' : user ? 'authenticated' : 'unauthenticated';

  const refreshUser = async () => {
    console.log('[Fundly Auth] Checking active session via /api/auth/me...');
    try {
      const res = await authService.getMe();
      if (res.success && res.data?.user) {
        console.log('[Fundly Auth] Active session verified:', res.data.user.email);
        setUser(res.data.user);
      } else {
        console.log('[Fundly Auth] No active session (unauthenticated guest).');
        setUser(null);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        console.log('[Fundly Auth] Unauthenticated guest state confirmed.');
      } else {
        console.warn('[Fundly Auth] Session check encountered error or API is starting up:', err.message);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    console.log('[Fundly Auth] Initiating login for:', email);
    setLoading(true);
    try {
      const res = await authService.login({ email, password });
      if (res.success && res.data?.user) {
        console.log('[Fundly Auth] Login successful:', res.data.user.email);
        setUser(res.data.user);
        return res.data.user;
      }
      throw new Error(res.message || 'Login failed: server returned unsuccessful response.');
    } catch (err: any) {
      console.error('[Fundly Auth] Login error:', err);
      const usefulMessage =
        err.response?.data?.message ||
        (err.code === 'ECONNABORTED'
          ? 'API request timed out. Please check server connectivity.'
          : err.message === 'Network Error'
          ? 'Fundly API is currently unreachable. Please check network connection.'
          : err.message || 'Authentication failed. Please verify credentials.');
      const formattedError: any = new Error(usefulMessage);
      formattedError.response = err.response;
      throw formattedError;
    } finally {
      setLoading(false);
    }
  };

  const register = async (displayName: string, email: string, password: string): Promise<User> => {
    console.log('[Fundly Auth] Initiating registration for:', email);
    setLoading(true);
    try {
      const res = await authService.register({ displayName, email, password });
      if (res.success && res.data?.user) {
        console.log('[Fundly Auth] Registration successful:', res.data.user.email);
        setUser(res.data.user);
        return res.data.user;
      }
      throw new Error(res.message || 'Registration failed.');
    } catch (err: any) {
      console.error('[Fundly Auth] Registration error:', err);
      const usefulMessage =
        err.response?.data?.message ||
        (err.code === 'ECONNABORTED'
          ? 'API request timed out. Please check server connectivity.'
          : err.message === 'Network Error'
          ? 'Fundly API is currently unreachable. Please check network connection.'
          : err.message || 'Registration failed. Please try again.');
      const formattedError: any = new Error(usefulMessage);
      formattedError.response = err.response;
      throw formattedError;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    console.log('[Fundly Auth] Logging out session...');
    try {
      await authService.logout();
    } catch (err) {
      console.warn('[Fundly Auth] Logout call warning (clearing local state anyway):', err);
    } finally {
      localStorage.removeItem('fundly_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, status, login, register, logout, refreshUser }}>
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
