import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { useChat } from '@/hooks/useChat';
import { usePresence } from '@/hooks/usePresence';
import { useAuth } from '@/hooks/useAuth';

interface ChatInterfaceProps {
  conversationId: string;
  onBack: () => void;
}

export const ChatInterface = ({ conversationId, onBack }: ChatInterfaceProps) => {
  const { 
    messages, 
    conversations, 
    typingUsers, 
    loading,
    fetchMessages, 
    sendMessage, 
    updateTypingStatus,
    markMessagesAsRead 
  } = useChat();
  
  const { user } = useAuth();
  const { isUserOnline } = usePresence();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Find current conversation
  const conversation = conversations.find(c => c.id === conversationId);
  const otherUser = conversation?.other_user;
  const isOtherUserOnline = otherUser?.id ? isUserOnline(otherUser.id) : false;

  // Fetch messages when conversation changes
  useEffect(() => {
    fetchMessages(conversationId);
    markMessagesAsRead(conversationId);
  }, [conversationId, fetchMessages, markMessagesAsRead]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(conversationId, content);
  };

  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true);
      updateTypingStatus(conversationId, true);
    }
  };

  const handleTypingStop = () => {
    if (isTyping) {
      setIsTyping(false);
      updateTypingStatus(conversationId, false);
    }
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Conversation not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={otherUser?.profile_image_url} 
                  alt={otherUser?.display_name || 'User'} 
                />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40">
                  {otherUser?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {isOtherUserOnline && (
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-sm">
                {otherUser?.display_name || 'Unknown User'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isOtherUserOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground text-center">
                No messages yet.<br />
                <span className="text-sm">Start the conversation!</span>
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message}
                isOwnMessage={message.sender_id === user?.id}
              />
            ))
          )}
          
          {typingUsers.length > 0 && (
            <TypingIndicator userNames={[otherUser?.display_name || 'Someone']} />
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <MessageInput 
          onSend={handleSendMessage}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
        />
      </div>
    </div>
  );
};