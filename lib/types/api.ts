/**
 * API Response Types - Generic wrappers for all API responses
 *
 * These types ensure compile-time safety when consuming API responses.
 * Use these to type fetch results in client components.
 */

/**
 * Standard API success wrapper
 * All successful API responses follow this structure
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  requestId: string;
}

/**
 * Standard API error wrapper
 * All error responses follow this structure
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
  };
  requestId: string;
}

/**
 * Union type for API responses
 * Use this when handling both success and error cases
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Type guard to check if response is successful
 */
export function isApiSuccess<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isApiError<T>(
  response: ApiResponse<T>
): response is ApiErrorResponse {
  return response.success === false;
}
