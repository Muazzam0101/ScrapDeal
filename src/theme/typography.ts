import { TextStyle, Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: 'System',
});

export const typography: Record<string, TextStyle> = {
  // Headings
  h1: {
    fontFamily,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  h4: {
    fontFamily,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },

  // Body
  bodyLarge: {
    fontFamily,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },

  // Subtitles & Captions
  subtitle: {
    fontFamily,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  caption: {
    fontFamily,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Buttons & Badges
  button: {
    fontFamily,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  buttonSmall: {
    fontFamily,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
  },
  badge: {
    fontFamily,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },

  // Big Display (Prices / Weights / Large numerals for low-literacy clarity)
  displayLarge: {
    fontFamily,
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 42,
  },
  displayMedium: {
    fontFamily,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
};
