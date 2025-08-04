import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface UserPreferences {
  min_age: number;
  max_age: number;
  max_distance: number;
  show_me: 'men' | 'women' | 'everyone';
  location_enabled: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  min_age: 18,
  max_age: 50,
  max_distance: 50,
  show_me: 'everyone',
  location_enabled: true
};

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadPreferences = async () => {
      try {
        // For now, just use default preferences since table doesn't exist in types
        console.log('Would load preferences for user:', user.id);
        setPreferences(DEFAULT_PREFERENCES);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) return;

    setSaving(true);
    try {
      const newPreferences = { ...preferences, ...updates };
      
      // For now, just update local state since table doesn't exist in types
      console.log('Would update preferences:', newPreferences);
      setPreferences(newPreferences);
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    preferences,
    loading,
    saving,
    updatePreferences
  };
};