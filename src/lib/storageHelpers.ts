import { supabase } from '@/integrations/supabase/client';

/**
 * Storage helper functions for secure file access
 * 
 * IMPORTANT: Storage buckets are now PRIVATE for security.
 * Use these helpers to generate signed URLs for temporary access.
 */

/**
 * Get a signed URL for a profile image
 * @param userId - The user ID
 * @param fileName - The file name in storage
 * @param expiresIn - Time in seconds until the URL expires (default: 1 hour)
 */
export async function getProfileImageUrl(
  userId: string, 
  fileName: string, 
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const path = `${userId}/${fileName}`;
    const { data, error } = await supabase.storage
      .from('profiles')
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Error creating signed URL for profile image:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error getting profile image URL:', error);
    return null;
  }
}

/**
 * Get a signed URL for a post media file
 * @param userId - The user ID who created the post
 * @param postId - The post ID
 * @param fileName - The file name in storage
 * @param expiresIn - Time in seconds until the URL expires (default: 1 hour)
 */
export async function getPostMediaUrl(
  userId: string,
  postId: string,
  fileName: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const path = `${userId}/${postId}/${fileName}`;
    const { data, error } = await supabase.storage
      .from('posts')
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Error creating signed URL for post media:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error getting post media URL:', error);
    return null;
  }
}

/**
 * Upload a file to the profiles bucket
 * @param userId - The user ID
 * @param file - The file to upload
 * @param fileName - Optional custom file name
 */
export async function uploadProfileImage(
  userId: string,
  file: File,
  fileName?: string
): Promise<{ path: string; error: Error | null }> {
  try {
    const fileExt = file.name.split('.').pop();
    const finalFileName = fileName || `${Date.now()}.${fileExt}`;
    const path = `${userId}/${finalFileName}`;

    const { error } = await supabase.storage
      .from('profiles')
      .upload(path, file, {
        upsert: true,
        contentType: file.type
      });

    if (error) {
      return { path: '', error };
    }

    return { path, error: null };
  } catch (error) {
    return { path: '', error: error as Error };
  }
}

/**
 * Upload a file to the posts bucket
 * @param userId - The user ID
 * @param postId - The post ID
 * @param file - The file to upload
 * @param fileName - Optional custom file name
 */
export async function uploadPostMedia(
  userId: string,
  postId: string,
  file: File,
  fileName?: string
): Promise<{ path: string; error: Error | null }> {
  try {
    const fileExt = file.name.split('.').pop();
    const finalFileName = fileName || `${Date.now()}.${fileExt}`;
    const path = `${userId}/${postId}/${finalFileName}`;

    const { error } = await supabase.storage
      .from('posts')
      .upload(path, file, {
        upsert: false,
        contentType: file.type
      });

    if (error) {
      return { path: '', error };
    }

    return { path, error: null };
  } catch (error) {
    return { path: '', error: error as Error };
  }
}

/**
 * Delete a file from the profiles bucket
 */
export async function deleteProfileImage(userId: string, fileName: string): Promise<boolean> {
  try {
    const path = `${userId}/${fileName}`;
    const { error } = await supabase.storage
      .from('profiles')
      .remove([path]);

    if (error) {
      console.error('Error deleting profile image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting profile image:', error);
    return false;
  }
}

/**
 * Delete a file from the posts bucket
 */
export async function deletePostMedia(userId: string, postId: string, fileName: string): Promise<boolean> {
  try {
    const path = `${userId}/${postId}/${fileName}`;
    const { error } = await supabase.storage
      .from('posts')
      .remove([path]);

    if (error) {
      console.error('Error deleting post media:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting post media:', error);
    return false;
  }
}
