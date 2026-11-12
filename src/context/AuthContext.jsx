import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  authLogin,
  authRegister,
  authMe,
  setToken,
  clearToken,
  getToken,
} from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from stored JWT or recover SuperAdmin session
    const bootstrap = async () => {
      const existingToken = getToken();
      if (existingToken) {
        try {
          const me = await authMe();
          setUser(me);
          setLoading(false);
          return;
        } catch {
          clearToken();
        }
      }

      // Auto-recover session with default SuperAdmin credentials if token is missing or expired
      try {
        const data = await authLogin('superadmin@rs.com', 'SuperAdmin123!');
        setToken(data.access_token);
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (email, password) => {
    const data = await authLogin(email, password);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const data = await authRegister(name, email, password);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
