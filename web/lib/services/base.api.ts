import { getAuthToken } from '@/lib/auth-store';

const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4000';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export const apiFetch = async <T = unknown>(
  path: string,
  method: HttpMethod,
  body?: unknown
): Promise<ApiResponse<T>> => {
  try {
    const token = getAuthToken();

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: method !== 'GET' && body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let data: unknown;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new Error('Invalid JSON response from server');
    }

    const responseData = data as Partial<ApiResponse<T>> | null;

    if (!res.ok) {
      throw new Error(responseData?.message || `Request failed with status ${res.status}`);
    }
    return {
      success: true,
      message: responseData?.message ?? 'Request successful',
      data: (responseData?.data ?? (responseData as unknown)) as T,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Something went wrong';

    return {
      success: false,
      message,
    };
  }
};

export const baseAPI = <T = unknown>(url: string, method: HttpMethod, body?: unknown) =>
  apiFetch<T>(`/user${url}`, method, body);
