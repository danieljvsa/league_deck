import { Platform, useColorScheme } from 'react-native';

export interface ThemeColorSet {
  text: string;
  textSecondary: string;
  textMuted: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderLight: string;
  primary: string;
  primaryLight: string;
  danger: string;
  dangerLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  live: string;
  liveLight: string;
  info: string;
  infoLight: string;
  muted: string;
  disabled: string;
  shadow: string;
}

export const Colors = {
  light: {
    text: '#1C1C1E',
    textSecondary: '#636366',
    textMuted: '#8E8E93',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: '#D1D1D6',
    borderLight: '#E5E5EA',
    primary: '#007AFF',
    primaryLight: '#E8F4FD',
    danger: '#FF3B30',
    dangerLight: '#FFE5E5',
    success: '#34C759',
    successLight: '#E8F8ED',
    warning: '#FF9500',
    warningLight: '#FFF3E0',
    live: '#FF3B30',
    liveLight: '#FFE5E5',
    info: '#007AFF',
    infoLight: '#E8F4FD',
    muted: '#F2F2F7',
    disabled: '#C7C7CC',
    shadow: '#000000',
  },
  dark: {
    text: '#F5F5F7',
    textSecondary: '#AEAEB2',
    textMuted: '#636366',
    background: '#000000',
    surface: '#1C1C1E',
    surfaceElevated: '#2C2C2E',
    border: '#38383A',
    borderLight: '#48484A',
    primary: '#0A84FF',
    primaryLight: '#0A84FF20',
    danger: '#FF453A',
    dangerLight: '#FF453A20',
    success: '#30D158',
    successLight: '#30D15820',
    warning: '#FF9F0A',
    warningLight: '#FF9F0A20',
    live: '#FF453A',
    liveLight: '#FF453A20',
    info: '#0A84FF',
    infoLight: '#0A84FF20',
    muted: '#2C2C2E',
    disabled: '#48484A',
    shadow: '#000000',
  },
};

export type ThemeColors = keyof ThemeColorSet;

export function useColors(): ThemeColorSet {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? Colors.dark : Colors.light;
}

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
