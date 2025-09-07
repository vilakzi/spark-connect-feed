import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MatchesListProps {
  onStartChat?: (matchId: string) => Promise<void>;
}

export const MatchesList: React.FC<MatchesListProps> = ({ onStartChat }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Matches</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">No matches yet. Keep swiping!</p>
      </CardContent>
    </Card>
  );
};