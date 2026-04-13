import apiClient from './client';

export interface SharedLink {
  id: string;
  projectId: string;
  shareToken: string;
  platform: string | null;
  isActive: boolean;
  viewCount: number;
  createdAt: string;
}

export const sharingApi = {
  createShare: (projectId: string, platform?: string) =>
    apiClient.post<SharedLink>(`/sharing/${projectId}`, { platform }),

  getLinks: (projectId: string) =>
    apiClient.get<SharedLink[]>(`/sharing/links/${projectId}`),

  deactivate: (shareId: string) =>
    apiClient.delete(`/sharing/${shareId}`),

  getShared: (token: string) =>
    apiClient.get(`/shared/${token}`),
};
