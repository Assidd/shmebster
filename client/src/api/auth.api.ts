import apiClient from './client';

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    role: string;
  };
}

export const authApi = {
  register: (dto: RegisterDto) =>
    apiClient.post<{ message: string }>('/auth/register', dto),

  login: (dto: LoginDto) =>
    apiClient.post<AuthResponse>('/auth/login', dto),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }),

  confirmEmail: (token: string) =>
    apiClient.get(`/auth/confirm-email?token=${token}`),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    apiClient.post('/auth/reset-password', { token, newPassword }),

  getMe: () =>
    apiClient.get<AuthResponse['user']>('/auth/me'),
};
