import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  RotateCcw, 
  Users, 
  Heart, 
  Gift, 
  Send,
  Settings,
  Share
} from 'lucide-react';
import { LiveStreamManager } from '@/utils/LiveStreamManager';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface LiveStreamInterfaceProps {
  mode: 'broadcaster' | 'viewer';
  streamId?: string;
  onEndStream?: () => void;
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
  type?: 'chat' | 'tip' | 'join' | 'leave';
  amount?: number;
}

export const LiveStreamInterface = ({ mode, streamId, onEndStream }: LiveStreamInterfaceProps) => {
  const { user } = useAuth();
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamManagerRef = useRef<LiveStreamManager | null>(null);

  useEffect(() => {
    // Initialize stream manager
    streamManagerRef.current = new LiveStreamManager(
      setViewerCount,
      handleChatMessage,
      setConnectionState
    );

    return () => {
      streamManagerRef.current?.stopStream();
    };
  }, []);

  const handleChatMessage = (message: any) => {
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      username: message.username,
      message: message.message,
      timestamp: message.timestamp,
      type: message.type || 'chat',
      amount: message.amount
    };

    setChatMessages(prev => [...prev, newMessage]);
  };

  const startBroadcast = async () => {
    if (!videoRef.current) return;

    try {
      setConnectionState('connecting');
      const newStreamId = await streamManagerRef.current?.startStream(videoRef.current, {
        video: true,
        audio: true,
        facingMode: 'user'
      });

      setIsStreaming(true);
      
      toast({
        title: "Stream Started",
        description: "You're now live! People can join your stream.",
      });

      // Add initial chat message
      handleChatMessage({
        username: 'System',
        message: `${user?.user_metadata?.display_name || 'User'} started streaming`,
        timestamp: Date.now(),
        type: 'join'
      });

    } catch (error) {
      console.error('Error starting broadcast:', error);
      toast({
        title: "Error",
        description: "Failed to start stream. Please check your camera and microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const stopBroadcast = async () => {
    await streamManagerRef.current?.stopStream();
    setIsStreaming(false);
    setConnectionState('disconnected');
    
    toast({
      title: "Stream Ended",
      description: "Your broadcast has ended.",
    });

    onEndStream?.();
  };

  const joinStream = async () => {
    if (!videoRef.current || !streamId) return;

    try {
      setConnectionState('connecting');
      await streamManagerRef.current?.joinStream(streamId, videoRef.current);
      
      toast({
        title: "Joined Stream",
        description: "Connected to live stream",
      });

    } catch (error) {
      console.error('Error joining stream:', error);
      toast({
        title: "Error",
        description: "Failed to join stream. Please try again.",
        variant: "destructive",
      });
    }
  };

  const sendMessage = () => {
    if (!chatMessage.trim() || !streamManagerRef.current) return;

    streamManagerRef.current.sendChatMessage(
      chatMessage,
      user?.user_metadata?.display_name || 'Anonymous'
    );

    // Add to local chat immediately for broadcaster
    if (mode === 'broadcaster') {
      handleChatMessage({
        username: user?.user_metadata?.display_name || 'You',
        message: chatMessage,
        timestamp: Date.now(),
        type: 'chat'
      });
    }

    setChatMessage('');
  };

  const toggleMute = () => {
    const muted = streamManagerRef.current?.toggleMute();
    setIsMuted(muted || false);
  };

  const toggleVideo = () => {
    const videoOff = streamManagerRef.current?.toggleVideo();
    setIsVideoOff(videoOff || false);
  };

  const switchCamera = () => {
    streamManagerRef.current?.switchCamera();
  };

  const shareStream = () => {
    const url = `${window.location.origin}/live/${streamId}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join my live stream!',
        text: 'Watch my live stream on ConnectsBuddy',
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "Stream link copied to clipboard",
      });
    }
  };

  useEffect(() => {
    if (mode === 'viewer' && streamId) {
      joinStream();
    }
  }, [mode, streamId]);

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Video Container */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted={mode === 'broadcaster'}
        />

        {/* Stream Status Overlay */}
        <div className="absolute top-4 left-4 flex items-center space-x-2 z-10">
          {isStreaming && (
            <Badge className="bg-red-500 animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full mr-1"></div>
              LIVE
            </Badge>
          )}
          <Badge className="bg-black/50">
            <Users className="h-3 w-3 mr-1" />
            {viewerCount}
          </Badge>
          <Badge className={`
            ${connectionState === 'connected' || connectionState === 'streaming' ? 'bg-green-500' : 
              connectionState === 'connecting' ? 'bg-yellow-500' : 'bg-gray-500'}
          `}>
            {connectionState}
          </Badge>
        </div>

        {/* Stream Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex items-center space-x-3 bg-black/50 rounded-full px-6 py-3">
            {mode === 'broadcaster' ? (
              <>
                <Button
                  size="sm"
                  variant={isMuted ? "destructive" : "secondary"}
                  onClick={toggleMute}
                  className="rounded-full"
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>

                <Button
                  size="sm"
                  variant={isVideoOff ? "destructive" : "secondary"}
                  onClick={toggleVideo}
                  className="rounded-full"
                >
                  {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={switchCamera}
                  className="rounded-full"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={shareStream}
                  className="rounded-full"
                >
                  <Share className="h-4 w-4" />
                </Button>

                {isStreaming ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={stopBroadcast}
                    className="rounded-full"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={startBroadcast}
                    className="bg-red-500 hover:bg-red-600 rounded-full"
                  >
                    Go Live
                  </Button>
                )}
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="secondary">
                  <Heart className="h-4 w-4 mr-1" />
                  Like
                </Button>
                <Button size="sm" variant="secondary">
                  <Gift className="h-4 w-4 mr-1" />
                  Tip
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={shareStream}
                >
                  <Share className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute top-4 right-4 z-10">
            <Card className="w-64">
              <CardHeader>
                <CardTitle className="text-sm">Stream Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xs">
                  <div>Resolution: 1280x720</div>
                  <div>Bitrate: 2500 kbps</div>
                  <div>FPS: 30</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Chat Section - Fixed height */}
      <div className="h-64 bg-background border-t flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {chatMessages.map((msg) => (
            <div key={msg.id} className="flex items-start space-x-2 text-sm">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">{msg.username[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <span className={`font-medium ${msg.type === 'tip' ? 'text-yellow-500' : 'text-primary'}`}>
                  {msg.username}
                </span>
                {msg.type === 'tip' && <span className="text-yellow-500"> tipped ${msg.amount}</span>}
                <span className="ml-2">{msg.message}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              placeholder="Type a message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1"
            />
            <Button size="sm" onClick={sendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};