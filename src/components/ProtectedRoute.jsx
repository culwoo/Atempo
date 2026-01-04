import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireRole = 'performer' }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || (requireRole && user.role !== requireRole)) {
    return <Navigate to="/performer/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
