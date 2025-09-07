import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

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
    console.log('Update preferences:', newPreferences);
    setPreferences(prev => ({ ...prev, ...newPreferences }));
    setSaving(false);
    return true;
  }, []);

  const getPreferences = useCallback(async () => {
    // Mock function
    console.log('Get preferences');
    return preferences;
  }, [preferences]);

  const resetPreferences = useCallback(async () => {
    // Mock function
    setSaving(true);
    console.log('Reset preferences');
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