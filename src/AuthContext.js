import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { setCookie, getCookie, deleteCookie } from './utils/cookies';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getCookie('accessToken') || localStorage.getItem('token'));

  const verifyToken = async (tokenToVerify) => {
    try {
      const response = await fetch('http://localhost:8000/api/token/verify/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenToVerify }),
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const refreshToken = async () => {
    const refreshToken = getCookie('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await fetch('http://localhost:8000/api/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.access);
        localStorage.setItem('token', data.access);
        setCookie('accessToken', data.access);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const login = (userData) => {
    setUser(userData);
    setToken(userData.token);
    localStorage.setItem('token', userData.token);
    setCookie('accessToken', userData.token);
    setCookie('refreshToken', userData.refreshToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    deleteCookie('accessToken');
    deleteCookie('refreshToken');
  };

  const checkAuth = useCallback(async () => {
    const accessToken = getCookie('accessToken');
    if (!accessToken) return false;

    const isValid = await verifyToken(accessToken);
    if (isValid) return true;

    const refreshed = await refreshToken();
    return refreshed;
  }, []);

  // Add initial auth check on component mount
  useEffect(() => {
    const initialAuthCheck = async () => {
      const isAuth = await checkAuth();
      console.log(isAuth);
      if (!isAuth) {
        logout();
      }
    };
    initialAuthCheck();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
