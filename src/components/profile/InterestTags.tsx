import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';

interface InterestTagsProps {
  selectedInterests: string[];
  onInterestsChange: (interests: string[]) => void;
  maxInterests?: number;
}

const POPULAR_INTERESTS = [
  'Travel', 'Music', 'Food', 'Fitness', 'Art', 'Movies', 'Books', 'Sports',
  'Photography', 'Dancing', 'Cooking', 'Gaming', 'Nature', 'Coffee', 'Yoga',
  'Hiking', 'Swimming', 'Fashion', 'Technology', 'Languages', 'Pets', 'Wine',
  'Comedy', 'Theater', 'Volunteer', 'Meditation', 'Writing', 'Cycling'
];

export const InterestTags = ({ 
  selectedInterests, 
  onInterestsChange, 
  maxInterests = 10 
}: InterestTagsProps) => {
  const [customInterest, setCustomInterest] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const addInterest = (interest: string) => {
    const trimmedInterest = interest.trim();
    if (
      trimmedInterest && 
      !selectedInterests.includes(trimmedInterest) && 
      selectedInterests.length < maxInterests
    ) {
      onInterestsChange([...selectedInterests, trimmedInterest]);
    }
  };

  const removeInterest = (interest: string) => {
    onInterestsChange(selectedInterests.filter(i => i !== interest));
  };

  const addCustomInterest = () => {
    if (customInterest.trim()) {
      addInterest(customInterest);
      setCustomInterest('');
      setShowCustomInput(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomInterest();
    }
  };

  const availableInterests = POPULAR_INTERESTS.filter(
    interest => !selectedInterests.includes(interest)
  );

  return (
    <div className="space-y-4">
      {/* Selected Interests */}
      {selectedInterests.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Your Interests</h4>
          <div className="flex flex-wrap gap-2">
            {selectedInterests.map((interest) => (
              <Badge
                key={interest}
                variant="default"
                className="flex items-center gap-1 px-3 py-1"
              >
                {interest}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeInterest(interest)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Popular Interests */}
      {availableInterests.length > 0 && selectedInterests.length < maxInterests && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Popular Interests</h4>
          <div className="flex flex-wrap gap-2">
            {availableInterests.slice(0, 15).map((interest) => (
              <Badge
                key={interest}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => addInterest(interest)}
              >
                {interest}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Custom Interest Input */}
      {selectedInterests.length < maxInterests && (
        <div className="space-y-2">
          {showCustomInput ? (
            <div className="flex gap-2">
              <Input
                placeholder="Add your own interest..."
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                onKeyPress={handleKeyPress}
                maxLength={30}
              />
              <Button onClick={addCustomInterest} disabled={!customInterest.trim()}>
                Add
              </Button>
              <Button variant="ghost" onClick={() => {
                setShowCustomInput(false);
                setCustomInterest('');
              }}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowCustomInput(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Custom Interest
            </Button>
          )}
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        {selectedInterests.length}/{maxInterests} interests selected
      </div>
    </div>
  );
};