import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { MapPin, Navigation, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const LocationSettings = () => {
  const { location, error, loading, getCurrentLocation, checkPermission } = useGeolocation();
  const { preferences, updatePreferences, saving } = useUserPreferences();
  const { toast } = useToast();
  const [manualLocation, setManualLocation] = useState('');

  const handleLocationToggle = async (enabled: boolean) => {
    if (enabled) {
      const permission = await checkPermission();
      if (permission === 'denied') {
        toast({
          title: "Location Access Denied",
          description: "Please enable location access in your browser settings to use this feature.",
          variant: "destructive"
        });
        return;
      }
      getCurrentLocation();
    }

    const success = await updatePreferences({ location_enabled: enabled });
    if (success) {
      toast({
        title: enabled ? "Location enabled" : "Location disabled",
        description: enabled 
          ? "Your location will be used to find nearby matches" 
          : "Location-based matching has been disabled"
      });
    }
  };

  const handleDistanceChange = async (distance: number) => {
    const success = await updatePreferences({ max_distance: distance });
    if (success) {
      toast({
        title: "Distance preference updated",
        description: `You'll see profiles within ${distance}km`
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location & Distance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="location-enabled">Enable Location</Label>
            <p className="text-sm text-muted-foreground">
              Find people near you
            </p>
          </div>
          <Switch
            id="location-enabled"
            checked={preferences.location_enabled}
            onCheckedChange={handleLocationToggle}
            disabled={saving}
          />
        </div>

        {/* Current Location Status */}
        {preferences.location_enabled && (
          <div className="space-y-3">
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Getting your location...
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            )}

            {location && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  Location detected (±{Math.round(location.accuracy)}m accuracy)
                </span>
              </div>
            )}

            <Button
              onClick={getCurrentLocation}
              variant="outline"
              size="sm"
              disabled={loading}
              className="w-full"
            >
              <Navigation className="w-4 h-4 mr-2" />
              {loading ? 'Getting Location...' : 'Update Location'}
            </Button>
          </div>
        )}

        {/* Manual Location Input */}
        <div className="space-y-2">
          <Label htmlFor="manual-location">City/Area (Optional)</Label>
          <Input
            id="manual-location"
            placeholder="e.g., New York, NY"
            value={manualLocation}
            onChange={(e) => setManualLocation(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            This will be shown on your profile
          </p>
        </div>

        {/* Distance Preference */}
        {preferences.location_enabled && (
          <div className="space-y-3">
            <Label>Maximum Distance</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Show profiles within
                </span>
                <Badge variant="secondary">
                  {preferences.max_distance}km
                </Badge>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[10, 25, 50, 100].map((distance) => (
                  <Button
                    key={distance}
                    variant={preferences.max_distance === distance ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDistanceChange(distance)}
                    disabled={saving}
                  >
                    {distance}km
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};