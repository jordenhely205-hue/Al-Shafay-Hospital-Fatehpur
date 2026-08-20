import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('alshafay_token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success) {
            setUser(res.user);
          } else {
            logout();
          }
        } catch (e) {
          console.warn("Session restore failed, switching to default demo user", e);
          // If token invalid, default to reception
          quickSwitchRole('receptionist');
        }
      } else {
        // Default to reception for demo convenience
        quickSwitchRole('receptionist');
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (username, password) => {
    const res = await api.login(username, password);
    if (res.success) {
      localStorage.setItem('alshafay_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const quickSwitchRole = async (role, doctorId) => {
    try {
      const res = await api.demoLogin(role, doctorId);
      if (res.success) {
        localStorage.setItem('alshafay_token', res.token);
        setToken(res.token);
        setUser(res.user);
      }
    } catch (e) {
      console.error("Demo login switch error:", e);
    }
  };

  const logout = () => {
    localStorage.removeItem('alshafay_token');
    setToken('');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, quickSwitchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
