import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  read_at?: string;
  created_at: string;
}

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

export const MessageBubble = ({ message, isOwnMessage }: MessageBubbleProps) => {
  const { user } = useAuth();
  const isFromCurrentUser = message.sender_id === user?.id;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn(
      "flex",
      isFromCurrentUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] rounded-2xl px-3 py-2 shadow-sm",
        isFromCurrentUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted"
      )}>
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
        
        <div className={cn(
          "flex items-center justify-end mt-1 space-x-1",
          isFromCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          <span className="text-xs">
            {formatTime(message.created_at)}
          </span>
          
          {isFromCurrentUser && (
            <div className="flex">
              {message.read_at ? (
                <CheckCheck className="h-3 w-3" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};