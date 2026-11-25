import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, getStoredUser, getStoredToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const token = getStoredToken();
      if (token) {
        try {
          const profile = await authApi.getMe();
          setUser(profile);
        } catch {
          authApi.logout();
          setUser(null);
        }
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    const profile = await authApi.getMe();
    setUser(profile);
    return profile;
  };

  const demoLogin = async (role) => {
    let email = 'patient@medibridge.demo';
    if (role === 'doctor') email = 'doctor@medibridge.demo';
    if (role === 'admin') email = 'admin@medibridge.demo';

    return login(email, 'password123');
  };

  const register = async (payload) => {
    const res = await authApi.register(payload);
    const profile = await authApi.getMe();
    setUser(profile);
    return profile;
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role, loading, login, demoLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

