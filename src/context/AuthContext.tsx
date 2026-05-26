import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { authService } from "../services/auth.service";
import type { LoginRequest, RegisterRequest, AuthData } from "../types/auth.types";

interface AuthUser {
  userId: string;
  name: string;
  email: string;
  accountTier: string;
  avatarUrl: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(data: AuthData): AuthUser {
  return {
    userId: data.userId,
    name: data.username,
    email: data.email,
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

  const logout = useCallback(() => {
    authService.logout();
    localStorage.removeItem("authUser");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
