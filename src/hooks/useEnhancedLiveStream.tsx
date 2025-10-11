import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LiveStreamManager } from '@/utils/LiveStreamManager';
import { toast } from '@/hooks/use-toast';

export interface StreamData {
  id: string;
  title: string;
  description: string;
  category: string;
  is_private: boolean;
  price_per_minute: number;
  tags: string[];
  max_viewers?: number;
  stream_key?: string;
  quality_settings: {
    resolution: string;
    bitrate: number;
    fps: number;
  };
}

export interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  avatar?: string;
  message: string;
  message_type: 'message' | 'tip' | 'join' | 'leave' | 'system' | 'emoji_reaction';
  metadata: any;
  created_at: string;
}

export interface StreamTip {
  id: string;
  tipper_id: string;
  tipper_name: string;
  amount_cents: number;
  message?: string;
  is_anonymous: boolean;
  created_at: string;
}

export interface StreamAnalytics {
  concurrent_viewers: number;
  total_viewers: number;
  chat_messages_count: number;
  tips_received_count: number;
  tips_total_amount: number;
  stream_quality: any;
}

export const useEnhancedLiveStream = () => {
  const { user } = useAuth();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [tips, setTips] = useState<StreamTip[]>([]);
  const [analytics, setAnalytics] = useState<StreamAnalytics | null>(null);
  const [reactions, setReactions] = useState<any[]>([]);
  
  const streamManagerRef = useRef<LiveStreamManager | null>(null);
  const viewerUpdateInterval = useRef<NodeJS.Timeout>();
  const analyticsInterval = useRef<NodeJS.Timeout>();

  // Initialize stream manager
  useEffect(() => {
    streamManagerRef.current = new LiveStreamManager(
      setViewerCount,
      handleNewChatMessage,
      setConnectionState
    );

    return () => {
      streamManagerRef.current?.stopStream();
      if (viewerUpdateInterval.current) clearInterval(viewerUpdateInterval.current);
      if (analyticsInterval.current) clearInterval(analyticsInterval.current);
    };
  }, []);

  // Create a new stream
  const createStream = useCallback(async (streamConfig: Partial<StreamData>) => {
    if (!user) throw new Error('User must be authenticated');

    try {
      const { data, error } = await supabase
        .from('live_streams')
        .insert({
          creator_id: user.id,
          title: streamConfig.title || 'Live Stream',
          description: streamConfig.description || '',
          category: streamConfig.category || 'Just Chatting',
          is_private: streamConfig.is_private || false,
          price_per_minute: streamConfig.price_per_minute || 0,
          tags: streamConfig.tags || [],
          max_viewers: streamConfig.max_viewers,
          quality_settings: streamConfig.quality_settings || {
            resolution: '720p',
            bitrate: 2500,
            fps: 30
          },
          stream_key: await generateStreamKey(),
          is_live: false
        })
        .select()
        .single();

      if (error) throw error;
      
      // Transform the data to match StreamData interface
      const transformedData = {
        ...data,
        quality_settings: typeof data.quality_settings === 'string' 
          ? JSON.parse(data.quality_settings)
          : data.quality_settings || { resolution: '720p', bitrate: 2500, fps: 30 }
      };
      
      setStreamData(transformedData);
      return data;
    } catch (error) {
      console.error('Error creating stream:', error);
      throw error;
    }
  }, [user]);

  // Start broadcasting
  const startBroadcast = useCallback(async (videoElement: HTMLVideoElement, streamId: string) => {
    if (!streamManagerRef.current || !streamData) return;

    try {
      setConnectionState('connecting');
      
      // Start WebRTC stream
      await streamManagerRef.current.startStream(videoElement, {
        video: true,
        audio: true,
        facingMode: 'user'
      });

      // Update stream status in database
      const { error } = await supabase
        .from('live_streams')
        .update({ 
          is_live: true,
          started_at: new Date().toISOString()
        })
        .eq('id', streamId);

      if (error) throw error;

      setIsStreaming(true);
      
      // Start viewer tracking
      startViewerTracking(streamId);
      
      // Start analytics collection
      startAnalyticsTracking(streamId);

      toast({
        title: "Stream Started",
        description: "You're now live!",
      });

    } catch (error) {
      console.error('Error starting broadcast:', error);
      toast({
        title: "Error",
        description: "Failed to start stream",
        variant: "destructive",
      });
    }
  }, [streamData]);

  // Stop broadcasting
  const stopBroadcast = useCallback(async (streamId: string) => {
    try {
      await streamManagerRef.current?.stopStream();
      
      // Update stream status
      const { error } = await supabase
        .from('live_streams')
        .update({ 
          is_live: false,
          ended_at: new Date().toISOString()
        })
        .eq('id', streamId);

      if (error) throw error;

      setIsStreaming(false);
      setConnectionState('disconnected');
      
      // Stop tracking
      if (viewerUpdateInterval.current) clearInterval(viewerUpdateInterval.current);
      if (analyticsInterval.current) clearInterval(analyticsInterval.current);

      toast({
        title: "Stream Ended",
        description: "Your broadcast has ended",
      });

    } catch (error) {
      console.error('Error stopping broadcast:', error);
    }
  }, []);

  // Join stream as viewer
  const joinStream = useCallback(async (streamId: string, videoElement: HTMLVideoElement) => {
    if (!user) return;

    try {
      setConnectionState('connecting');
      
      // Join WebRTC stream
      await streamManagerRef.current?.joinStream(streamId, videoElement);
      
      // Add viewer to database
      await supabase
        .from('stream_viewers')
        .upsert({
          stream_id: streamId,
          user_id: user.id,
          last_seen: new Date().toISOString()
        });

      // Start periodic viewer updates
      const interval = setInterval(async () => {
        await supabase
          .from('stream_viewers')
          .update({ last_seen: new Date().toISOString() })
          .eq('stream_id', streamId)
          .eq('user_id', user.id);
      }, 15000); // Update every 15 seconds

      viewerUpdateInterval.current = interval;

      toast({
        title: "Joined Stream",
        description: "Connected to live stream",
      });

    } catch (error) {
      console.error('Error joining stream:', error);
      toast({
        title: "Error",
        description: "Failed to join stream",
        variant: "destructive",
      });
    }
  }, [user]);

  // Send chat message
  const sendChatMessage = useCallback(async (streamId: string, message: string, messageType: ChatMessage['message_type'] = 'message') => {
    if (!user || !message.trim()) return;

    try {
      // Validate and sanitize input
      const { streamChatSchema } = await import('@/lib/validationSchemas');
      const validated = streamChatSchema.parse({
        message,
        stream_id: streamId,
        message_type: messageType
      });

      const { data, error } = await supabase
        .from('stream_chat')
        .insert({
          stream_id: validated.stream_id,
          user_id: user.id,
          message: validated.message,
          message_type: validated.message_type,
          metadata: {}
        })
        .select(`
          *,
          profiles:user_id (display_name, profile_image_url)
        `)
        .single();

      if (error) throw error;

      // Send through WebRTC data channel
      streamManagerRef.current?.sendChatMessage(message, user.user_metadata?.display_name || 'Anonymous');

    } catch (error) {
      console.error('Error sending chat message:', error);
    }
  }, [user]);

  // Send tip
  const sendTip = useCallback(async (streamId: string, amountCents: number, message?: string, isAnonymous = false) => {
    if (!user) throw new Error('Must be authenticated to send tips');

    try {
      const { data, error } = await supabase
        .from('stream_tips')
        .insert({
          stream_id: streamId,
          tipper_id: user.id,
          amount_cents: amountCents,
          message: message || null,
          is_anonymous: isAnonymous
        })
        .select(`
          *,
          profiles:tipper_id (display_name)
        `)
        .single();

      if (error) throw error;

      // Send tip notification through chat
      const tipperName = isAnonymous ? 'Anonymous' : user.user_metadata?.display_name || 'Someone';
      await sendChatMessage(streamId, 
        `${tipperName} tipped $${(amountCents / 100).toFixed(2)}${message ? `: ${message}` : ''}`,
        'tip'
      );

      toast({
        title: "Tip Sent",
        description: `Sent $${(amountCents / 100).toFixed(2)} tip`,
      });

    } catch (error) {
      console.error('Error sending tip:', error);
      throw error;
    }
  }, [user, sendChatMessage]);

  // Send reaction
  const sendReaction = useCallback(async (streamId: string, reactionType: 'heart' | 'fire' | 'wow' | 'laugh' | 'sad' | 'angry') => {
    if (!user) return;

    try {
      await supabase
        .from('stream_reactions')
        .insert({
          stream_id: streamId,
          user_id: user.id,
          reaction_type: reactionType
        });

      // Add to local state for immediate UI feedback
      const newReaction = {
        id: crypto.randomUUID(),
        reaction_type: reactionType,
        created_at: new Date().toISOString()
      };
      
      setReactions(prev => [...prev, newReaction]);
      
      // Remove after animation (5 seconds)
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== newReaction.id));
      }, 5000);

    } catch (error) {
      console.error('Error sending reaction:', error);
    }
  }, [user]);

  // Handle new chat messages
  const handleNewChatMessage = useCallback((message: any) => {
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: message.user_id || 'unknown',
      username: message.username,
      avatar: message.avatar,
      message: message.message,
      message_type: message.type || 'message',
      metadata: message.metadata || {},
      created_at: new Date().toISOString()
    };

    setChatMessages(prev => [...prev.slice(-49), newMessage]); // Keep last 50 messages
  }, []);

  // Start viewer tracking
  const startViewerTracking = (streamId: string) => {
    const interval = setInterval(async () => {
      const { count } = await supabase
        .from('stream_viewers')
        .select('*', { count: 'exact' })
        .eq('stream_id', streamId)
        .gte('last_seen', new Date(Date.now() - 30000).toISOString()); // Active in last 30 seconds
      
      setViewerCount(count || 0);
    }, 5000);

    viewerUpdateInterval.current = interval;
  };

  // Start analytics tracking
  const startAnalyticsTracking = (streamId: string) => {
    const interval = setInterval(async () => {
      const [viewersResult, tipsResult, chatResult] = await Promise.all([
        supabase
          .from('stream_viewers')
          .select('*', { count: 'exact' })
          .eq('stream_id', streamId)
          .gte('last_seen', new Date(Date.now() - 30000).toISOString()),
        supabase
          .from('stream_tips')
          .select('amount_cents')
          .eq('stream_id', streamId),
        supabase
          .from('stream_chat')
          .select('*', { count: 'exact' })
          .eq('stream_id', streamId)
      ]);

      const analyticsData: StreamAnalytics = {
        concurrent_viewers: viewersResult.count || 0,
        total_viewers: viewerCount,
        chat_messages_count: chatResult.count || 0,
        tips_received_count: tipsResult.data?.length || 0,
        tips_total_amount: tipsResult.data?.reduce((sum, tip) => sum + tip.amount_cents, 0) || 0,
        stream_quality: streamData?.quality_settings || {}
      };

      setAnalytics(analyticsData);

      // Save to analytics table
      await supabase
        .from('stream_analytics')
        .insert({
          stream_id: streamId,
          ...analyticsData
        });

    }, 30000); // Every 30 seconds

    analyticsInterval.current = interval;
  };

  // Generate stream key
  const generateStreamKey = async () => {
    const { data } = await supabase.rpc('generate_stream_key');
    return data;
  };

  // Load chat messages for a stream
  const loadChatMessages = useCallback(async (streamId: string, limit = 50) => {
    const { data, error } = await supabase
      .from('stream_chat')
      .select(`
        id,
        user_id,
        message,
        message_type,
        metadata,
        created_at,
        profiles!stream_chat_user_id_fkey (display_name, profile_image_url)
      `)
      .eq('stream_id', streamId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error loading chat:', error);
      return;
    }

    const messages: ChatMessage[] = (data || []).map(msg => ({
      id: msg.id,
      user_id: msg.user_id,
      username: (msg.profiles as any)?.display_name || 'Anonymous',
      avatar: (msg.profiles as any)?.profile_image_url,
      message: msg.message,
      message_type: msg.message_type as ChatMessage['message_type'],
      metadata: msg.metadata,
      created_at: msg.created_at
    })).reverse();

    setChatMessages(messages);
  }, []);

  return {
    // Stream state
    isStreaming,
    streamData,
    viewerCount,
    connectionState,
    chatMessages,
    tips,
    analytics,
    reactions,
    
    // Stream actions
    createStream,
    startBroadcast,
    stopBroadcast,
    joinStream,
    
    // Interaction actions
    sendChatMessage,
    sendTip,
    sendReaction,
    loadChatMessages,
    
    // Stream manager reference
    streamManager: streamManagerRef.current
  };
};