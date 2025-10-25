interface TypingIndicatorProps {
  userNames: string[];
}

export const TypingIndicator = ({ userNames }: TypingIndicatorProps) => {
  const displayText = userNames.length === 1 
    ? `${userNames[0]} is typing...`
    : `${userNames.join(', ')} are typing...`;

  return (
    <div className="flex justify-start">
      <div className="bg-muted rounded-2xl px-3 py-2 max-w-[80%]">
        <div className="flex items-center space-x-1">
          <span className="text-sm text-muted-foreground">{displayText}</span>
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" />
            <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      </div>
    </div>
  );
};