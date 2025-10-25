import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Smile, Paperclip } from 'lucide-react';
import { useDebouncedTyping, useOptimizedChat } from '@/hooks/useOptimizedRealtime';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    display_name: string;
    profile_image_url: string;
  };
  profiles?: {
    display_name: string;
    profile_image_url: string;
  };
}

interface TypingIndicator {
  id: string;
  user_id: string;
  conversation_id: string;
  is_typing: boolean;
  last_typed_at: string;
}

interface OptimizedChatInterfaceProps {
  conversationId: string;
  otherUser?: {
    id: string;
    display_name: string;
    profile_image_url?: string;
  };
}

export const OptimizedChatInterface = ({ conversationId, otherUser }: OptimizedChatInterfaceProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { getOrCreateChatConnection, sendTypingIndicator } = useOptimizedChat();
  const { startTyping, stopTyping } = useDebouncedTyping(1000);

  // Load messages with React Query caching
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          conversation_id,
          message_type,
          is_read,
          created_at,
          profiles!messages_sender_id_fkey (
            display_name,
            profile_image_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data?.map(msg => ({
        ...msg,
        sender: msg.profiles
      })) || [];
    },
    enabled: !!conversationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Set up real-time connection
  useEffect(() => {
    if (!conversationId) return;

    const channel = getOrCreateChatConnection(conversationId);
    
    // Listen for new messages
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`
    }, (payload) => {
      // Optimistically update the cache
      queryClient.setQueryData(['messages', conversationId], (oldMessages: Message[] = []) => {
        const newMessage = payload.new as Message;
        return [...oldMessages, newMessage];
      });

      // Scroll to bottom for new messages
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    // Listen for typing indicators
    channel.on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'typing_indicators',
      filter: `conversation_id=eq.${conversationId}`
    }, (payload) => {
      const typingData = payload.new as TypingIndicator;
      if (typingData.user_id !== user?.id) {
        setIsTyping(typingData.is_typing);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, getOrCreateChatConnection, queryClient, user?.id]);

  // Handle typing indicators with debouncing
  const handleTyping = useCallback(() => {
    if (!user) return;

    startTyping(() => {
      sendTypingIndicator(conversationId, true);
    });

    // Auto-stop typing after delay
    setTimeout(() => {
      stopTyping(() => {
        sendTypingIndicator(conversationId, false);
      });
    }, 1000);
  }, [conversationId, sendTypingIndicator, startTyping, stopTyping, user]);

  // Send message with optimistic updates
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !user) return;

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: newMessage,
      sender_id: user.id,
      conversation_id: conversationId,
      message_type: 'text',
      is_read: false,
      created_at: new Date().toISOString(),
      sender: {
        display_name: user.email?.split('@')[0] || 'You',
        profile_image_url: ''
      }
    };

    // Optimistic update
    queryClient.setQueryData(['messages', conversationId], (oldMessages: Message[] = []) => {
      return [...oldMessages, tempMessage];
    });

    setNewMessage('');
    
    // Stop typing indicator
    sendTypingIndicator(conversationId, false);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage,
          sender_id: user.id,
          conversation_id: conversationId,
          message_type: 'text'
        });

      if (error) throw error;

      // Update last message in conversation
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Revert optimistic update on error
      queryClient.setQueryData(['messages', conversationId], (oldMessages: Message[] = []) => {
        return oldMessages.filter(msg => msg.id !== tempMessage.id);
      });

      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  }, [newMessage, user, conversationId, queryClient, sendTypingIndicator, toast]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when component mounts or conversation changes
  useEffect(() => {
    if (!user || !conversationId) return;

    const markAsRead = async () => {
      try {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', user.id)
          .eq('is_read', false);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    markAsRead();
  }, [conversationId, user]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {otherUser && (
        <div className="flex items-center gap-3 p-4 border-b bg-card">
          <Avatar className="w-10 h-10">
            <AvatarImage src={otherUser.profile_image_url} />
            <AvatarFallback>
              {otherUser.display_name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{otherUser.display_name}</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 optimized-scroll">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender_id === user?.id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.sender_id === user?.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <div className="flex items-center justify-between mt-1 gap-2">
                <span className="text-xs opacity-70">
                  {formatTime(message.created_at)}
                </span>
                {message.sender_id === user?.id && (
                  <span className="text-xs opacity-70">
                    {message.is_read ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button variant="ghost" size="sm">
            <Smile className="h-4 w-4" />
          </Button>
          <Button 
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};