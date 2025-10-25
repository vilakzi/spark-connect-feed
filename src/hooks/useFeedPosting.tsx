import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface MediaFile {
  file: File;
  preview: string;
  type: string;
  compressed?: File;
  thumbnail?: string;
}

interface PostData {
  content: string;
  mediaFiles: MediaFile[];
  location?: string;
  hashtags: string[];
  mentions: string[];
  privacyLevel: 'public' | 'friends' | 'private';
  scheduledAt?: Date;
  isDraft: boolean;
}

export const useFeedPosting = () => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Compress image for mobile optimization
  const compressImage = useCallback((file: File, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate optimal dimensions for mobile
        const maxWidth = window.innerWidth > 768 ? 1080 : 720;
        const maxHeight = window.innerWidth > 768 ? 1080 : 720;
        
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Generate video thumbnail
  const generateVideoThumbnail = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = 1; // Get frame at 1 second
      };
      
      video.onseeked = () => {
        ctx?.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve(url);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        }, 'image/jpeg', 0.8);
      };
      
      video.onerror = () => reject(new Error('Video load error'));
      video.src = URL.createObjectURL(file);
    });
  }, []);

  // Upload single media file
  const uploadMediaFile = useCallback(async (
    mediaFile: MediaFile, 
    postId: string,
    index: number
  ): Promise<{ mediaUrl: string; thumbnailUrl?: string }> => {
    if (!user) throw new Error('User not authenticated');

    const fileExt = mediaFile.file.name.split('.').pop();
    const fileName = `${postId}/${index}.${fileExt}`;
    const filePath = `posts/${fileName}`;

    // Use compressed file if available
    const fileToUpload = mediaFile.compressed || mediaFile.file;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('posts')
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('posts')
      .getPublicUrl(uploadData.path);

    let thumbnailUrl: string | undefined;

    // Upload thumbnail for videos
    if (mediaFile.type.startsWith('video/') && mediaFile.thumbnail) {
      const thumbnailBlob = await fetch(mediaFile.thumbnail).then(r => r.blob());
      const thumbnailFile = new File([thumbnailBlob], `${postId}_thumb_${index}.jpg`, { type: 'image/jpeg' });
      
      const { data: thumbData, error: thumbError } = await supabase.storage
        .from('posts')
        .upload(`posts/${postId}/thumb_${index}.jpg`, thumbnailFile);

      if (!thumbError && thumbData) {
        const { data: { publicUrl: thumbUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(thumbData.path);
        thumbnailUrl = thumbUrl;
      }
    }

    return { mediaUrl: publicUrl, thumbnailUrl };
  }, [user]);

  // Process hashtags and mentions
  const extractHashtagsAndMentions = useCallback((content: string) => {
    const hashtags = Array.from(content.matchAll(/#(\w+)/g), m => m[1]);
    const mentions = Array.from(content.matchAll(/@(\w+)/g), m => m[1]);
    return { hashtags, mentions };
  }, []);

  // Create post
  const createPost = useCallback(async (postData: PostData): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a post",
        variant: "destructive"
      });
      return null;
    }

    setUploading(true);
    
    try {
      // Extract hashtags and mentions from content
      const { hashtags: extractedHashtags, mentions: extractedMentions } = 
        extractHashtagsAndMentions(postData.content);
      
      const allHashtags = [...new Set([...postData.hashtags, ...extractedHashtags])];
      const allMentions = [...new Set([...postData.mentions, ...extractedMentions])];

      // Process media files
      const processedMedia: MediaFile[] = [];
      
      for (const [index, mediaFile] of postData.mediaFiles.entries()) {
        const progressKey = `media_${index}`;
        setUploadProgress(prev => ({ ...prev, [progressKey]: 10 }));

        if (mediaFile.type.startsWith('image/')) {
          // Compress image
          const compressed = await compressImage(mediaFile.file);
          processedMedia.push({ ...mediaFile, compressed });
          setUploadProgress(prev => ({ ...prev, [progressKey]: 40 }));
        } else if (mediaFile.type.startsWith('video/')) {
          // Generate thumbnail for video
          const thumbnail = await generateVideoThumbnail(mediaFile.file);
          processedMedia.push({ ...mediaFile, thumbnail });
          setUploadProgress(prev => ({ ...prev, [progressKey]: 40 }));
        } else {
          processedMedia.push(mediaFile);
        }
      }

      // Create post record
      const { data: postRecord, error: postError } = await supabase
        .from('feed_posts')
        .insert({
          user_id: user.id,
          content: postData.content,
          location: postData.location,
          hashtags: allHashtags,
          mentions: allMentions,
          privacy_level: postData.privacyLevel,
          scheduled_at: postData.scheduledAt?.toISOString(),
          is_draft: postData.isDraft,
          published_at: postData.isDraft || postData.scheduledAt ? null : new Date().toISOString(),
          metadata: {
            device: navigator.userAgent,
            location: postData.location
          }
        })
        .select()
        .single();

      if (postError) throw postError;

      setUploadProgress(prev => ({ ...prev, post_created: 60 }));

      // Upload media files
      const mediaUrls: string[] = [];
      const mediaTypes: string[] = [];
      const thumbnails: string[] = [];

      for (const [index, mediaFile] of processedMedia.entries()) {
        const progressKey = `media_${index}`;
        
        const { mediaUrl, thumbnailUrl } = await uploadMediaFile(
          mediaFile, 
          postRecord.id, 
          index
        );
        
        mediaUrls.push(mediaUrl);
        mediaTypes.push(mediaFile.type);
        if (thumbnailUrl) thumbnails.push(thumbnailUrl);
        
        setUploadProgress(prev => ({ 
          ...prev, 
          [progressKey]: 80 + (20 * (index + 1) / processedMedia.length)
        }));
      }

      // Update post with media URLs
      const { error: updateError } = await supabase
        .from('feed_posts')
        .update({
          media_urls: mediaUrls,
          media_types: mediaTypes,
          thumbnails: thumbnails
        })
        .eq('id', postRecord.id);

      if (updateError) throw updateError;

      setUploadProgress(prev => ({ ...prev, upload_complete: 100 }));

      toast({
        title: postData.isDraft ? "Draft saved!" : "Post created!",
        description: postData.isDraft 
          ? "Your draft has been saved successfully" 
          : "Your post is now live on the feed"
      });

      return postRecord.id;

    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Upload failed",
        description: "There was an error creating your post. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  }, [user, compressImage, generateVideoThumbnail, uploadMediaFile, extractHashtagsAndMentions]);

  // Get user's drafts
  const getDrafts = useCallback(async () => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('feed_posts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_draft', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching drafts:', error);
      return [];
    }

    return data || [];
  }, [user]);

  return {
    createPost,
    getDrafts,
    uploading,
    uploadProgress,
    compressImage,
    generateVideoThumbnail
  };
};