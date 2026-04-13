import apiClient from './client';

export const usersApi = {
  updateProfile: (dto: { firstName?: string; lastName?: string }) =>
    apiClient.patch('/users/profile', dto),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteAvatar: () =>
    apiClient.delete('/users/avatar'),
};
