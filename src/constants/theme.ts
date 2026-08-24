import { Platform, useColorScheme } from 'react-native';

export interface ThemeColorSet {
  text: string;
  textSecondary: string;
  textMuted: string;
  textTertiary: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderLight: string;
  borderFocus: string;
  primary: string;
  primaryLight: string;
  primaryHover: string;
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
  overlay: string;
  skeleton: string;
  accent: string;
  accentLight: string;
  cardBorder: string;
  cardHighlight: string;
  championsLeague: string;
  europaLeague: string;
  conferenceLeague: string;
}

export const Colors = {
  light: {
    text: '#1A1528',
    textSecondary: '#5C5470',
    textMuted: '#706A8A',
    textTertiary: '#B0A8C4',
    background: '#F8F7FC',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: '#DDD8EC',
    borderLight: '#EDEBF4',
    borderFocus: '#7C3AED',
    primary: '#7C3AED',
    primaryLight: '#7C3AED12',
    primaryHover: '#6D28D9',
    danger: '#DC2626',
    dangerLight: '#DC262612',
    success: '#16A34A',
    successLight: '#16A34A12',
    warning: '#D97706',
    warningLight: '#D9770612',
    live: '#16A34A',
    liveLight: '#16A34A12',
    info: '#2563EB',
    infoLight: '#2563EB12',
    muted: '#F0EDF6',
    disabled: '#C4BFD4',
    shadow: '#1A1528',
    overlay: '#1A152840',
    skeleton: '#E2DFF0',
    accent: '#7C3AED',
    accentLight: '#7C3AED12',
    cardBorder: '#DDD8EC',
    cardHighlight: '#F0ECF8',
    championsLeague: '#7C3AED',
    europaLeague: '#D97706',
    conferenceLeague: '#16A34A',
  },
  dark: {
    text: '#F5F3FF',
    textSecondary: '#B0A8C4',
    textMuted: '#8780A0',
    textTertiary: '#5C5470',
    background: '#0D0B1A',
    surface: '#16132A',
    surfaceElevated: '#1E1A33',
    border: '#2D2847',
    borderLight: '#231F38',
    borderFocus: '#A78BFA',
    primary: '#A78BFA',
    primaryLight: '#A78BFA18',
    primaryHover: '#C4B5FD',
    danger: '#F87171',
    dangerLight: '#F8717118',
    success: '#4ADE80',
    successLight: '#4ADE8018',
    warning: '#FBBF24',
    warningLight: '#FBBF2418',
    live: '#4ADE80',
    liveLight: '#4ADE8018',
    info: '#60A5FA',
    infoLight: '#60A5FA18',
    muted: '#12101F',
    disabled: '#3D3855',
    shadow: '#000000',
    overlay: '#00000060',
    skeleton: '#231F38',
    accent: '#A78BFA',
    accentLight: '#A78BFA18',
    cardBorder: '#2D2847',
    cardHighlight: '#1E1A33',
    championsLeague: '#A78BFA',
    europaLeague: '#FBBF24',
    conferenceLeague: '#4ADE80',
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
