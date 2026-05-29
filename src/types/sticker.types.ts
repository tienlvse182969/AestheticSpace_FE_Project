export interface Sticker {
  id: string;
  name: string;
  url: string;
  category: string;
  isPremium: boolean;
  createdAt: string;
}

export interface CreateStickerRequest {
  name: string;
  url: string;
  category: string;
  isPremium?: boolean;
}

export interface UpdateStickerRequest extends Partial<CreateStickerRequest> {}
