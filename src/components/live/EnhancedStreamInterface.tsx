import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Share,
  TrendingUp,
  MessageCircle,
  DollarSign,
  Eye,
  Flame,
  Smile,
  Frown,
  ThumbsUp,
  Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEnhancedLiveStream } from '@/hooks/useEnhancedLiveStream';
import { toast } from '@/hooks/use-toast';

interface EnhancedStreamInterfaceProps {
  mode: 'broadcaster' | 'viewer';
  streamId?: string;
  onEndStream?: () => void;
}

export const EnhancedStreamInterface = ({ mode, streamId, onEndStream }: EnhancedStreamInterfaceProps) => {
  const { user } = useAuth();
  const {
    isStreaming,
    streamData,
    viewerCount,
    connectionState,
    chatMessages,
    tips,
    analytics,
    reactions,
    startBroadcast,
    stopBroadcast,
    joinStream,
    sendChatMessage,
    sendTip,
    sendReaction,
    loadChatMessages,
    streamManager
  } = useEnhancedLiveStream();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [tipAmount, setTipAmount] = useState('5.00');
  const [tipMessage, setTipMessage] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (mode === 'viewer' && streamId) {
      loadChatMessages(streamId);
      if (videoRef.current) {
        joinStream(streamId, videoRef.current);
      }
    }
  }, [mode, streamId, loadChatMessages, joinStream]);

  const handleStartBroadcast = async () => {
    if (!videoRef.current || !streamId) return;
    await startBroadcast(videoRef.current, streamId);
  };

  const handleStopBroadcast = async () => {
    if (!streamId) return;
    await stopBroadcast(streamId);
    onEndStream?.();
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !streamId) return;
    await sendChatMessage(streamId, chatMessage);
    setChatMessage('');
  };

  const handleSendTip = async () => {
    if (!streamId) return;
    try {
      const amountCents = Math.round(parseFloat(tipAmount) * 100);
      await sendTip(streamId, amountCents, tipMessage || undefined);
      setShowTipDialog(false);
      setTipAmount('5.00');
      setTipMessage('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send tip",
        variant: "destructive",
      });
    }
  };

  const handleReaction = (type: 'heart' | 'fire' | 'wow' | 'laugh' | 'sad' | 'angry') => {
    if (!streamId) return;
    sendReaction(streamId, type);
  };

  const toggleMute = () => {
    const muted = streamManager?.toggleMute();
    setIsMuted(muted || false);
  };

  const toggleVideo = () => {
    const videoOff = streamManager?.toggleVideo();
    setIsVideoOff(videoOff || false);
  };

  const switchCamera = () => {
    streamManager?.switchCamera();
  };

  const shareStream = () => {
    const url = `${window.location.origin}/live/${streamId}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join my live stream!',
        text: 'Watch my live stream',
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

  const reactionIcons = {
    heart: Heart,
    fire: Flame,
    wow: Zap,
    laugh: Smile,
    sad: Frown,
    angry: ThumbsUp
  };

  return (
    <div className="h-screen flex flex-col bg-black relative overflow-hidden">
      {/* Video Container */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted={mode === 'broadcaster'}
        />

        {/* Floating Reactions */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2 pointer-events-none">
          {reactions.map((reaction) => {
            const IconComponent = reactionIcons[reaction.reaction_type as keyof typeof reactionIcons];
            return (
              <div
                key={reaction.id}
                className="animate-bounce text-2xl opacity-80"
                style={{
                  animation: 'float 5s ease-out forwards'
                }}
              >
                <IconComponent className="h-8 w-8 text-red-500" />
              </div>
            );
          })}
        </div>

        {/* Stream Status Overlay */}
        <div className="absolute top-4 left-4 flex items-center space-x-2 z-10">
          {isStreaming && (
            <Badge className="bg-red-500 animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full mr-1"></div>
              LIVE
            </Badge>
          )}
          <Badge className="bg-black/70">
            <Users className="h-3 w-3 mr-1" />
            {viewerCount.toLocaleString()}
          </Badge>
          <Badge className={`${
            connectionState === 'connected' || connectionState === 'streaming' ? 'bg-green-500' : 
            connectionState === 'connecting' ? 'bg-yellow-500' : 'bg-gray-500'
          }`}>
            {connectionState}
          </Badge>
        </div>

        {/* Analytics Panel */}
        {mode === 'broadcaster' && showAnalytics && analytics && (
          <div className="absolute top-4 right-4 z-10">
            <Card className="w-72 bg-black/80 text-white border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Live Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Concurrent Viewers:</span>
                  <span>{analytics.concurrent_viewers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Viewers:</span>
                  <span>{analytics.total_viewers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Chat Messages:</span>
                  <span>{analytics.chat_messages_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tips Received:</span>
                  <span>{analytics.tips_received_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tips Total:</span>
                  <span>${(analytics.tips_total_amount / 100).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stream Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex items-center space-x-3 bg-black/70 rounded-full px-6 py-3">
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
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="rounded-full"
                >
                  <TrendingUp className="h-4 w-4" />
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
                    onClick={handleStopBroadcast}
                    className="rounded-full"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleStartBroadcast}
                    className="bg-red-500 hover:bg-red-600 rounded-full"
                  >
                    Go Live
                  </Button>
                )}
              </>
            ) : (
              <>
                {/* Viewer Reaction Buttons */}
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => handleReaction('heart')}
                  className="rounded-full"
                >
                  <Heart className="h-4 w-4 text-red-500" />
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => handleReaction('fire')}
                  className="rounded-full"
                >
                  <Flame className="h-4 w-4 text-orange-500" />
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => handleReaction('wow')}
                  className="rounded-full"
                >
                  <Zap className="h-4 w-4 text-yellow-500" />
                </Button>
                
                <Dialog open={showTipDialog} onOpenChange={setShowTipDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="secondary" className="rounded-full">
                      <Gift className="h-4 w-4 mr-1 text-green-500" />
                      Tip
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send a Tip</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Amount ($)</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="1"
                          value={tipAmount}
                          onChange={(e) => setTipAmount(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Message (optional)</label>
                        <Input
                          placeholder="Say something nice..."
                          value={tipMessage}
                          onChange={(e) => setTipMessage(e.target.value)}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={handleSendTip} className="flex-1">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Send ${tipAmount}
                        </Button>
                        <Button variant="outline" onClick={() => setShowTipDialog(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={shareStream}
                  className="rounded-full"
                >
                  <Share className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Chat Section */}
      <div className="h-80 bg-background border-t flex flex-col">
        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat" className="flex items-center space-x-1">
              <MessageCircle className="h-4 w-4" />
              <span>Chat</span>
            </TabsTrigger>
            <TabsTrigger value="tips" className="flex items-center space-x-1">
              <Gift className="h-4 w-4" />
              <span>Tips</span>
            </TabsTrigger>
            <TabsTrigger value="viewers" className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>Viewers</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="flex items-start space-x-2 text-sm">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={msg.avatar} />
                      <AvatarFallback className="text-xs">{msg.username[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className={`font-medium ${
                        msg.message_type === 'tip' ? 'text-yellow-500' : 
                        msg.message_type === 'system' ? 'text-blue-500' : 'text-primary'
                      }`}>
                        {msg.username}
                      </span>
                      <span className="ml-2">{msg.message}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tips" className="flex-1">
            <ScrollArea className="h-full p-4">
              <div className="space-y-2">
                {tips.map((tip) => (
                  <div key={tip.id} className="flex items-center space-x-2 p-2 bg-muted rounded">
                    <Gift className="h-4 w-4 text-yellow-500" />
                    <div className="flex-1">
                      <span className="font-medium">${(tip.amount_cents / 100).toFixed(2)}</span>
                      <span className="text-muted-foreground ml-1">
                        from {tip.is_anonymous ? 'Anonymous' : tip.tipper_name}
                      </span>
                      {tip.message && (
                        <p className="text-sm text-muted-foreground">{tip.message}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="viewers" className="flex-1">
            <ScrollArea className="h-full p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Current Viewers</span>
                  <Badge>{viewerCount}</Badge>
                </div>
                {/* Viewer list would go here */}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      <style>{`
        @keyframes float {
          0% {
            transform: translateY(0px);
            opacity: 1;
          }
          100% {
            transform: translateY(-100px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};