import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { authService } from "../services/auth.service";
import type { LoginRequest, RegisterRequest, AuthData } from "../types/auth.types";

interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: string | null;
  accountTier: string;
  avatarUrl: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
  refreshAccountTier: (newTier: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(data: AuthData): AuthUser {
  return {
    userId: data.userId,
    name: data.username,
    email: data.email,
    role: data.role,
    accountTier: data.accountTier,
    avatarUrl: data.avatarUrl,
  };
}

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("authUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (payload: LoginRequest) => {
    setIsLoading(true);
    try {
      const data = await authService.login(payload);
      const authUser = toAuthUser(data);
      setUser(authUser);
      localStorage.setItem("authUser", JSON.stringify(authUser));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterRequest) => {
    setIsLoading(true);
    try {
      const data = await authService.register(payload);
      const authUser = toAuthUser(data);
      setUser(authUser);
      localStorage.setItem("authUser", JSON.stringify(authUser));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const googleLogin = useCallback(async (idToken: string) => {
    setIsLoading(true);
    try {
      const data = await authService.googleLogin(idToken);
      const authUser = toAuthUser(data);
      setUser(authUser);
      localStorage.setItem("authUser", JSON.stringify(authUser));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    localStorage.removeItem("authUser");
    setUser(null);
  }, []);

  const refreshAccountTier = useCallback((newTier: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, accountTier: newTier };
      localStorage.setItem("authUser", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, googleLogin, logout, refreshAccountTier }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
