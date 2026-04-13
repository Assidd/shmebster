import apiClient from './client';

export interface Template {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  categoryId: string | null;
  creatorId: string | null;
  isSystem: boolean;
  isPublic: boolean;
  canvasWidth: number;
  canvasHeight: number;
  canvasData: Record<string, unknown>;
  tags: string[];
  useCount: number;
  createdAt: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
}

export const templatesApi = {
  list: (params?: { page?: number; limit?: number; categoryId?: string; isSystem?: boolean; search?: string }) =>
    apiClient.get<{ data: Template[]; meta: Record<string, number> }>('/templates', { params }),

  get: (id: string) =>
    apiClient.get<Template>(`/templates/${id}`),

  create: (dto: { name: string; canvasData: Record<string, unknown>; canvasWidth: number; canvasHeight: number; categoryId?: string; tags?: string[] }) =>
    apiClient.post<Template>('/templates', dto),

  getCategories: () =>
    apiClient.get<TemplateCategory[]>('/template-categories'),
};
