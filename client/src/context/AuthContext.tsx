<<<<<<< HEAD
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
=======

"use client";

import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import { clearSession, updateLastActivity, isSessionExpired, storeSession, getSession } from "../services/auth";
import { loginUser } from "../services/api";
import api from "../services/api";

interface AuthContextType {
  user: any;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'twitter') => Promise<void>;
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  handleSessionExpiration: () => void;
  refreshSession: () => Promise<boolean>;
<<<<<<< HEAD
  refreshUserData: () => Promise<void>;
=======
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
<<<<<<< HEAD
  const [user, setUser] = useState<User | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
=======
  const [user, setUser] = useState<any>(null);
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

<<<<<<< HEAD
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
=======
  // Handle session expiration - without navigation
  const handleSessionExpiration = () => {
    clearSession();
    setIsAuthenticated(false);
    setUser(null);
    setAccessToken(null);
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
  };

  // Refresh session function
  const refreshSession = async (): Promise<boolean> => {
    try {
<<<<<<< HEAD
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
=======
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
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
      handleSessionExpiration();
      return false;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);

      try {
<<<<<<< HEAD
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
=======
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
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
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

<<<<<<< HEAD
    // Activity tracking
=======
    // supabase auth listener removed

>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
    const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];

    const resetInactivityTimer = () => {
      if (isAuthenticated) {
        updateLastActivity();
      }
    };

    activityEvents.forEach((event) => {
      globalThis.addEventListener(event, resetInactivityTimer);
    });

<<<<<<< HEAD
    // Session expiration check interval
=======
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
    const checkInterval = setInterval(() => {
      if (isAuthenticated && isSessionExpired()) {
        handleSessionExpiration();
      }
    }, 30000);

<<<<<<< HEAD
    // Handle storage changes (logout from another tab)
=======
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
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

<<<<<<< HEAD
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
=======
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
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
      console.error("Login failed:", error);
      throw error;
    }
  };

<<<<<<< HEAD
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
=======
  const signInWithOAuth = async (provider: 'google' | 'twitter') => {
    try {
      throw new Error("OAuth not implemented yet");
    } catch (error) {
      console.error(`${provider} OAuth failed:`, error);
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
      throw error;
    }
  };

<<<<<<< HEAD
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
=======
  const logout = async () => {
    try {
      // Backend logout logic placeholder
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      clearSession();
      setUser(null);
      setAccessToken(null);
      setIsAuthenticated(false);
    }
  };

  const authContextValue = useMemo(() => ({
    user,
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
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};