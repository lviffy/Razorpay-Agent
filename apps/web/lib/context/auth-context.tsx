"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuthUser, AuthResponse, LoginCredentials, SignupCredentials } from "../types";
import { api } from "../api/client";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  signup: (credentials: SignupCredentials) => Promise<AuthResponse>;
  loginWithGoogle: (payload?: {
    credential?: string;
    code?: string;
    email?: string;
    fullName?: string;
    avatarUrl?: string;
  }) => Promise<AuthResponse>;
  loginWithSSO: (provider: string, email?: string, fullName?: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  loginWithGoogle: async () => ({ success: false }),
  loginWithSSO: async () => ({ success: false }),
  logout: async () => {},
  refreshUser: async () => {},
});

export const DEFAULT_DEMO_USER: AuthUser = {
  id: "10000000-0000-0000-0000-000000000001",
  email: "merchant@runfast.in",
  name: "Rahul Mehta",
  role: "merchant_owner",
  phone: "+91 98765 00000",
  storeId: "a0000000-0000-0000-0000-000000000001",
  storeName: "RunFast Sports",
  storeCity: "Bengaluru",
  merchantId: "merch_runfast",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveToken = (newToken: string | null) => {
    setToken(newToken);
    if (typeof window !== "undefined") {
      if (newToken) {
        localStorage.setItem("zapai_auth_token", newToken);
        document.cookie = `zapai_auth_token=${newToken}; path=/; max-age=2592000; SameSite=Lax`;
      } else {
        localStorage.removeItem("zapai_auth_token");
        localStorage.removeItem("agentbridge_auth_token");
        document.cookie = "zapai_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "agentbridge_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const storedToken =
        typeof window !== "undefined"
          ? localStorage.getItem("zapai_auth_token") || localStorage.getItem("agentbridge_auth_token")
          : null;
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);
      const res = await api.auth.me();
      if (res && res.user) {
        setUser(res.user);
        if (res.user.storeId && typeof window !== "undefined") {
          localStorage.setItem("zapai_selected_store_id", res.user.storeId);
        }
      } else {
        // Token invalid / expired
        saveToken(null);
        setUser(null);
      }
    } catch (err) {
      console.warn("Session restore warning:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(credentials);
      if (res.success && res.token && res.user) {
        saveToken(res.token);
        setUser(res.user);
        if (res.user.storeId && typeof window !== "undefined") {
          localStorage.setItem("zapai_selected_store_id", res.user.storeId);
        }
        return res;
      }
      return res;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to authenticate with Neon DB.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (credentials: SignupCredentials): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const res = await api.auth.signup(credentials);
      if (res.success && res.token && res.user) {
        saveToken(res.token);
        setUser(res.user);
        if (res.user.storeId && typeof window !== "undefined") {
          localStorage.setItem("zapai_selected_store_id", res.user.storeId);
        }
        return res;
      }
      return res;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to create merchant account.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (payload: {
    credential?: string;
    code?: string;
    email?: string;
    fullName?: string;
    avatarUrl?: string;
  } = {}): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      // Check if Google OAuth URL redirect is available and no explicit payload provided
      if (!payload.credential && !payload.code && !payload.email && typeof window !== "undefined") {
        const googleUrlData = await api.auth.getGoogleUrl();
        if (googleUrlData.configured && googleUrlData.url) {
          window.location.href = googleUrlData.url;
          return { success: true };
        }
      }

      // Direct Google Token / Fallback verification
      const res = await api.auth.google(payload);
      if (res.success && res.token && res.user) {
        saveToken(res.token);
        setUser(res.user);
        if (res.user.storeId && typeof window !== "undefined") {
          localStorage.setItem("zapai_selected_store_id", res.user.storeId);
        }
        return res;
      }
      return res;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Google authentication failed.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithSSO = async (
    _provider: string,
    email?: string,
    fullName?: string
  ): Promise<AuthResponse> => {
    return loginWithGoogle({ email, fullName });
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.warn("Logout API call error:", err);
    } finally {
      saveToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        signup,
        loginWithGoogle,
        loginWithSSO,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
