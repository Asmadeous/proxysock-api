
"use client";

import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import { clearSession, updateLastActivity, isSessionExpired, storeSession, getSession } from "../services/auth";
import { loginUser } from "../services/api";
import api from "../services/api";

interface AuthContextType {
  user: any;
  setUser: (user: any) => void;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'twitter') => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  handleSessionExpiration: () => void;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Handle session expiration - without navigation
  const handleSessionExpiration = () => {
    clearSession();
    setIsAuthenticated(false);
    setUser(null);
    setAccessToken(null);
  };

  // Refresh session function
  const refreshSession = async (): Promise<boolean> => {
    if (window.location.pathname.startsWith('/reseller') || window.location.pathname.startsWith('/super-admin')) {
      return false;
    }
    
    try {
      const token = getSession();
      if (!token) {
        handleSessionExpiration();
        return false;
      }
      const { data } = await api.get('/web/api/auth/me');
      if (data.user) {
        setUser(data.user);
        setAccessToken(token);
        setIsAuthenticated(true);
        return true;
      }
      handleSessionExpiration();
      return false;
    } catch (error) {
      console.error('Session refresh error:', error);
      handleSessionExpiration();
      return false;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);

      if (window.location.pathname.startsWith('/reseller') || window.location.pathname.startsWith('/super-admin')) {
        setIsLoading(false);
        return;
      }

      try {
        const token = getSession();
        if (token) {
          // Validate the stored token by calling /me
          const { data } = await api.get('/web/api/auth/me');
          if (data.user) {
            setUser(data.user);
            setAccessToken(token);
            setIsAuthenticated(true);
          } else {
            handleSessionExpiration();
          }
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
        handleSessionExpiration();
      }
    }, 30000);

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

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await loginUser({ email, password, remember_me: rememberMe });
      const { token, user: userData } = response.data;

      // Store the token and update state
      storeSession(token, rememberMe);
      setAccessToken(token);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'twitter') => {
    try {
      throw new Error("OAuth not implemented yet");
    } catch (error) {
      console.error(`${provider} OAuth failed:`, error);
      throw error;
    }
  };

  const setUserState = (userData: any) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("user");
    }
  };

  const logout = async () => {
    try {
      // Backend logout logic placeholder
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      clearSession();
      setUserState(null);
      setAccessToken(null);
      setIsAuthenticated(false);
    }
  };

  const authContextValue = useMemo(() => ({
    user,
    setUser: setUserState,
    accessToken,
    isLoading,
    login,
    signInWithOAuth,
    logout,
    isAuthenticated,
    handleSessionExpiration,
    refreshSession,
  }), [user, accessToken, isLoading, isAuthenticated]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};