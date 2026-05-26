export interface Theme {
  id: string;
  name: string;
  thumbnail: string;
  backgroundId?: string;
  soundIds?: string[];
  accentColor?: string;
  isPremium: boolean;
  createdAt: string;
}

export interface CreateThemeRequest {
  name: string;
  thumbnail: string;
  backgroundId?: string;
  soundIds?: string[];
  accentColor?: string;
  isPremium?: boolean;
}

export interface UpdateThemeRequest extends Partial<CreateThemeRequest> {}
