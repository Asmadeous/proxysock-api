"use client";

import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";
import { isSessionExpired } from "../services/auth";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Check session on component mount and when route changes
  useEffect(() => {
    // If we have a session but it's expired, force logout
    if (isAuthenticated && isSessionExpired()) {
      logout().then(() => {
        navigate("/login", { state: { from: location.pathname }, replace: true });
      });
    }
  }, [isAuthenticated, logout, navigate, location.pathname]);

  if (isLoading) {
    return <LoadingSpinner />; // Show loading spinner while checking auth status
  }

  if (!isAuthenticated) {
    // Redirect to login page with the current location as the return path
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />; // Render the protected route
}
