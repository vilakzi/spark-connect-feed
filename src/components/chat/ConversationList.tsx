import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from '@/hooks/useChat';
import { usePresence } from '@/hooks/usePresence';

interface ConversationListProps {
  onConversationSelect: (conversationId: string) => void;
}

export const ConversationList = ({ onConversationSelect }: ConversationListProps) => {
  const { conversations, loading } = useChat();
  const { isUserOnline } = usePresence();

  const formatLastMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const truncateMessage = (message: string, maxLength: number = 50) => {
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No conversations yet</h3>
          <p className="text-muted-foreground text-sm">
            Start chatting with your matches to see conversations here
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-8rem)]">
      <div className="space-y-2 p-4">
        {conversations.map((conversation) => {
          const isOnline = conversation.other_user?.id ? isUserOnline(conversation.other_user.id) : false;
          
          return (
            <Card 
              key={conversation.id}
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
              onClick={() => onConversationSelect(conversation.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage 
                        src={conversation.other_user?.profile_image_url} 
                        alt={conversation.other_user?.display_name || 'User'} 
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40">
                        {conversation.other_user?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm truncate">
                        {conversation.other_user?.display_name || 'Unknown User'}
                      </h4>
                      {conversation.unread_count && conversation.unread_count > 0 && (
                        <Badge variant="default" className="ml-2 h-5 px-2 text-xs">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate flex-1">
                        {conversation.last_message?.content 
                          ? truncateMessage(conversation.last_message.content)
                          : 'No messages yet'
                        }
                      </p>
                      {conversation.last_message_at && (
                        <div className="flex items-center text-xs text-muted-foreground ml-2">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatLastMessageTime(conversation.last_message_at)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
};