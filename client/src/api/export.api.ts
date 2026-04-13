import apiClient from './client';

export interface ExportProjectPayload {
  dataUrl?: string;
  svg?: string;
  canvasData?: Record<string, unknown>;
  canvasWidth?: number;
  canvasHeight?: number;
  quality?: number;
}

export const exportApi = {
  exportPng: (projectId: string, dto: ExportProjectPayload = {}) =>
    apiClient.post<Blob>(`/export/${projectId}/png`, dto, { responseType: 'blob' }),

  exportJpg: (projectId: string, dto: ExportProjectPayload = {}) =>
    apiClient.post<Blob>(`/export/${projectId}/jpg`, dto, { responseType: 'blob' }),

  exportSvg: (projectId: string, dto: ExportProjectPayload = {}) =>
    apiClient.post<Blob>(`/export/${projectId}/svg`, dto, { responseType: 'blob' }),

  exportPdf: (projectId: string, dto: ExportProjectPayload = {}) =>
    apiClient.post<Blob>(`/export/${projectId}/pdf`, dto, { responseType: 'blob' }),
};
