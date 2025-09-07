import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    ageRange: [18, 65],
    distance: 50,
    interests: [],
    dealBreakers: []
  });
  const [loading, setLoading] = useState(false);

  const updatePreferences = useCallback(async (newPreferences: any) => {
    // Mock function - preferences would need proper database setup
    console.log('Update preferences:', newPreferences);
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  }, []);

  const getPreferences = useCallback(async () => {
    // Mock function
    console.log('Get preferences');
    return preferences;
  }, [preferences]);

  const resetPreferences = useCallback(async () => {
    // Mock function
    console.log('Reset preferences');
    setPreferences({
      ageRange: [18, 65],
      distance: 50,
      interests: [],
      dealBreakers: []
    });
  }, []);

  return {
    preferences,
    loading,
    updatePreferences,
    getPreferences,
    resetPreferences
  };
};