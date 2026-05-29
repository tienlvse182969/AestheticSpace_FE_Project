import api from "./api";
import type { ApiResponse } from "../types/api.types";
import type { WorkspaceConfig, SaveWorkspaceRequest } from "../types/workspace.types";

export const workspaceService = {
  // Returns all workspace configs for the current user (one per room)
  getAll: async (): Promise<WorkspaceConfig[]> => {
    const { data } = await api.get<ApiResponse<WorkspaceConfig[]>>("/workspace/me");
    return data.data ?? [];
  },

  // Returns the most recently updated workspace (used on app startup)
  getMyWorkspace: async (): Promise<WorkspaceConfig | null> => {
    const configs = await workspaceService.getAll();
    if (configs.length === 0) return null;
    return configs.sort((a, b) => {
      if (!a.updatedAt) return 1;
      if (!b.updatedAt) return -1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    })[0];
  },

  // Returns the saved workspace for a specific room (used when user switches rooms)
  getByRoomId: async (roomId: string): Promise<WorkspaceConfig | null> => {
    const configs = await workspaceService.getAll();
    return configs.find(c => c.roomId === roomId) ?? null;
  },

  saveWorkspace: async (payload: SaveWorkspaceRequest) => {
    const { data } = await api.post<ApiResponse<WorkspaceConfig>>("/workspace/save", payload);
    return data.data;
  },
};
