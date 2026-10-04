import { Dimensions, Platform, useWindowDimensions } from 'react-native';

const { width: INITIAL_WIDTH, height: INITIAL_HEIGHT } = Dimensions.get('window');

// Standard mobile baseline dimensions (iPhone X / Pixel 3 baseline: 375 x 812)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

export const isSmallDevice = INITIAL_WIDTH < 375;
export const isMediumDevice = INITIAL_WIDTH >= 375 && INITIAL_WIDTH < 430;
export const isLargeDevice = INITIAL_WIDTH >= 430 && INITIAL_WIDTH < 768;
export const isTabletOrWeb = INITIAL_WIDTH >= 768;

/**
 * Convert width percentage to DP
 */
export const wp = (percentage: number): number => {
  const { width } = Dimensions.get('window');
  return Math.round((percentage * width) / 100);
};

/**
 * Convert height percentage to DP
 */
export const hp = (percentage: number): number => {
  const { height } = Dimensions.get('window');
  return Math.round((percentage * height) / 100);
};

/**
 * Scale size proportionally based on screen width
 */
export const scale = (size: number): number => {
  const { width } = Dimensions.get('window');
  return Math.round((width / guidelineBaseWidth) * size);
};

/**
 * Scale size proportionally based on screen height
 */
export const verticalScale = (size: number): number => {
  const { height } = Dimensions.get('window');
  return Math.round((height / guidelineBaseHeight) * size);
};

/**
 * Moderate scale with dampening factor (default 0.5)
 * Prevents elements from blowing up too large on big screens or shrinking too small on small screens
 */
export const moderateScale = (size: number, factor = 0.5): number => {
  return Math.round(size + (scale(size) - size) * factor);
};

/**
 * Responsive Font Size with accessibility clamp
 */
export const rf = (size: number): number => {
  const { width } = Dimensions.get('window');
  const scaleFactor = width / guidelineBaseWidth;
  const newSize = size * (1 + (scaleFactor - 1) * 0.4);

  if (width < 360) {
    return Math.max(Math.round(size * 0.88), Math.round(newSize));
  }
  if (width >= 768) {
    return Math.min(Math.round(size * 1.2), Math.round(newSize));
  }
  return Math.round(newSize);
};

/**
 * Max container width for tablets & web to keep mobile UI beautiful, centered and readable
 */
export const MAX_CONTAINER_WIDTH = 540;

/**
 * Safe bottom padding for scrollable views inside Bottom Tab Navigators
 * Bottom tab bar is ~56-60dp + insets (typically 80-90dp total).
 * 110dp ensures the last card/button is completely visible with room to spare!
 */
export const TAB_BAR_BOTTOM_PADDING = 110;

/**
 * Pre-defined container style for tablet & web responsive centering
 */
export const responsiveContainer = {
  width: '100%' as const,
  maxWidth: MAX_CONTAINER_WIDTH,
  alignSelf: 'center' as const,
};

/**
 * Reactive responsive hook that responds dynamically to screen orientation, split-screen, and web resizing
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isSmall = width < 375;
  const isMedium = width >= 375 && width < 430;
  const isLarge = width >= 430 && width < 768;
  const isTablet = width >= 768;
  const isLandscape = width > height;

  const contentMaxWidth = Math.min(width, MAX_CONTAINER_WIDTH);
  const horizontalPadding = isSmall ? 12 : isTablet ? 24 : 16;

  return {
    width,
    height,
    isSmall,
    isMedium,
    isLarge,
    isTablet,
    isLandscape,
    contentMaxWidth,
    horizontalPadding,
    tabBarBottomPadding: TAB_BAR_BOTTOM_PADDING,
    scale: (s: number) => Math.round((width / guidelineBaseWidth) * s),
    verticalScale: (s: number) => Math.round((height / guidelineBaseHeight) * s),
    moderateScale: (s: number, factor = 0.5) => Math.round(s + (Math.round((width / guidelineBaseWidth) * s) - s) * factor),
    rf: (s: number) => {
      const scaleFactor = width / guidelineBaseWidth;
      const newSize = s * (1 + (scaleFactor - 1) * 0.4);
      if (width < 360) return Math.max(Math.round(s * 0.88), Math.round(newSize));
      if (width >= 768) return Math.min(Math.round(s * 1.2), Math.round(newSize));
      return Math.round(newSize);
    },
  };
}
