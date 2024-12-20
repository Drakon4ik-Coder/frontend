// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated && location.pathname !== '/login') {
    return <Navigate to="/login" />;
  }

  if (isAuthenticated && location.pathname === '/login') {
    return <Navigate to="/" />;
  }

  return children;
}