export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthData {
  userId: string;
  username: string;
  email: string;
  role: string | null;
  accountTier: string;
  avatarUrl: string | null;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
}
