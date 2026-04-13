import apiClient from './client';

export interface UploadedFile {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  fileSize: number;
  storagePath: string;
  width: number | null;
  height: number | null;
  createdAt: string;
}

export const uploadsApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<UploadedFile>('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  list: () =>
    apiClient.get<UploadedFile[]>('/uploads'),

  delete: (id: string) =>
    apiClient.delete(`/uploads/${id}`),

  getFileUrl: (storedName: string) =>
    `/api/uploads/file/${storedName}`,
};
