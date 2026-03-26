/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export type ThemeType = 'light' | 'dark' | 'emerald' | 'royal';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    card: '#f8fafc',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    primary: '#0a7ea4',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    card: '#0f172a',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: '#0a7ea4',
  },
  emerald: {
    text: '#064e3b',
    background: '#ecfdf5',
    card: '#d1fae5',
    tint: '#059669',
    icon: '#059669',
    tabIconDefault: '#059669',
    tabIconSelected: '#064e3b',
    primary: '#10b981',
  },
  royal: {
    text: '#1e3a8a',
    background: '#eff6ff',
    card: '#dbeafe',
    tint: '#2563eb',
    icon: '#2563eb',
    tabIconDefault: '#2563eb',
    tabIconSelected: '#1e3a8a',
    primary: '#3b82f6',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
