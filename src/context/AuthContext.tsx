import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { authService } from "../services/auth.service";
import { tokenStore } from "../services/token.store";
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
  login: (payload: LoginRequest, rememberMe?: boolean) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
  refreshAccountTier: (newTier: string) => void;
  updateUsername: (newUsername: string) => Promise<void>;
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
    const raw = sessionStorage.getItem("authUser") ?? localStorage.getItem("authUser");
    const user: AuthUser | null = raw ? JSON.parse(raw) : null;
    return user;
  } catch {
    return null;
  }
}

function saveUser(user: AuthUser, rememberMe: boolean) {
  const primary = rememberMe ? localStorage : sessionStorage;
  const secondary = rememberMe ? sessionStorage : localStorage;
  primary.setItem("authUser", JSON.stringify(user));
  secondary.removeItem("authUser");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (payload: LoginRequest, rememberMe = false) => {
    setIsLoading(true);
    try {
      const data = await authService.login(payload, rememberMe);
      const authUser = toAuthUser(data);
      setUser(authUser);
      saveUser(authUser, rememberMe);
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
      saveUser(authUser, true);
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
      saveUser(authUser, true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    localStorage.removeItem("authUser");
    sessionStorage.removeItem("authUser");
    setUser(null);
  }, []);

  const refreshAccountTier = useCallback((newTier: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, accountTier: newTier };
      saveUser(updated, tokenStore.isRemembered());
      return updated;
    });
  }, []);

  const updateUsername = useCallback(async (newUsername: string) => {
    await authService.updateUsername(newUsername);
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, name: newUsername };
      saveUser(updated, tokenStore.isRemembered());
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, googleLogin, logout, refreshAccountTier, updateUsername }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
