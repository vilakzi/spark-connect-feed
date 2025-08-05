export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activity_tracking: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      admin_content: {
        Row: {
          admin_id: string
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          auto_published: boolean | null
          category: Database["public"]["Enums"]["content_category"] | null
          content_hash: string | null
          content_type: string
          created_at: string
          description: string | null
          file_size: number | null
          file_url: string
          id: string
          is_promoted: boolean | null
          like_count: number | null
          metadata: Json | null
          optimized_file_sizes: Json | null
          original_file_size: number | null
          promoted_at: string | null
          promoted_by: string | null
          promotion_priority: number | null
          published_at: string | null
          rejection_reason: string | null
          scheduled_at: string | null
          share_count: number | null
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          view_count: number | null
          visibility: string
        }
        Insert: {
          admin_id: string
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auto_published?: boolean | null
          category?: Database["public"]["Enums"]["content_category"] | null
          content_hash?: string | null
          content_type: string
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          is_promoted?: boolean | null
          like_count?: number | null
          metadata?: Json | null
          optimized_file_sizes?: Json | null
          original_file_size?: number | null
          promoted_at?: string | null
          promoted_by?: string | null
          promotion_priority?: number | null
          published_at?: string | null
          rejection_reason?: string | null
          scheduled_at?: string | null
          share_count?: number | null
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          view_count?: number | null
          visibility?: string
        }
        Update: {
          admin_id?: string
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auto_published?: boolean | null
          category?: Database["public"]["Enums"]["content_category"] | null
          content_hash?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          is_promoted?: boolean | null
          like_count?: number | null
          metadata?: Json | null
          optimized_file_sizes?: Json | null
          original_file_size?: number | null
          promoted_at?: string | null
          promoted_by?: string | null
          promotion_priority?: number | null
          published_at?: string | null
          rejection_reason?: string | null
          scheduled_at?: string | null
          share_count?: number | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          view_count?: number | null
          visibility?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      content_analytics: {
        Row: {
          active_users_7d: number | null
          content_id: string
          date: string | null
          id: string
          metadata: Json | null
          metric_type: string
          timestamp: string
          total_posts: number | null
          total_subscribers: number | null
          total_users: number | null
          user_id: string | null
          value: number
        }
        Insert: {
          active_users_7d?: number | null
          content_id: string
          date?: string | null
          id?: string
          metadata?: Json | null
          metric_type: string
          timestamp?: string
          total_posts?: number | null
          total_subscribers?: number | null
          total_users?: number | null
          user_id?: string | null
          value?: number
        }
        Update: {
          active_users_7d?: number | null
          content_id?: string
          date?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          timestamp?: string
          total_posts?: number | null
          total_subscribers?: number | null
          total_users?: number | null
          user_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_analytics_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "admin_content"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          last_message_id: string | null
          participant_one_id: string
          participant_two_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_id?: string | null
          participant_one_id: string
          participant_two_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_id?: string | null
          participant_one_id?: string
          participant_two_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_stats: {
        Row: {
          created_at: string
          date: string
          goal: number | null
          id: string
          matches: number | null
          messages: number | null
          swipes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          goal?: number | null
          id?: string
          matches?: number | null
          messages?: number | null
          swipes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          goal?: number | null
          id?: string
          matches?: number | null
          messages?: number | null
          swipes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feed_analytics: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          comment_count: number | null
          content: string | null
          created_at: string
          engagement_score: number | null
          hashtags: string[] | null
          id: string
          is_draft: boolean | null
          like_count: number | null
          location: string | null
          media_types: string[] | null
          media_urls: string[] | null
          mentions: string[] | null
          metadata: Json | null
          privacy_level: string | null
          published_at: string | null
          quality_score: number | null
          scheduled_at: string | null
          share_count: number | null
          thumbnails: string[] | null
          trending_score: number | null
          updated_at: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          comment_count?: number | null
          content?: string | null
          created_at?: string
          engagement_score?: number | null
          hashtags?: string[] | null
          id?: string
          is_draft?: boolean | null
          like_count?: number | null
          location?: string | null
          media_types?: string[] | null
          media_urls?: string[] | null
          mentions?: string[] | null
          metadata?: Json | null
          privacy_level?: string | null
          published_at?: string | null
          quality_score?: number | null
          scheduled_at?: string | null
          share_count?: number | null
          thumbnails?: string[] | null
          trending_score?: number | null
          updated_at?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          comment_count?: number | null
          content?: string | null
          created_at?: string
          engagement_score?: number | null
          hashtags?: string[] | null
          id?: string
          is_draft?: boolean | null
          like_count?: number | null
          location?: string | null
          media_types?: string[] | null
          media_urls?: string[] | null
          mentions?: string[] | null
          metadata?: Json | null
          privacy_level?: string | null
          published_at?: string | null
          quality_score?: number | null
          scheduled_at?: string | null
          share_count?: number | null
          thumbnails?: string[] | null
          trending_score?: number | null
          updated_at?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_super_like: boolean
          user_one_id: string
          user_two_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_super_like?: boolean
          user_one_id: string
          user_two_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_super_like?: boolean
          user_one_id?: string
          user_two_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          message_type: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          caption: string | null
          content_url: string
          created_at: string | null
          expires_at: string
          id: string
          is_promoted: boolean | null
          payment_status: string | null
          post_type: Database["public"]["Enums"]["post_type"]
          promotion_type: Database["public"]["Enums"]["promotion_type"] | null
          provider_id: string
          updated_at: string | null
        }
        Insert: {
          caption?: string | null
          content_url: string
          created_at?: string | null
          expires_at: string
          id?: string
          is_promoted?: boolean | null
          payment_status?: string | null
          post_type: Database["public"]["Enums"]["post_type"]
          promotion_type?: Database["public"]["Enums"]["promotion_type"] | null
          provider_id: string
          updated_at?: string | null
        }
        Update: {
          caption?: string | null
          content_url?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          is_promoted?: boolean | null
          payment_status?: string | null
          post_type?: Database["public"]["Enums"]["post_type"]
          promotion_type?: Database["public"]["Enums"]["promotion_type"] | null
          provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          created_at: string
          id: string
          viewed_id: string
          viewer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          viewed_id: string
          viewer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          viewed_id?: string
          viewer_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          bio: string | null
          created_at: string
          display_name: string | null
          gender: string | null
          id: string
          interests: string[] | null
          is_blocked: boolean | null
          last_active: string | null
          location: string | null
          phone: string | null
          photo_verified: boolean | null
          privacy_settings: Json | null
          profile_image_url: string | null
          profile_images: string[] | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"] | null
          verifications: Json | null
          whatsapp: string | null
        }
        Insert: {
          age?: number | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          id: string
          interests?: string[] | null
          is_blocked?: boolean | null
          last_active?: string | null
          location?: string | null
          phone?: string | null
          photo_verified?: boolean | null
          privacy_settings?: Json | null
          profile_image_url?: string | null
          profile_images?: string[] | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
          verifications?: Json | null
          whatsapp?: string | null
        }
        Update: {
          age?: number | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_blocked?: boolean | null
          last_active?: string | null
          location?: string | null
          phone?: string | null
          photo_verified?: boolean | null
          privacy_settings?: Json | null
          profile_image_url?: string | null
          profile_images?: string[] | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
          verifications?: Json | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          caption: string | null
          content_type: string
          content_url: string
          created_at: string
          expires_at: string
          id: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          caption?: string | null
          content_type: string
          content_url: string
          created_at?: string
          expires_at?: string
          id?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          caption?: string | null
          content_type?: string
          content_url?: string
          created_at?: string
          expires_at?: string
          id?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      story_views: {
        Row: {
          created_at: string
          id: string
          story_id: string
          viewer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          story_id: string
          viewer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          story_id?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      typing_indicators: {
        Row: {
          conversation_id: string
          id: string
          is_typing: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_typing?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_typing?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_indicators_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feed_preferences: {
        Row: {
          content_interests: string[] | null
          created_at: string
          diversity_preference: number | null
          freshness_preference: number | null
          id: string
          interaction_weights: Json | null
          preferred_content_types: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_interests?: string[] | null
          created_at?: string
          diversity_preference?: number | null
          freshness_preference?: number | null
          id?: string
          interaction_weights?: Json | null
          preferred_content_types?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_interests?: string[] | null
          created_at?: string
          diversity_preference?: number | null
          freshness_preference?: number | null
          id?: string
          interaction_weights?: Json | null
          preferred_content_types?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          created_at: string
          duration: number | null
          id: string
          interaction_type: string
          metadata: Json | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration?: number | null
          id?: string
          interaction_type: string
          metadata?: Json | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration?: number | null
          id?: string
          interaction_type?: string
          metadata?: Json | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          location_enabled: boolean
          max_age: number
          max_distance: number
          min_age: number
          show_me: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_enabled?: boolean
          max_age?: number
          max_distance?: number
          min_age?: number
          show_me?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location_enabled?: boolean
          max_age?: number
          max_distance?: number
          min_age?: number
          show_me?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_engagement_scores: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_duplicate_content: {
        Args: { hash_value: string }
        Returns: boolean
      }
      create_conversation_from_match: {
        Args: { match_id_param: string }
        Returns: string
      }
      ensure_user_profile: {
        Args: { profile_user_id: string }
        Returns: undefined
      }
      generate_content_hash: {
        Args: { file_data: string }
        Returns: string
      }
      get_content_analytics_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_content: number
          total_views: number
          total_likes: number
          total_shares: number
          published_content: number
          draft_content: number
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_personalized_feed: {
        Args: {
          user_id_param: string
          limit_param?: number
          offset_param?: number
        }
        Returns: {
          post_id: string
          content: string
          media_urls: string[]
          media_types: string[]
          thumbnails: string[]
          user_display_name: string
          user_avatar: string
          like_count: number
          comment_count: number
          share_count: number
          created_at: string
          relevance_score: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      increment_content_view: {
        Args: { content_id: string }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_new_joiner: {
        Args: { user_created_at: string }
        Returns: boolean
      }
      is_service_provider: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_sensitive_operation: {
        Args: {
          p_action: string
          p_table_name: string
          p_record_id?: string
          p_old_values?: Json
          p_new_values?: Json
        }
        Returns: undefined
      }
      promote_admin_content: {
        Args: { content_id: string; priority_level?: number }
        Returns: undefined
      }
      promote_to_admin: {
        Args: { _user_email: string }
        Returns: undefined
      }
      track_user_interaction: {
        Args: {
          p_user_id: string
          p_post_id: string
          p_interaction_type: string
          p_duration?: number
          p_metadata?: Json
        }
        Returns: undefined
      }
      unpromote_admin_content: {
        Args: { content_id: string }
        Returns: undefined
      }
      update_post_engagement_score: {
        Args: { post_id_param: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "user" | "service_provider" | "admin"
      content_category:
        | "entertainment"
        | "news"
        | "lifestyle"
        | "sports"
        | "technology"
        | "food"
        | "travel"
        | "fashion"
        | "health"
        | "education"
        | "business"
        | "other"
      post_type: "image" | "video"
      promotion_type: "free_2h" | "paid_8h" | "paid_12h"
      user_type: "user" | "service_provider"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "service_provider", "admin"],
      content_category: [
        "entertainment",
        "news",
        "lifestyle",
        "sports",
        "technology",
        "food",
        "travel",
        "fashion",
        "health",
        "education",
        "business",
        "other",
      ],
      post_type: ["image", "video"],
      promotion_type: ["free_2h", "paid_8h", "paid_12h"],
      user_type: ["user", "service_provider"],
    },
  },
} as const
