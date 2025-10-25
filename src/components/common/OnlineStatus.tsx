import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OnlineStatusProps {
  isOnline: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const OnlineStatus = ({ 
  isOnline, 
  size = 'md', 
  showText = false,
  className 
}: OnlineStatusProps) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  if (showText) {
    return (
      <Badge 
        variant={isOnline ? "default" : "secondary"}
        className={cn("flex items-center gap-1", className)}
      >
        <div 
          className={cn(
            "rounded-full",
            sizeClasses[size],
            isOnline ? "bg-green-500" : "bg-gray-400"
          )}
        />
        <span className={textSizeClasses[size]}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </Badge>
    );
  }

  return (
    <div 
      className={cn(
        "rounded-full border-2 border-background",
        sizeClasses[size],
        isOnline ? "bg-green-500" : "bg-gray-400",
        className
      )}
      title={isOnline ? 'Online' : 'Offline'}
    />
  );
};