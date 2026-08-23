import { api, setAccessToken } from './client';
import { User } from '@/types';

interface AuthResponse {
  success: boolean;
  message?: string;
  data: { user: User; accessToken: string };
}

export async function signup(payload: { name: string; email: string; password: string }): Promise<User> {
  const res = await api.post<AuthResponse>('/auth/signup', payload);
  setAccessToken(res.data.data.accessToken);
  return res.data.data.user;
}

export async function login(payload: {
  email: string;
  password: string;
  rememberMe?: boolean;
}): Promise<User> {
  const res = await api.post<AuthResponse>('/auth/login', payload);
  setAccessToken(res.data.data.accessToken);
  return res.data.data.user;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
  setAccessToken(null);
}

export async function fetchMe(): Promise<User> {
  const res = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
  return res.data.data.user;
}

export async function tryRefreshSession(): Promise<User | null> {
  try {
    const res = await api.post<{ success: boolean; data: { accessToken: string } }>('/auth/refresh');
    setAccessToken(res.data.data.accessToken);
    return await fetchMe();
  } catch {
    return null;
  }
}

export async function forgotPassword(email: string): Promise<string> {
  const res = await api.post<{ message: string }>('/auth/forgot-password', { email });
  return res.data.message;
}

export async function resetPassword(token: string, password: string): Promise<string> {
  const res = await api.post<{ message: string }>('/auth/reset-password', { token, password });
  return res.data.message;
}

export async function verifyEmail(token: string): Promise<string> {
  const res = await api.post<{ message: string }>('/auth/verify-email', { token });
  return res.data.message;
}

export async function resendVerification(): Promise<string> {
  const res = await api.post<{ message: string }>('/auth/resend-verification');
  return res.data.message;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<string> {
  const res = await api.post<{ message: string }>('/users/me/change-password', {
    currentPassword,
    newPassword,
  });
  return res.data.message;
}

export async function updateProfile(payload: { name?: string; avatarUrl?: string }): Promise<User> {
  const res = await api.patch<{ data: { user: User } }>('/users/me', payload);
  return res.data.data.user;
}

export async function uploadAvatar(file: File): Promise<string> {
  const form = new FormData();
  form.append('avatar', file);
  const res = await api.post<{ data: { avatarUrl: string } }>('/users/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data.avatarUrl;
}
