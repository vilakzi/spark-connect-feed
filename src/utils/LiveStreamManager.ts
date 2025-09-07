export class LiveStreamManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private isStreaming = false;
  private viewerCount = 0;

  private onViewerCountChange?: (count: number) => void;
  private onChatMessage?: (message: any) => void;
  private onConnectionStateChange?: (state: string) => void;

  constructor(
    onViewerCountChange?: (count: number) => void,
    onChatMessage?: (message: any) => void,
    onConnectionStateChange?: (state: string) => void
  ) {
    this.onViewerCountChange = onViewerCountChange;
    this.onChatMessage = onChatMessage;
    this.onConnectionStateChange = onConnectionStateChange;
  }

  async startStream(videoElement: HTMLVideoElement, options: {
    video: boolean;
    audio: boolean;
    facingMode?: 'user' | 'environment';
  } = { video: true, audio: true }): Promise<string> {
    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: options.video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: options.facingMode || 'user'
        } : false,
        audio: options.audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      });

      // Display local stream
      videoElement.srcObject = this.localStream;
      videoElement.muted = true; // Prevent feedback

      // Setup WebRTC peer connection
      this.setupPeerConnection();

      // Add local stream tracks
      this.localStream.getTracks().forEach(track => {
        this.pc?.addTrack(track, this.localStream!);
      });

      // Setup data channel for chat
      this.setupDataChannel();

      this.isStreaming = true;
      this.onConnectionStateChange?.('streaming');

      // Return mock stream ID - in real implementation, this would come from signaling server
      return crypto.randomUUID();

    } catch (error) {
      console.error('Error starting stream:', error);
      throw new Error('Failed to start stream: ' + (error as Error).message);
    }
  }

  async joinStream(streamId: string, videoElement: HTMLVideoElement): Promise<void> {
    try {
      // Setup WebRTC peer connection for viewing
      this.setupPeerConnection();

      // Setup data channel for chat
      this.setupDataChannelForViewer();

      // In a real implementation, you would:
      // 1. Connect to signaling server
      // 2. Exchange ICE candidates
      // 3. Handle offer/answer exchange

      this.onConnectionStateChange?.('connecting');

      // Mock receiving remote stream
      setTimeout(() => {
        // Create a mock remote stream for demo purposes
        this.createMockRemoteStream(videoElement);
        this.onConnectionStateChange?.('connected');
        this.updateViewerCount(Math.floor(Math.random() * 500) + 50);
      }, 1000);

    } catch (error) {
      console.error('Error joining stream:', error);
      throw new Error('Failed to join stream: ' + (error as Error).message);
    }
  }

  private setupPeerConnection() {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    this.pc = new RTCPeerConnection(config);

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE candidate:', event.candidate);
        // In real implementation, send to signaling server
      }
    };

    this.pc.ontrack = (event) => {
      console.log('Received remote track');
      this.remoteStream = event.streams[0];
    };

    this.pc.onconnectionstatechange = () => {
      console.log('Connection state:', this.pc?.connectionState);
      this.onConnectionStateChange?.(this.pc?.connectionState || 'disconnected');
    };
  }

  private setupDataChannel() {
    if (!this.pc) return;

    this.dataChannel = this.pc.createDataChannel('chat', {
      ordered: true
    });

    this.dataChannel.onopen = () => {
      console.log('Data channel opened');
    };

    this.dataChannel.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.onChatMessage?.(message);
    };
  }

  private setupDataChannelForViewer() {
    if (!this.pc) return;

    this.pc.ondatachannel = (event) => {
      const channel = event.channel;
      
      channel.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.onChatMessage?.(message);
      };

      this.dataChannel = channel;
    };
  }

  private createMockRemoteStream(videoElement: HTMLVideoElement) {
    // Create a mock stream with colored rectangles for demo
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d')!;

    const animate = () => {
      if (!this.isStreaming) return;

      // Create animated background
      const hue = (Date.now() / 50) % 360;
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add some text
      ctx.fillStyle = 'white';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Live Stream Demo', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px Arial';
      ctx.fillText(`Viewers: ${this.viewerCount}`, canvas.width / 2, canvas.height / 2 + 60);

      requestAnimationFrame(animate);
    };

    animate();

    // Create stream from canvas
    const stream = canvas.captureStream(30);
    videoElement.srcObject = stream;
    this.remoteStream = stream;
  }

  sendChatMessage(message: string, username: string) {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.warn('Data channel not ready');
      return;
    }

    const chatMessage = {
      type: 'chat',
      username,
      message,
      timestamp: Date.now()
    };

    this.dataChannel.send(JSON.stringify(chatMessage));
  }

  updateViewerCount(count: number) {
    this.viewerCount = count;
    this.onViewerCountChange?.(count);
  }

  async stopStream() {
    this.isStreaming = false;

    // Stop all tracks
    this.localStream?.getTracks().forEach(track => track.stop());
    this.remoteStream?.getTracks().forEach(track => track.stop());

    // Close data channel
    this.dataChannel?.close();

    // Close peer connection
    this.pc?.close();

    // Reset state
    this.localStream = null;
    this.remoteStream = null;
    this.dataChannel = null;
    this.pc = null;

    this.onConnectionStateChange?.('disconnected');
  }

  switchCamera() {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    // Get current constraints
    const currentConstraints = videoTrack.getConstraints();
    const currentFacingMode = (currentConstraints as any).facingMode;

    // Toggle facing mode
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

    // Stop current track
    videoTrack.stop();

    // Get new stream with switched camera
    navigator.mediaDevices.getUserMedia({
      video: {
        ...currentConstraints,
        facingMode: newFacingMode
      } as MediaTrackConstraints,
      audio: true
    }).then(newStream => {
      // Replace video track in peer connection
      const newVideoTrack = newStream.getVideoTracks()[0];
      const sender = this.pc?.getSenders().find(s => s.track?.kind === 'video');
      
      if (sender && newVideoTrack) {
        sender.replaceTrack(newVideoTrack);
      }

      // Update local stream
      this.localStream = newStream;
    }).catch(error => {
      console.error('Error switching camera:', error);
    });
  }

  toggleMute() {
    if (!this.localStream) return;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return !audioTrack.enabled;
    }
    return false;
  }

  toggleVideo() {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return !videoTrack.enabled;
    }
    return false;
  }
}