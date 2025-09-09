export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audience_insights: {
        Row: {
          age_18_24: number | null
          age_25_34: number | null
          age_35_44: number | null
          age_45_54: number | null
          age_55_plus: number | null
          avg_session_duration: number | null
          content_preferences: Json | null
          created_at: string
          creator_id: string
          date: string
          device_types: Json | null
          id: string
          most_active_day: string | null
          peak_activity_hours: Json | null
          return_visitor_rate: number | null
          top_cities: Json | null
          top_countries: Json | null
        }
        Insert: {
          age_18_24?: number | null
          age_25_34?: number | null
          age_35_44?: number | null
          age_45_54?: number | null
          age_55_plus?: number | null
          avg_session_duration?: number | null
          content_preferences?: Json | null
          created_at?: string
          creator_id: string
          date?: string
          device_types?: Json | null
          id?: string
          most_active_day?: string | null
          peak_activity_hours?: Json | null
          return_visitor_rate?: number | null
          top_cities?: Json | null
          top_countries?: Json | null
        }
        Update: {
          age_18_24?: number | null
          age_25_34?: number | null
          age_35_44?: number | null
          age_45_54?: number | null
          age_55_plus?: number | null
          avg_session_duration?: number | null
          content_preferences?: Json | null
          created_at?: string
          creator_id?: string
          date?: string
          device_types?: Json | null
          id?: string
          most_active_day?: string | null
          peak_activity_hours?: Json | null
          return_visitor_rate?: number | null
          top_cities?: Json | null
          top_countries?: Json | null
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      communities: {
        Row: {
          banner_url: string | null
          category: string
          created_at: string
          creator_id: string
          description: string | null
          id: string
          image_url: string | null
          is_verified: boolean | null
          location: string | null
          member_count: number | null
          name: string
          privacy_level: string
          rules: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          category?: string
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_verified?: boolean | null
          location?: string | null
          member_count?: number | null
          name: string
          privacy_level?: string
          rules?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          category?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_verified?: boolean | null
          location?: string | null
          member_count?: number | null
          name?: string
          privacy_level?: string
          rules?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      community_discussions: {
        Row: {
          author_id: string
          community_id: string
          content: string
          created_at: string
          discussion_type: string
          id: string
          is_locked: boolean | null
          is_pinned: boolean | null
          last_reply_at: string | null
          reply_count: number | null
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author_id: string
          community_id: string
          content: string
          created_at?: string
          discussion_type?: string
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          last_reply_at?: string | null
          reply_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author_id?: string
          community_id?: string
          content?: string
          created_at?: string
          discussion_type?: string
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          last_reply_at?: string | null
          reply_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_discussions_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_invites: {
        Row: {
          community_id: string
          created_at: string
          email: string | null
          expires_at: string
          id: string
          invite_code: string | null
          invitee_id: string | null
          inviter_id: string
          status: string
          used_at: string | null
        }
        Insert: {
          community_id: string
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          invite_code?: string | null
          invitee_id?: string | null
          inviter_id: string
          status?: string
          used_at?: string | null
        }
        Update: {
          community_id?: string
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          invite_code?: string | null
          invitee_id?: string | null
          inviter_id?: string
          status?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_invites_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_memberships: {
        Row: {
          community_id: string
          id: string
          joined_at: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_memberships_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      content_performance: {
        Row: {
          age_groups: Json | null
          avg_view_duration: number | null
          comments: number | null
          completion_rate: number | null
          content_id: string
          content_type: string
          created_at: string
          creator_id: string
          daily_views: Json | null
          demographics: Json | null
          hourly_views: Json | null
          id: string
          likes: number | null
          revenue_generated_cents: number | null
          saves: number | null
          shares: number | null
          tips_received_cents: number | null
          top_countries: string[] | null
          unique_views: number | null
          updated_at: string
          views: number | null
        }
        Insert: {
          age_groups?: Json | null
          avg_view_duration?: number | null
          comments?: number | null
          completion_rate?: number | null
          content_id: string
          content_type: string
          created_at?: string
          creator_id: string
          daily_views?: Json | null
          demographics?: Json | null
          hourly_views?: Json | null
          id?: string
          likes?: number | null
          revenue_generated_cents?: number | null
          saves?: number | null
          shares?: number | null
          tips_received_cents?: number | null
          top_countries?: string[] | null
          unique_views?: number | null
          updated_at?: string
          views?: number | null
        }
        Update: {
          age_groups?: Json | null
          avg_view_duration?: number | null
          comments?: number | null
          completion_rate?: number | null
          content_id?: string
          content_type?: string
          created_at?: string
          creator_id?: string
          daily_views?: Json | null
          demographics?: Json | null
          hourly_views?: Json | null
          id?: string
          likes?: number | null
          revenue_generated_cents?: number | null
          saves?: number | null
          shares?: number | null
          tips_received_cents?: number | null
          top_countries?: string[] | null
          unique_views?: number | null
          updated_at?: string
          views?: number | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participant_1: string
          participant_2: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1: string
          participant_2: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1?: string
          participant_2?: string
          updated_at?: string
        }
        Relationships: []
      }
      creator_achievements: {
        Row: {
          achievement_data: Json | null
          achievement_type: string
          creator_id: string
          earned_at: string
          id: string
          is_featured: boolean | null
        }
        Insert: {
          achievement_data?: Json | null
          achievement_type: string
          creator_id: string
          earned_at?: string
          id?: string
          is_featured?: boolean | null
        }
        Update: {
          achievement_data?: Json | null
          achievement_type?: string
          creator_id?: string
          earned_at?: string
          id?: string
          is_featured?: boolean | null
        }
        Relationships: []
      }
      creator_analytics: {
        Row: {
          avg_concurrent_viewers: number | null
          avg_view_duration: number | null
          content_discoveries: number | null
          created_at: string
          creator_id: string
          date: string
          engagement_rate: number | null
          followers_gained: number | null
          followers_lost: number | null
          id: string
          peak_viewers: number | null
          posts_commented: number | null
          posts_created: number | null
          posts_liked: number | null
          posts_shared: number | null
          profile_visits: number | null
          revenue_cents: number | null
          streams_count: number | null
          subscriptions_gained: number | null
          subscriptions_lost: number | null
          tips_received: number | null
          total_followers: number | null
          total_stream_minutes: number | null
          total_views: number | null
          unique_viewers: number | null
          updated_at: string
        }
        Insert: {
          avg_concurrent_viewers?: number | null
          avg_view_duration?: number | null
          content_discoveries?: number | null
          created_at?: string
          creator_id: string
          date?: string
          engagement_rate?: number | null
          followers_gained?: number | null
          followers_lost?: number | null
          id?: string
          peak_viewers?: number | null
          posts_commented?: number | null
          posts_created?: number | null
          posts_liked?: number | null
          posts_shared?: number | null
          profile_visits?: number | null
          revenue_cents?: number | null
          streams_count?: number | null
          subscriptions_gained?: number | null
          subscriptions_lost?: number | null
          tips_received?: number | null
          total_followers?: number | null
          total_stream_minutes?: number | null
          total_views?: number | null
          unique_viewers?: number | null
          updated_at?: string
        }
        Update: {
          avg_concurrent_viewers?: number | null
          avg_view_duration?: number | null
          content_discoveries?: number | null
          created_at?: string
          creator_id?: string
          date?: string
          engagement_rate?: number | null
          followers_gained?: number | null
          followers_lost?: number | null
          id?: string
          peak_viewers?: number | null
          posts_commented?: number | null
          posts_created?: number | null
          posts_liked?: number | null
          posts_shared?: number | null
          profile_visits?: number | null
          revenue_cents?: number | null
          streams_count?: number | null
          subscriptions_gained?: number | null
          subscriptions_lost?: number | null
          tips_received?: number | null
          total_followers?: number | null
          total_stream_minutes?: number | null
          total_views?: number | null
          unique_viewers?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      creator_content: {
        Row: {
          content_type: string
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_premium: boolean
          like_count: number | null
          media_url: string | null
          price_cents: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          content_type: string
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_premium?: boolean
          like_count?: number | null
          media_url?: string | null
          price_cents?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          content_type?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_premium?: boolean
          like_count?: number | null
          media_url?: string | null
          price_cents?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      creator_goals: {
        Row: {
          achieved_at: string | null
          created_at: string
          creator_id: string
          current_value: number | null
          deadline: string | null
          goal_type: string
          id: string
          is_active: boolean | null
          target_value: number
          updated_at: string
        }
        Insert: {
          achieved_at?: string | null
          created_at?: string
          creator_id: string
          current_value?: number | null
          deadline?: string | null
          goal_type: string
          id?: string
          is_active?: boolean | null
          target_value: number
          updated_at?: string
        }
        Update: {
          achieved_at?: string | null
          created_at?: string
          creator_id?: string
          current_value?: number | null
          deadline?: string | null
          goal_type?: string
          id?: string
          is_active?: boolean | null
          target_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      discussion_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string
          discussion_id: string
          edited_at: string | null
          id: string
          is_edited: boolean | null
          parent_reply_id: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          discussion_id: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          parent_reply_id?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          discussion_id?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          parent_reply_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discussion_replies_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "community_discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "discussion_replies"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          check_in_time: string | null
          event_id: string
          id: string
          notes: string | null
          rsvp_date: string
          status: string
          user_id: string
        }
        Insert: {
          check_in_time?: string | null
          event_id: string
          id?: string
          notes?: string | null
          rsvp_date?: string
          status?: string
          user_id: string
        }
        Update: {
          check_in_time?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          rsvp_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_invites: {
        Row: {
          created_at: string
          event_id: string
          id: string
          invitee_id: string
          inviter_id: string
          message: string | null
          responded_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          invitee_id: string
          inviter_id: string
          message?: string | null
          responded_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          invitee_id?: string
          inviter_id?: string
          message?: string | null
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_invites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          attendee_count: number | null
          community_id: string | null
          created_at: string
          description: string | null
          end_time: string
          event_type: string
          id: string
          image_url: string | null
          is_online: boolean | null
          location: string | null
          max_attendees: number | null
          meeting_url: string | null
          organizer_id: string
          price_cents: number | null
          privacy_level: string
          requirements: string | null
          start_time: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          venue_name: string | null
        }
        Insert: {
          attendee_count?: number | null
          community_id?: string | null
          created_at?: string
          description?: string | null
          end_time: string
          event_type?: string
          id?: string
          image_url?: string | null
          is_online?: boolean | null
          location?: string | null
          max_attendees?: number | null
          meeting_url?: string | null
          organizer_id: string
          price_cents?: number | null
          privacy_level?: string
          requirements?: string | null
          start_time: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          venue_name?: string | null
        }
        Update: {
          attendee_count?: number | null
          community_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string
          event_type?: string
          id?: string
          image_url?: string | null
          is_online?: boolean | null
          location?: string | null
          max_attendees?: number | null
          meeting_url?: string | null
          organizer_id?: string
          price_cents?: number | null
          privacy_level?: string
          requirements?: string | null
          start_time?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_preferences: {
        Row: {
          auto_refresh_interval: number | null
          created_at: string
          diversity_weight: number | null
          engagement_weight: number | null
          freshness_weight: number | null
          id: string
          personalization_weight: number | null
          preferred_content_types: string[] | null
          show_injected_content: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_refresh_interval?: number | null
          created_at?: string
          diversity_weight?: number | null
          engagement_weight?: number | null
          freshness_weight?: number | null
          id?: string
          personalization_weight?: number | null
          preferred_content_types?: string[] | null
          show_injected_content?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_refresh_interval?: number | null
          created_at?: string
          diversity_weight?: number | null
          engagement_weight?: number | null
          freshness_weight?: number | null
          id?: string
          personalization_weight?: number | null
          preferred_content_types?: string[] | null
          show_injected_content?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      likes: {
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
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      live_streams: {
        Row: {
          category: string | null
          created_at: string
          creator_id: string
          description: string | null
          ended_at: string | null
          id: string
          is_live: boolean
          is_private: boolean | null
          max_viewers: number | null
          price_per_minute: number | null
          quality_settings: Json | null
          started_at: string | null
          stream_key: string | null
          stream_url: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          viewer_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          ended_at?: string | null
          id?: string
          is_live?: boolean
          is_private?: boolean | null
          max_viewers?: number | null
          price_per_minute?: number | null
          quality_settings?: Json | null
          started_at?: string | null
          stream_key?: string | null
          stream_url?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          viewer_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          is_live?: boolean
          is_private?: boolean | null
          max_viewers?: number | null
          price_per_minute?: number | null
          quality_settings?: Json | null
          started_at?: string | null
          stream_key?: string | null
          stream_url?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          viewer_count?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message_type: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          sender_id?: string
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
      moderation_reports: {
        Row: {
          action_taken: string | null
          auto_detected: boolean | null
          content_id: string | null
          content_type: string
          created_at: string
          description: string | null
          evidence_urls: string[] | null
          id: string
          moderator_id: string | null
          moderator_notes: string | null
          priority: string | null
          reason: string
          reported_user_id: string
          reporter_id: string | null
          resolved_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          action_taken?: string | null
          auto_detected?: boolean | null
          content_id?: string | null
          content_type: string
          created_at?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          moderator_id?: string | null
          moderator_notes?: string | null
          priority?: string | null
          reason: string
          reported_user_id: string
          reporter_id?: string | null
          resolved_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          action_taken?: string | null
          auto_detected?: boolean | null
          content_id?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          moderator_id?: string | null
          moderator_notes?: string | null
          priority?: string | null
          reason?: string
          reported_user_id?: string
          reporter_id?: string | null
          resolved_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          likes_count: number | null
          media_type: string | null
          privacy_level: string | null
          shares_count: number | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number | null
          media_type?: string | null
          privacy_level?: string | null
          shares_count?: number | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number | null
          media_type?: string | null
          privacy_level?: string | null
          shares_count?: number | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          interests: string[] | null
          location: string | null
          privacy_settings: Json | null
          profile_image_url: string | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string
          user_category: Database["public"]["Enums"]["user_category"] | null
          user_id: string
          username: string | null
        }
        Insert: {
          age?: number | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          interests?: string[] | null
          location?: string | null
          privacy_settings?: Json | null
          profile_image_url?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_category?: Database["public"]["Enums"]["user_category"] | null
          user_id: string
          username?: string | null
        }
        Update: {
          age?: number | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          interests?: string[] | null
          location?: string | null
          privacy_settings?: Json | null
          profile_image_url?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_category?: Database["public"]["Enums"]["user_category"] | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      revenue_analytics: {
        Row: {
          cancellations: number | null
          content_revenue_cents: number | null
          created_at: string
          creator_id: string
          date: string
          growth_rate: number | null
          id: string
          new_subscriptions: number | null
          projected_monthly_revenue_cents: number | null
          renewals: number | null
          stream_revenue_cents: number | null
          subscription_revenue_cents: number | null
          tips_count: number | null
          tips_revenue_cents: number | null
          top_earning_content: Json | null
          top_tippers: Json | null
        }
        Insert: {
          cancellations?: number | null
          content_revenue_cents?: number | null
          created_at?: string
          creator_id: string
          date?: string
          growth_rate?: number | null
          id?: string
          new_subscriptions?: number | null
          projected_monthly_revenue_cents?: number | null
          renewals?: number | null
          stream_revenue_cents?: number | null
          subscription_revenue_cents?: number | null
          tips_count?: number | null
          tips_revenue_cents?: number | null
          top_earning_content?: Json | null
          top_tippers?: Json | null
        }
        Update: {
          cancellations?: number | null
          content_revenue_cents?: number | null
          created_at?: string
          creator_id?: string
          date?: string
          growth_rate?: number | null
          id?: string
          new_subscriptions?: number | null
          projected_monthly_revenue_cents?: number | null
          renewals?: number | null
          stream_revenue_cents?: number | null
          subscription_revenue_cents?: number | null
          tips_count?: number | null
          tips_revenue_cents?: number | null
          top_earning_content?: Json | null
          top_tippers?: Json | null
        }
        Relationships: []
      }
      stream_analytics: {
        Row: {
          chat_messages_count: number | null
          concurrent_viewers: number
          created_at: string
          id: string
          stream_id: string
          stream_quality: Json | null
          timestamp: string
          tips_received_count: number | null
          tips_total_amount: number | null
          total_viewers: number
        }
        Insert: {
          chat_messages_count?: number | null
          concurrent_viewers?: number
          created_at?: string
          id?: string
          stream_id: string
          stream_quality?: Json | null
          timestamp?: string
          tips_received_count?: number | null
          tips_total_amount?: number | null
          total_viewers?: number
        }
        Update: {
          chat_messages_count?: number | null
          concurrent_viewers?: number
          created_at?: string
          id?: string
          stream_id?: string
          stream_quality?: Json | null
          timestamp?: string
          tips_received_count?: number | null
          tips_total_amount?: number | null
          total_viewers?: number
        }
        Relationships: [
          {
            foreignKeyName: "stream_analytics_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_chat: {
        Row: {
          created_at: string
          id: string
          is_deleted: boolean | null
          message: string
          message_type: string | null
          metadata: Json | null
          stream_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          message: string
          message_type?: string | null
          metadata?: Json | null
          stream_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          message?: string
          message_type?: string | null
          metadata?: Json | null
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_chat_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_polls: {
        Row: {
          created_at: string
          creator_id: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          options: Json
          question: string
          stream_id: string
          updated_at: string
          votes: Json | null
        }
        Insert: {
          created_at?: string
          creator_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json
          question: string
          stream_id: string
          updated_at?: string
          votes?: Json | null
        }
        Update: {
          created_at?: string
          creator_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json
          question?: string
          stream_id?: string
          updated_at?: string
          votes?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_polls_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_reactions: {
        Row: {
          created_at: string
          id: string
          reaction_type: string
          stream_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction_type: string
          stream_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction_type?: string
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_reactions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_tips: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          is_anonymous: boolean | null
          message: string | null
          stream_id: string
          tipper_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          stream_id: string
          tipper_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          stream_id?: string
          tipper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_tips_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_viewers: {
        Row: {
          id: string
          joined_at: string
          last_seen: string
          stream_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          last_seen?: string
          stream_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          last_seen?: string
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_viewers_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          creator_id: string
          expires_at: string | null
          id: string
          price_cents: number
          status: string
          subscriber_id: string
          subscription_tier: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          expires_at?: string | null
          id?: string
          price_cents: number
          status?: string
          subscriber_id: string
          subscription_tier?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          expires_at?: string | null
          id?: string
          price_cents?: number
          status?: string
          subscriber_id?: string
          subscription_tier?: string
        }
        Relationships: []
      }
      typing_indicators: {
        Row: {
          conversation_id: string
          id: string
          is_typing: boolean | null
          last_typed_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_typing?: boolean | null
          last_typed_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_typing?: boolean | null
          last_typed_at?: string | null
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
      user_interactions: {
        Row: {
          created_at: string
          duration_ms: number | null
          id: string
          interaction_type: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          interaction_type: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          interaction_type?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_relationships: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
          relationship_type: string | null
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
          relationship_type?: string | null
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
          relationship_type?: string | null
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          created_at: string
          description: string | null
          evidence_urls: string[] | null
          id: string
          reason: string
          reported_id: string
          reporter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_engagement_rate: {
        Args: {
          comments_count: number
          likes_count: number
          shares_count: number
          views_count: number
        }
        Returns: number
      }
      can_view_post: {
        Args: {
          post_privacy_level: string
          post_user_id: string
          viewer_id: string
        }
        Returns: boolean
      }
      can_view_profile: {
        Args: { profile_user_id: string; viewer_id: string }
        Returns: boolean
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_stream_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_username: {
        Args: { display_name: string; user_id: string }
        Returns: string
      }
      get_creator_dashboard_summary: {
        Args: { creator_uuid: string }
        Returns: {
          engagement_rate: number
          monthly_growth: number
          recent_achievements: Json
          today_revenue_cents: number
          today_views: number
          top_content: Json
          total_followers: number
        }[]
      }
      get_feed_posts: {
        Args: { limit_count?: number; offset_count?: number; viewer_id: string }
        Returns: {
          author_display_name: string
          author_profile_image: string
          comments_count: number
          content: string
          created_at: string
          id: string
          image_url: string
          likes_count: number
          media_type: string
          privacy_level: string
          shares_count: number
          updated_at: string
          user_id: string
          video_url: string
        }[]
      }
      get_filtered_profile: {
        Args: { target_user_id: string }
        Returns: {
          age: number
          bio: string
          created_at: string
          display_name: string
          id: string
          interests: string[]
          location: string
          profile_image_url: string
          updated_at: string
          user_id: string
        }[]
      }
      get_stream_with_analytics: {
        Args: { stream_uuid: string }
        Returns: {
          category: string
          created_at: string
          creator_avatar: string
          creator_id: string
          creator_name: string
          description: string
          id: string
          is_live: boolean
          is_private: boolean
          price_per_minute: number
          tags: string[]
          title: string
          total_messages: number
          total_tips: number
          viewer_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      promote_to_admin: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      user_can_view_event: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      user_is_community_admin: {
        Args: { _community_id: string; _user_id: string }
        Returns: boolean
      }
      user_is_community_member: {
        Args: { _community_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      user_category: "hookup" | "creator" | "viewer"
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
      app_role: ["admin", "moderator", "user"],
      user_category: ["hookup", "creator", "viewer"],
    },
  },
} as const
