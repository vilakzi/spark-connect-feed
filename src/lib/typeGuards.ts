// Type guards for API responses and data validation

export const isNonNullable = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value);
};

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// Supabase API response type guards
export interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

export const isSuccessResponse = <T>(
  response: SupabaseResponse<T>
): response is SupabaseResponse<T> & { data: T; error: null } => {
  return response.error === null && response.data !== null;
};

export const isErrorResponse = <T>(
  response: SupabaseResponse<T>
): response is SupabaseResponse<T> & { data: null; error: Error } => {
  return response.error !== null;
};

// User data type guards
export interface User {
  id: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
}

export const isValidUser = (value: unknown): value is User => {
  return (
    isObject(value) &&
    isString(value.id) &&
    value.id.length > 0 &&
    (value.email === undefined || isString(value.email)) &&
    (value.display_name === undefined || isString(value.display_name)) &&
    (value.avatar_url === undefined || isString(value.avatar_url))
  );
};

// Content data type guards
export interface Content {
  id: string;
  user_id: string;
  content?: string;
  media_url?: string;
  created_at: string;
}

export const isValidContent = (value: unknown): value is Content => {
  return (
    isObject(value) &&
    isString(value.id) &&
    isString(value.user_id) &&
    isString(value.created_at) &&
    (value.content === undefined || isString(value.content)) &&
    (value.media_url === undefined || isString(value.media_url))
  );
};

// API error type guard
export interface ApiError {
  message: string;
  code?: string;
  details?: string;
}

export const isApiError = (value: unknown): value is ApiError => {
  return (
    isObject(value) &&
    isString(value.message) &&
    (value.code === undefined || isString(value.code)) &&
    (value.details === undefined || isString(value.details))
  );
};

// Form validation type guards
export const isValidEmail = (value: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

export const isValidPassword = (value: string): boolean => {
  return value.length >= 6;
};

// Generic array validation
export const validateArray = <T>(
  value: unknown,
  itemValidator: (item: unknown) => item is T
): value is T[] => {
  if (!isArray(value)) return false;
  return value.every(itemValidator);
};

// Safe JSON parsing
export const safeJsonParse = <T>(
  jsonString: string,
  validator: (value: unknown) => value is T
): T | null => {
  try {
    const parsed = JSON.parse(jsonString);
    return validator(parsed) ? parsed : null;
  } catch {
    return null;
  }
};