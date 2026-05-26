export interface Background {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  category: string;
  isPremium: boolean;
  createdAt: string;
}

export interface CreateBackgroundRequest {
  name: string;
  url: string;
  thumbnail: string;
  category: string;
  isPremium?: boolean;
}

export interface UpdateBackgroundRequest extends Partial<CreateBackgroundRequest> {}
