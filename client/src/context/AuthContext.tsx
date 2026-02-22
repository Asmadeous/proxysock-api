"use client";

import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import * as authService from "../services/railsAuth";
import { isSessionExpired, updateLastActivity, clearToken } from "../lib/railsApi";

interface User {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  profile_picture_url?: string;
  balance?: number;
  currency?: string;
  role?: string | null;
  avatar_url?: string | null;
  status: string;
  country?: string;
  city?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  walletBalance: number;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    password_confirmation: string;
    first_name?: string;
    last_name?: string;
    username: string;
  }) => Promise<void>;
  signInWithOAuth: (provider: "google" | "twitter") => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  handleSessionExpiration: () => void;
  refreshSession: () => Promise<boolean>;
  refreshUserData: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Handle session expiration
  const handleSessionExpiration = () => {
    clearToken();
    setIsAuthenticated(false);
    setUser(null);
    setAccessToken(null);
    setWalletBalance(0);
  };

  // Refresh user data
  const refreshUserData = async (): Promise<void> => {
    try {
      const data = await authService.getCurrentUser();
      if (data) {
        setUser(data.user);
        setWalletBalance(data.wallet_balance);
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  // Refresh session function
  const refreshSession = async (): Promise<boolean> => {
    try {
      const data = await authService.refreshToken();

      if (!data) {
        handleSessionExpiration();
        return false;
      }

      setUser(data.user);
      setAccessToken(data.token);
      setIsAuthenticated(true);
      updateLastActivity();

      return true;
    } catch (error) {
      console.error("Session refresh error:", error);
      handleSessionExpiration();
      return false;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);

      try {
        // Check if we have a stored token
        if (!authService.isAuthenticated()) {
          handleSessionExpiration();
          return;
        }

        // Check session expiration
        if (isSessionExpired()) {
          // Try to refresh
          const refreshed = await refreshSession();
          if (!refreshed) {
            handleSessionExpiration();
            return;
          }
        }

        // Get current user from API
        const data = await authService.getCurrentUser();

        if (data) {
          setUser(data.user);
          setWalletBalance(data.wallet_balance);
          setIsAuthenticated(true);
          updateLastActivity();
        } else {
          handleSessionExpiration();
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        handleSessionExpiration();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Activity tracking
    const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];

    const resetInactivityTimer = () => {
      if (isAuthenticated) {
        updateLastActivity();
      }
    };

    activityEvents.forEach((event) => {
      globalThis.addEventListener(event, resetInactivityTimer);
    });

    const checkInterval = setInterval(() => {
      if (isAuthenticated && isSessionExpired()) {
        refreshSession();
      }
    }, 60000); // Check every minute

    // Session expiration check interval
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "authToken" && e.newValue === null) {
        handleSessionExpiration();
      }
    };

    globalThis.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(checkInterval);
      activityEvents.forEach((event) => {
        globalThis.removeEventListener(event, resetInactivityTimer);
      });
      globalThis.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await authService.login(email, password);

      setUser(data.user);
      setAccessToken(data.token);
      setIsAuthenticated(true);
      updateLastActivity();

      // Fetch wallet balance
      const userData = await authService.getCurrentUser();
      if (userData) {
        setWalletBalance(userData.wallet_balance);
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    password_confirmation: string;
    first_name?: string;
    last_name?: string;
    username: string;
  }) => {
    try {
      const data = await authService.register(userData);

      setUser(data.user);
      setAccessToken(data.token);
      setIsAuthenticated(true);
      updateLastActivity();
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const signInWithOAuth = (provider: "google" | "twitter") => {
    authService.signInWithOAuth(provider);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      handleSessionExpiration();
    }
  };

  const authContextValue = useMemo(
    () => ({
      user,
      walletBalance,
      accessToken,
      isLoading,
      login,
      register,
      signInWithOAuth,
      logout,
      isAuthenticated,
      handleSessionExpiration,
      refreshSession,
      refreshUserData,
    }),
    [user, walletBalance, accessToken, isLoading, isAuthenticated]
  );

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};