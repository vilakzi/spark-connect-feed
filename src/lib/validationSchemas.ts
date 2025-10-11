import { z } from 'zod';
import { sanitizeMessage, sanitizeUserContent, sanitizeDisplayName } from './contentSecurity';

/**
 * Validation schemas for user inputs with sanitization
 */

export const messageSchema = z.object({
  content: z.string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(1000, "Message must be less than 1000 characters")
    .transform(sanitizeMessage),
  conversation_id: z.string().uuid("Invalid conversation ID")
});

export const postSchema = z.object({
  content: z.string()
    .trim()
    .min(1, "Post content cannot be empty")
    .max(5000, "Post content must be less than 5000 characters")
    .transform(sanitizeUserContent),
  privacy_level: z.enum(['public', 'friends', 'private'], {
    errorMap: () => ({ message: "Privacy level must be public, friends, or private" })
  }).optional().default('public'),
  image_url: z.string().url().optional().nullable(),
  video_url: z.string().url().optional().nullable(),
  media_type: z.enum(['text', 'image', 'video']).optional().default('text')
});

export const communitySchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Community name cannot be empty")
    .max(100, "Community name must be less than 100 characters")
    .transform(sanitizeDisplayName),
  description: z.string()
    .trim()
    .max(500, "Description must be less than 500 characters")
    .transform(sanitizeUserContent)
    .optional(),
  privacy_level: z.enum(['public', 'private']).optional().default('public'),
  category: z.string().optional().default('general'),
  tags: z.array(z.string()).optional(),
  image_url: z.string().url().optional().nullable(),
  banner_url: z.string().url().optional().nullable()
});

export const streamChatSchema = z.object({
  message: z.string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(1000, "Message must be less than 1000 characters")
    .transform(sanitizeMessage),
  stream_id: z.string().uuid("Invalid stream ID"),
  message_type: z.enum(['text', 'system', 'tip']).optional().default('text')
});

export const profileUpdateSchema = z.object({
  display_name: z.string()
    .trim()
    .min(1, "Display name cannot be empty")
    .max(50, "Display name must be less than 50 characters")
    .transform(sanitizeDisplayName)
    .optional(),
  bio: z.string()
    .trim()
    .max(500, "Bio must be less than 500 characters")
    .transform(sanitizeUserContent)
    .optional(),
  location: z.string()
    .trim()
    .max(100, "Location must be less than 100 characters")
    .optional()
});

export type MessageInput = z.infer<typeof messageSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type CommunityInput = z.infer<typeof communitySchema>;
export type StreamChatInput = z.infer<typeof streamChatSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
