import { baseAPI } from './base.api';
import type { AuthUser } from '@/lib/auth-store';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponseData {
  success: boolean;
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const loginApi = (data: LoginPayload) => baseAPI<LoginResponseData>('/login', 'POST', data);

export function toAuthUser(user: LoginResponseData['user']): AuthUser {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
