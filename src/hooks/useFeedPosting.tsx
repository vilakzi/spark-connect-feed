import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface MediaFile {
  file: File;
  preview: string;
  type: string;
  compressed?: File;
  thumbnail?: string;
}

interface PostData {
  content: string;
  media: MediaFile[];
  location?: string;
  hashtags?: string[];
  mentions?: string[];
  privacy?: 'public' | 'friends' | 'private';
  scheduledDate?: Date;
  isDraft?: boolean;
}

export const useFeedPosting = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Compress image for mobile optimization
  const compressImage = useCallback(async (file: File, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        
        let { width, height } = img;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Generate video thumbnail
  const generateVideoThumbnail = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = Math.min(5, video.duration / 4); // 5 seconds or 1/4 duration
      });
      
      video.addEventListener('seeked', () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnail);
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      });
      
      video.addEventListener('error', () => {
        reject(new Error('Failed to load video'));
      });
      
      video.src = URL.createObjectURL(file);
    });
  }, []);

  // Upload media file to Supabase storage
  const uploadMediaFile = useCallback(async (
    mediaFile: MediaFile,
    postId: string,
    index: number
  ): Promise<{ mediaUrl: string; thumbnailUrl?: string }> => {
    const fileExtension = mediaFile.file.name.split('.').pop();
    const fileName = `${postId}_${index}.${fileExtension}`;
    const bucketName = mediaFile.type.startsWith('video/') ? 'videos' : 'images';
    
    // Upload main file
    const fileToUpload = mediaFile.compressed || mediaFile.file;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileToUpload);
    
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
    
    let thumbnailUrl: string | undefined;
    
    // Upload thumbnail if it exists
    if (mediaFile.thumbnail) {
      const thumbnailFileName = `${postId}_${index}_thumb.jpg`;
      const thumbnailBlob = await fetch(mediaFile.thumbnail).then(r => r.blob());
      
      const { error: thumbError } = await supabase.storage
        .from('thumbnails')
        .upload(thumbnailFileName, thumbnailBlob);
      
      if (!thumbError) {
        const { data: { publicUrl: thumbUrl } } = supabase.storage
          .from('thumbnails')
          .getPublicUrl(thumbnailFileName);
        thumbnailUrl = thumbUrl;
      }
    }
    
    return { mediaUrl: publicUrl, thumbnailUrl };
  }, []);

  // Extract hashtags and mentions from content
  const extractHashtagsAndMentions = useCallback((content: string) => {
    const hashtags = content.match(/#[\w]+/g)?.map(tag => tag.slice(1)) || [];
    const mentions = content.match(/@[\w]+/g)?.map(mention => mention.slice(1)) || [];
    return { hashtags, mentions };
  }, []);

  // Main function to create a post
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
    setUploadProgress({});

    try {
      // Step 1: Validate and sanitize input
      const { postSchema } = await import('@/lib/validationSchemas');
      const validatedContent = postSchema.parse({
        content: postData.content,
        privacy_level: postData.privacy || 'public',
        media_type: postData.media.length > 0 ? postData.media[0].type.split('/')[0] as 'text' | 'image' | 'video' : 'text'
      });

      // Step 2: Process media files (compress images, generate video thumbnails)
      const processedMedia: MediaFile[] = [];
      
      for (const [index, mediaFile] of postData.media.entries()) {
        const progressKey = `media_${index}`;
        setUploadProgress(prev => ({ ...prev, [progressKey]: 20 }));
        
        if (mediaFile.type.startsWith('image/')) {
          const compressed = await compressImage(mediaFile.file);
          processedMedia.push({ ...mediaFile, compressed });
          setUploadProgress(prev => ({ ...prev, [progressKey]: 40 }));
        } else if (mediaFile.type.startsWith('video/')) {
          const thumbnail = await generateVideoThumbnail(mediaFile.file);
          processedMedia.push({ ...mediaFile, thumbnail });
          setUploadProgress(prev => ({ ...prev, [progressKey]: 40 }));
        } else {
          processedMedia.push(mediaFile);
        }
      }

      // Step 3: Extract hashtags and mentions
      const extractedData = extractHashtagsAndMentions(postData.content);

      // Step 4: Insert the new post record with validated data
      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert({
          content: validatedContent.content,
          privacy_level: validatedContent.privacy_level,
          media_type: validatedContent.media_type,
          user_id: user.id
        })
        .select()
        .single();

      if (postError) throw postError;

      const postId = newPost.id;
      setUploadProgress(prev => ({ ...prev, post_created: 60 }));

      // Step 4: Upload media files if any
      const mediaResults: Array<{ mediaUrl: string; thumbnailUrl?: string }> = [];
      
      for (const [index, mediaFile] of processedMedia.entries()) {
        const progressKey = `media_${index}`;
        
        const result = await uploadMediaFile(mediaFile, postId, index);
        mediaResults.push(result);
        
        setUploadProgress(prev => ({ 
          ...prev, 
          [progressKey]: 80 + (20 * (index + 1) / processedMedia.length)
        }));
      }

      // Step 5: Update the post with media URLs
      if (mediaResults.length > 0) {
        const mediaUrls = mediaResults.map(result => result.mediaUrl);
        const firstMediaUrl = mediaUrls[0];
        const isVideo = postData.media[0]?.type.startsWith('video');
        
        const { error: updateError } = await supabase
          .from('posts')
          .update({
            [isVideo ? 'video_url' : 'image_url']: firstMediaUrl,
            media_type: postData.media[0]?.type || 'text'
          })
          .eq('id', postId);

        if (updateError) throw updateError;
      }

      setUploadProgress(prev => ({ ...prev, upload_complete: 100 }));

      toast({
        title: postData.isDraft ? "Draft saved!" : "Post created!",
        description: postData.isDraft 
          ? "Your draft has been saved successfully" 
          : "Your post is now live on the feed"
      });

      return postId;

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
  }, [user, compressImage, generateVideoThumbnail, uploadMediaFile, extractHashtagsAndMentions, toast]);

  // Get user's drafts
  const getDrafts = useCallback(async () => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

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