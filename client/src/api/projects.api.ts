import apiClient from './client';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  ownerId: string;
  templateId: string | null;
  canvasWidth: number;
  canvasHeight: number;
  canvasData: Record<string, unknown>;
  isArchived: boolean;
  lastEditedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  name?: string;
  templateId?: string;
  canvasWidth?: number;
  canvasHeight?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const projectsApi = {
  list: (params?: { page?: number; limit?: number; search?: string; isArchived?: boolean }) =>
    apiClient.get<PaginatedResponse<Project>>('/projects', { params }),

  get: (id: string) =>
    apiClient.get<Project>(`/projects/${id}`),

  create: (dto: CreateProjectDto) =>
    apiClient.post<Project>('/projects', dto),

  update: (id: string, dto: Partial<Pick<Project, 'name' | 'description' | 'isArchived'>>) =>
    apiClient.patch<Project>(`/projects/${id}`, dto),

  delete: (id: string) =>
    apiClient.delete(`/projects/${id}`),

  saveCanvas: (
    id: string,
    canvasData: Record<string, unknown>,
    canvasWidth: number,
    canvasHeight: number,
  ) => apiClient.put<Project>(`/projects/${id}/canvas`, { canvasData, canvasWidth, canvasHeight }),

  autoSave: (id: string, canvasData: Record<string, unknown>) =>
    apiClient.patch(`/projects/${id}/autosave`, { canvasData }),

  resize: (
    id: string,
    width: number,
    height: number,
    canvasData?: Record<string, unknown>,
  ) => apiClient.patch<Project>(`/projects/${id}/resize`, { width, height, canvasData }),

  duplicate: (id: string) =>
    apiClient.post<Project>(`/projects/${id}/duplicate`),

  saveAsTemplate: (id: string, name: string, categoryId?: string) =>
    apiClient.post(`/projects/${id}/save-as-template`, { name, categoryId }),
};
