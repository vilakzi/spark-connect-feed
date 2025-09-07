import { useNavigate } from 'react-router-dom';
import { LiveStreamInterface } from '@/components/live/LiveStreamInterface';

const BroadcastPage = () => {
  const navigate = useNavigate();

  const handleEndStream = () => {
    navigate('/live');
  };

  return (
    <LiveStreamInterface 
      mode="broadcaster" 
      onEndStream={handleEndStream}
    />
  );
};

export default BroadcastPage;