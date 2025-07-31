import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

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
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading preferences:', error);
          return;
        }

        if (data) {
          setPreferences({
            min_age: data.min_age || DEFAULT_PREFERENCES.min_age,
            max_age: data.max_age || DEFAULT_PREFERENCES.max_age,
            max_distance: data.max_distance || DEFAULT_PREFERENCES.max_distance,
            show_me: (data.show_me as 'men' | 'women' | 'everyone') || DEFAULT_PREFERENCES.show_me,
            location_enabled: data.location_enabled ?? DEFAULT_PREFERENCES.location_enabled
          });
        }
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
      
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...newPreferences
        });

      if (error) {
        console.error('Error updating preferences:', error);
        return false;
      }

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