import { create } from 'zustand';
import { getSettings, setSetting, ThemeMode, AppSettings } from '../core/storage/settings';

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  setAutoRefresh: (enabled: boolean) => Promise<void>;
  setRefreshInterval: (minutes: number) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {
    theme: 'system',
    autoRefresh: true,
    refreshIntervalMinutes: 5,
  },
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const settings = await getSettings();
      set({ settings, isLoading: false });
    } catch (error) {
      if (__DEV__) console.error('Failed to load settings:', error);
      set({ isLoading: false });
    }
  },

  setTheme: async (theme: ThemeMode) => {
    await setSetting('theme', theme);
    set({ settings: { ...get().settings, theme } });
  },

  setAutoRefresh: async (enabled: boolean) => {
    await setSetting('autoRefresh', enabled);
    set({ settings: { ...get().settings, autoRefresh: enabled } });
  },

  setRefreshInterval: async (minutes: number) => {
    await setSetting('refreshIntervalMinutes', minutes);
    set({ settings: { ...get().settings, refreshIntervalMinutes: minutes } });
  },
}));
