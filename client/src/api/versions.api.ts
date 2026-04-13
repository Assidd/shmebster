import apiClient from './client';
import type { Project } from './projects.api';

export interface ProjectVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  label: string | null;
  canvasData: Record<string, unknown>;
  canvasWidth: number;
  canvasHeight: number;
  source: string;
  createdAt: string;
}

export interface CreateProjectVersionDto {
  label?: string;
  canvasData?: Record<string, unknown>;
  canvasWidth?: number;
  canvasHeight?: number;
}

export interface RestoreProjectVersionResponse {
  project: Project;
  restoredFrom: ProjectVersion;
  restoredVersion: ProjectVersion;
}

export const versionsApi = {
  list: (projectId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<{ data: ProjectVersion[]; meta: Record<string, number> }>(
      `/projects/${projectId}/versions`,
      { params },
    ),

  get: (projectId: string, versionId: string) =>
    apiClient.get<ProjectVersion>(`/projects/${projectId}/versions/${versionId}`),

  create: (projectId: string, dto: CreateProjectVersionDto = {}) =>
    apiClient.post<ProjectVersion>(`/projects/${projectId}/versions`, dto),

  restore: (projectId: string, versionId: string) =>
    apiClient.post<RestoreProjectVersionResponse>(`/projects/${projectId}/versions/${versionId}/restore`),
};
