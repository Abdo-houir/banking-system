import { ApiResponse, isApiSuccess } from '@/types/api';

// Type-safe fetch wrapper
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errors?: Array<{ field?: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T; response: Response }> {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Always include credentials for cookies
  };

  try {
    const response = await fetch(endpoint, {
      ...defaultOptions,
      ...options,
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new ApiError(
        response.status,
        responseData.message || 'API request failed',
        responseData.errors
      );
    }

    return {
      data: responseData as T,
      response,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(
      500,
      error instanceof Error ? error.message : 'Network error occurred'
    );
  }
}

// Type-safe API client with specific methods
export const apiClient = {
  // Auth endpoints
  auth: {
    login: async (email: string, password: string) => {
      return apiFetch<ApiResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },

    logout: async () => {
      return apiFetch<ApiResponse>('/api/auth/logout', {
        method: 'POST',
      });
    },

    getCurrentUser: async () => {
      return apiFetch<ApiResponse>('/api/auth/me');
    },
  },
};

// Hook-friendly API client with consistent error handling
export async function safeApiCall<T>(
  apiCall: Promise<{ data: ApiResponse<T>; response: Response }>
): Promise<{ success: boolean; data?: T; error?: string; errors?: unknown[] }> {
  try {
    const { data } = await apiCall;
    
    if (isApiSuccess(data)) {
      return {
        success: true,
        data: data.data,
      };
    } else {
      return {
        success: false,
        error: data.message,
        errors: data.errors,
      };
    }
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.message,
        errors: error.errors,
      };
    }
    
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}