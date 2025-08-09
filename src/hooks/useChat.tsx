import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

interface Conversation {
  id: string;
  match_id: string;
  participant_one_id: string;
  participant_two_id: string;
  last_message_id?: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  other_user?: {
    id: string;
    display_name: string;
    profile_image_url?: string;
  };
  last_message?: {
    content: string;
    sender_id: string;
  };
  unread_count?: number;
}

interface TypingIndicator {
  conversation_id: string;
  user_id: string;
  is_typing: boolean;
}

export const useChat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Simplified query without foreign key relationship that might not exist
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_one_id.eq.${user.id},participant_two_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('Error fetching conversations:', error.message);
        setConversations([]);
        return;
      }

      // Enrich conversations with other user data and unread count
        const enrichedConversations = await Promise.all(
        data.map(async (conv: Conversation) => {
          const otherUserId = conv.participant_one_id === user.id 
            ? conv.participant_two_id 
            : conv.participant_one_id;

          // Get other user profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, display_name, profile_image_url')
            .eq('id', otherUserId)
            .single();

          // Get last message for this conversation
          const { data: lastMessageData } = await supabase
            .from('messages')
            .select('content, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread message count
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .eq('is_read', false);

          return {
            id: conv.id,
            match_id: conv.match_id,
            participant_one_id: conv.participant_one_id,
            participant_two_id: conv.participant_two_id,
            last_message_id: conv.last_message_id,
            last_message_at: conv.last_message_at,
            created_at: conv.created_at,
            updated_at: conv.updated_at,
            other_user: profileData || undefined,
            last_message: lastMessageData || undefined,
            unread_count: count || 0
          };
        })
      );

      setConversations(enrichedConversations);
    } catch (error) {
      console.warn('Error fetching conversations:', error);
      // Don't show error toast for missing relationships - handle gracefully
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error loading messages",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!user || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      // Clear typing indicator
      await updateTypingStatus(conversationId, false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  }, [user, updateTypingStatus]);

  // Create conversation from match
  const createConversation = useCallback(async (matchId: string) => {
    try {
      const { data, error } = await supabase.rpc('create_conversation_from_match', {
        match_id_param: matchId
      });

      if (error) throw error;
      
      await fetchConversations();
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error starting conversation",
        description: "Please try again",
        variant: "destructive"
      });
      return null;
    }
  }, [fetchConversations]);

  // Update typing status
  const updateTypingStatus = useCallback(async (conversationId: string, isTyping: boolean) => {
    if (!user) return;

    try {
      await supabase
        .from('typing_indicators')
        .upsert({
          conversation_id: conversationId,
          user_id: user.id,
          is_typing: isTyping,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }, [user]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to conversation changes
    const conversationChannel = supabase
      .channel('conversations-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `participant_one_id=eq.${user.id}`
      }, () => {
        fetchConversations();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `participant_two_id=eq.${user.id}`
      }, () => {
        fetchConversations();
      })
      .subscribe();

    // Subscribe to new messages in current conversation
    let messageChannel: ReturnType<typeof supabase.channel> | null = null;
    if (currentConversationId) {
      messageChannel = supabase
        .channel(`messages-${currentConversationId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentConversationId}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
          
          // Show notification if message is from another user
          if (payload.new.sender_id !== user.id) {
            // Auto-mark as read if conversation is active
            markMessagesAsRead(currentConversationId);
          }
        })
        .subscribe();
    }

    // Subscribe to typing indicators
    let typingChannel: ReturnType<typeof supabase.channel> | null = null;
    if (currentConversationId) {
      typingChannel = supabase
        .channel(`typing-${currentConversationId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${currentConversationId}`
        }, (payload) => {
          const indicator = payload.new as TypingIndicator;
          if (indicator.user_id !== user.id) {
            setTypingUsers(prev => 
              indicator.is_typing 
                ? [...prev.filter(id => id !== indicator.user_id), indicator.user_id]
                : prev.filter(id => id !== indicator.user_id)
            );
          }
        })
        .subscribe();
    }

    return () => {
      supabase.removeChannel(conversationChannel);
      if (messageChannel) supabase.removeChannel(messageChannel);
      if (typingChannel) supabase.removeChannel(typingChannel);
    };
  }, [user, currentConversationId, fetchConversations, markMessagesAsRead]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  return {
    conversations,
    messages,
    loading,
    typingUsers,
    currentConversationId,
    setCurrentConversationId,
    fetchMessages,
    sendMessage,
    createConversation,
    updateTypingStatus,
    markMessagesAsRead,
    fetchConversations
  };
};