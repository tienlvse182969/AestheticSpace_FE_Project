export interface Sound {
  id: string;
  name: string;
  url: string;
  category: string;
  duration?: number;
  isPremium: boolean;
  createdAt: string;
}

export interface CreateSoundRequest {
  name: string;
  url: string;
  category: string;
  isPremium?: boolean;
}

export interface UpdateSoundRequest extends Partial<CreateSoundRequest> {}
