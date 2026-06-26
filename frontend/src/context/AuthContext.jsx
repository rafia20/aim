import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('aim_user');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  async function signup(email, password) {
    const res = await api.post('/auth/signup', { email, password });
    localStorage.setItem('aim_token', res.data.token);
    localStorage.setItem('aim_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  }

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('aim_token', res.data.token);
    localStorage.setItem('aim_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  }

  function logout() {
    localStorage.removeItem('aim_token');
    localStorage.removeItem('aim_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
