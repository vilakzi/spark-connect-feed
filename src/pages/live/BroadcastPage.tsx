import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EnhancedStreamInterface } from '@/components/live/EnhancedStreamInterface';

const BroadcastPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const streamId = searchParams.get('streamId');

  const handleEndStream = () => {
    navigate('/live');
  };

  if (!streamId) {
    navigate('/live');
    return null;
  }

  return (
    <EnhancedStreamInterface 
      mode="broadcaster"
      streamId={streamId}
      onEndStream={handleEndStream}
    />
  );
};

export default BroadcastPage;