export interface Room {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  isPremium: boolean;
}

export interface RoomAsset {
  id: string;
  name: string | null;
  type: string | null;
  category: string | null;
  url: string | null;
  defaultVolume: number;
  isPremium: boolean;
  defaultPositionX: number;
  defaultPositionY: number;
  defaultScale: number;
  defaultOpacity: number;
  defaultLayerIndex: number;
}

export interface RoomDetail {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  backgroundUrl: string | null;
  isPremium: boolean;
  assets: RoomAsset[];
}
