// Type support utilities for handling database schema mismatches during Phase 1

// Temporary type definitions to fix build errors
export interface TemporaryPost {
  id: string;
  content?: string;
  created_at: string;
  user_id: string;
  media_url?: string;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
}

export interface TemporaryProfile {
  id: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
}

// Safe type guards for runtime validation
export const isValidPost = (obj: any): obj is TemporaryPost => {
  return obj && typeof obj.id === 'string' && typeof obj.user_id === 'string';
};

export const isValidProfile = (obj: any): obj is TemporaryProfile => {
  return obj && typeof obj.id === 'string';
};

// Database query wrapper that handles missing tables gracefully
export const safeDatabaseQuery = async <T>(
  queryFn: () => Promise<{ data: T[] | null; error: any }>
): Promise<{ data: T[]; error: null } | { data: null; error: string }> => {
  try {
    const result = await queryFn();
    if (result.error) {
      console.warn('Database query failed, using fallback:', result.error.message);
      return { data: null, error: result.error.message };
    }
    return { data: result.data || [], error: null };
  } catch (error) {
    console.warn('Database connection failed, using fallback:', error);
    return { data: null, error: 'Database temporarily unavailable' };
  }
};