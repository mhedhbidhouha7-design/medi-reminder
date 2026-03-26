/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  // Prefer the user-selected app theme from ThemeProvider; fall back to 'light'
  let themeName: keyof typeof Colors = 'light';
  try {
    const appTheme = useAppTheme();
    themeName = appTheme.theme as keyof typeof Colors;
  } catch (e) {
    themeName = 'light';
  }

  // If a component passed explicit light/dark overrides, prefer them for those two modes
  if (themeName === 'dark' || themeName === 'light') {
    const colorFromProps = props[themeName];
    if (colorFromProps) return colorFromProps;
  }

  return Colors[themeName][colorName];
}
