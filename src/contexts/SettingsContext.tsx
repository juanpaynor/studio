'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Settings {
  logo_url: string;
  login_logo_url: string;
  logo_alt: string;
  business_name: string;
  tagline?: string;
}

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
  updateSetting: (key: keyof Settings, value: string) => Promise<boolean>;
  updateSettings: (updates: Partial<Settings>) => Promise<boolean>;
  uploadLogo: (file: File) => Promise<string | null>;
}

const defaultSettings: Settings = {
  logo_url: 'https://hmozgkvakanhxddmficm.supabase.co/storage/v1/object/public/Logos/logos.png',
  login_logo_url: 'https://hmozgkvakanhxddmficm.supabase.co/storage/v1/object/public/Logos/ganda.png',
  logo_alt: 'Ms. Cheesy Logo',
  business_name: 'Ms. Cheesy',
  tagline: 'Point of Sale System'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value');

      if (error) {
        console.error('Error fetching settings:', error);
      } else if (data) {
        const settingsMap: Partial<Settings> = {};
        data.forEach(item => {
          settingsMap[item.key as keyof Settings] = item.value;
        });
        
        setSettings(prev => ({ ...prev, ...settingsMap }));
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof Settings, value: string): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('update_setting', {
        setting_key: key,
        setting_value: value
      });

      if (error) {
        console.error('Error updating setting:', error);
        return false;
      }

      setSettings(prev => ({ ...prev, [key]: value }));
      return true;
    } catch (error) {
      console.error('Error in updateSetting:', error);
      return false;
    }
  };

  const updateSettings = async (updates: Partial<Settings>): Promise<boolean> => {
    try {
      // Update multiple settings
      const promises = Object.entries(updates).map(([key, value]) =>
        supabase.rpc('update_setting', {
          setting_key: key,
          setting_value: value
        })
      );

      const results = await Promise.all(promises);
      const hasError = results.some(result => result.error);

      if (hasError) {
        console.error('Error updating some settings');
        return false;
      }

      setSettings(prev => ({ ...prev, ...updates }));
      return true;
    } catch (error) {
      console.error('Error in updateSettings:', error);
      return false;
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading logo:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // Update the logo_url setting
      const success = await updateSetting('logo_url', data.publicUrl);
      
      return success ? data.publicUrl : null;
    } catch (error) {
      console.error('Error in uploadLogo:', error);
      return null;
    }
  };

  const value = {
    settings,
    loading,
    updateSetting,
    updateSettings,
    uploadLogo,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}