import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);
const BACKEND_URL = 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authentijob_token');
    const storedUser = localStorage.getItem('authentijob_user');
    if (token && storedUser) {
      fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          if (data.user) setUser(JSON.parse(storedUser));
          else { localStorage.removeItem('authentijob_token'); localStorage.removeItem('authentijob_user'); }
        })
        .catch(() => setUser(JSON.parse(storedUser)))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    setUser(data.user);
    localStorage.setItem('authentijob_token', data.token);
    localStorage.setItem('authentijob_user', JSON.stringify(data.user));
    return data.user;
  };

  const signup = async (name, email, password) => {
    const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    setUser(data.user);
    localStorage.setItem('authentijob_token', data.token);
    localStorage.setItem('authentijob_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authentijob_token');
    localStorage.removeItem('authentijob_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
