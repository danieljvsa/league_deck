import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColors, useColors } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColors;
};

const MAX_FONT_SCALE: Record<string, number> = {
  small: 1.3,
  smallBold: 1.3,
  code: 1.2,
  default: 1.5,
  link: 1.3,
  linkPrimary: 1.3,
  title: 1.2,
  subtitle: 1.2,
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const colors = useColors();

  return (
    <Text
      style={[
        { color: colors[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      maxFontSizeMultiplier={MAX_FONT_SCALE[type]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 500,
  },
  title: {
    fontSize: 40,
    fontWeight: 700,
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: 600,
    letterSpacing: -0.3,
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    color: '#3c87f7',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
