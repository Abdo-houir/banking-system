import { ApiError, apiFetch } from '@/lib/api-client';
import { ApiError as ApiErrorType, ApiResponse } from '@/types/api';
import { useCallback, useState } from 'react';

export interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
}

export function useApi<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ApiErrorType[]>([]);
  const [data, setData] = useState<T | null>(null);

  const callApi = useCallback(
    async (
      endpoint: string,
      options?: RequestInit,
      callbacks?: UseApiOptions<T>
    ) => {
      setLoading(true);
      setError(null);
      setErrors([]);

      try {
        const { data: responseData } = await apiFetch<ApiResponse<T>>(
          endpoint,
          options
        );

        if (responseData.success) {
          setData(responseData.data as T);
          callbacks?.onSuccess?.(responseData.data as T);
          return { success: true, data: responseData.data as T };
        } else {
          setError(responseData.message);
          setErrors(responseData.errors || []);
          callbacks?.onError?.(
            new ApiError(400, responseData.message, responseData.errors)
          );
          return { success: false, error: responseData.message };
        }
      } catch (err) {
        const apiError =
          err instanceof ApiError
            ? err
            : new ApiError(500, 'An unexpected error occurred');

        setError(apiError.message);
        setErrors(apiError.errors || []);
        callbacks?.onError?.(apiError);
        return { success: false, error: apiError.message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setErrors([]);
    setData(null);
  }, []);

  return {
    callApi,
    loading,
    error,
    errors,
    data,
    reset,
  };
}