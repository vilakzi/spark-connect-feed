import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EnhancedStreamInterface } from '@/components/live/EnhancedStreamInterface';

const LiveStream = () => {
  const { streamId } = useParams();
  const navigate = useNavigate();

  const handleEndStream = () => {
    navigate('/live');
  };

  return (
    <EnhancedStreamInterface 
      mode="viewer" 
      streamId={streamId}
      onEndStream={handleEndStream}
    />
  );
};

export default LiveStream;