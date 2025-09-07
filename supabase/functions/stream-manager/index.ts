import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, streamId, viewerId, creatorId } = await req.json();

    console.log(`[STREAM-MANAGER] Action: ${action}, StreamId: ${streamId}`);

    switch (action) {
      case 'start_stream':
        return await startStream(creatorId);
      case 'end_stream':
        return await endStream(streamId);
      case 'join_stream':
        return await joinStream(streamId, viewerId);
      case 'leave_stream':
        return await leaveStream(streamId, viewerId);
      case 'get_stream_info':
        return await getStreamInfo(streamId);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('[STREAM-MANAGER] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function startStream(creatorId: string) {
  const streamId = crypto.randomUUID();
  
  // In a real implementation, you would:
  // 1. Set up WebRTC signaling server
  // 2. Create RTMP endpoint for streaming
  // 3. Initialize recording if needed
  
  const streamData = {
    id: streamId,
    creator_id: creatorId,
    stream_url: `wss://your-signaling-server.com/stream/${streamId}`,
    rtmp_url: `rtmp://your-media-server.com/live/${streamId}`,
    viewer_count: 0,
    is_live: true,
    started_at: new Date().toISOString(),
    webrtc_config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    }
  };

  console.log(`[STREAM-MANAGER] Stream started: ${streamId}`);
  
  return new Response(JSON.stringify({ 
    success: true, 
    stream: streamData 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function endStream(streamId: string) {
  // In a real implementation:
  // 1. Stop recording
  // 2. Close WebRTC connections
  // 3. Update database
  
  console.log(`[STREAM-MANAGER] Stream ended: ${streamId}`);
  
  return new Response(JSON.stringify({ 
    success: true,
    message: 'Stream ended successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function joinStream(streamId: string, viewerId: string) {
  // In a real implementation:
  // 1. Verify viewer permissions
  // 2. Create WebRTC peer connection
  // 3. Return connection details
  
  const connectionData = {
    stream_id: streamId,
    viewer_id: viewerId,
    webrtc_config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    },
    signaling_url: `wss://your-signaling-server.com/viewer/${streamId}/${viewerId}`
  };

  console.log(`[STREAM-MANAGER] Viewer joined: ${viewerId} -> ${streamId}`);
  
  return new Response(JSON.stringify({ 
    success: true,
    connection: connectionData
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function leaveStream(streamId: string, viewerId: string) {
  console.log(`[STREAM-MANAGER] Viewer left: ${viewerId} <- ${streamId}`);
  
  return new Response(JSON.stringify({ 
    success: true,
    message: 'Left stream successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getStreamInfo(streamId: string) {
  // Mock stream info - in real implementation, query database
  const streamInfo = {
    id: streamId,
    title: 'Live Stream',
    viewer_count: Math.floor(Math.random() * 1000),
    is_live: true,
    duration: '00:45:32'
  };
  
  return new Response(JSON.stringify({ 
    success: true,
    stream: streamInfo
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}