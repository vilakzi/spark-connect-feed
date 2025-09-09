import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { logWarn } from '@/lib/secureLogger';

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    ageRange: [18, 65],
    min_age: 18,
    max_age: 65,
    distance: 50,
    max_distance: 50,
    show_me: 'all',
    location_enabled: true,
    interests: [],
    dealBreakers: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const updatePreferences = useCallback(async (newPreferences: any) => {
    // Mock function - preferences would need proper database setup
    setSaving(true);
    logWarn('Update preferences called - needs proper database implementation', newPreferences, 'useUserPreferences');
    setPreferences(prev => ({ ...prev, ...newPreferences }));
    setSaving(false);
    return true;
  }, []);

  const getPreferences = useCallback(async () => {
    // Mock function
    logWarn('Get preferences called - needs proper database implementation', undefined, 'useUserPreferences');
    return preferences;
  }, [preferences]);

  const resetPreferences = useCallback(async () => {
    // Mock function
    setSaving(true);
    logWarn('Reset preferences called - needs proper database implementation', undefined, 'useUserPreferences');
    setPreferences({
      ageRange: [18, 65],
      min_age: 18,
      max_age: 65,
      distance: 50,
      max_distance: 50,
      show_me: 'all',
      location_enabled: true,
      interests: [],
      dealBreakers: []
    });
    setSaving(false);
    return true;
  }, []);

  return {
    preferences,
    loading,
    saving,
    updatePreferences,
    getPreferences,
    resetPreferences
  };
};