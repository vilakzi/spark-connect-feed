import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { Users, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const DiscoverySettings = () => {
  const { preferences, updatePreferences, saving } = useUserPreferences();
  const { toast } = useToast();

  const handleShowMeChange = async (showMe: 'men' | 'women' | 'everyone') => {
    const success = await updatePreferences({ show_me: showMe });
    if (success) {
      toast({
        title: "Discovery preferences updated",
        description: `You'll now see ${showMe === 'everyone' ? 'all profiles' : showMe}`
      });
    }
  };

  const handleAgeRangeChange = async (type: 'min' | 'max', age: number) => {
    const updates = type === 'min' 
      ? { min_age: age }
      : { max_age: age };
    
    const success = await updatePreferences(updates);
    if (success) {
      toast({
        title: "Age preference updated",
        description: `Age range: ${type === 'min' ? age : preferences.min_age} - ${type === 'max' ? age : preferences.max_age} years`
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Discovery Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Show Me */}
        <div className="space-y-3">
          <Label>Show me</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'men', label: 'Men' },
              { value: 'women', label: 'Women' },
              { value: 'everyone', label: 'Everyone' }
            ].map((option) => (
              <Button
                key={option.value}
                variant={preferences.show_me === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleShowMeChange(option.value as 'men' | 'women' | 'everyone')}
                disabled={saving}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Age Range */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <Label>Age Range</Label>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Minimum age
              </span>
              <Badge variant="secondary">
                {preferences.min_age} years
              </Badge>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {[18, 21, 25, 30, 35, 40].map((age) => (
                <Button
                  key={age}
                  variant={preferences.min_age === age ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAgeRangeChange('min', age)}
                  disabled={saving || age >= preferences.max_age}
                  className="text-xs"
                >
                  {age}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Maximum age
              </span>
              <Badge variant="secondary">
                {preferences.max_age} years
              </Badge>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {[25, 30, 35, 40, 50, 60].map((age) => (
                <Button
                  key={age}
                  variant={preferences.max_age === age ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAgeRangeChange('max', age)}
                  disabled={saving || age <= preferences.min_age}
                  className="text-xs"
                >
                  {age}
                </Button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-center text-muted-foreground">
              You'll see profiles aged {preferences.min_age} - {preferences.max_age} years
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};