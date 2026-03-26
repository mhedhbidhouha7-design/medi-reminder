import { Colors } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { StatusBar, Text, useColorScheme, View } from 'react-native';
import { ThemeType } from '../constants/theme';

type ThemeContextType = {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>((systemColorScheme as ThemeType) || 'light');

  useEffect(() => {
    // Load saved theme from storage
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('user-theme');
      if (savedTheme) {
        setThemeState(savedTheme as ThemeType);
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    await AsyncStorage.getItem('user-theme');
    await AsyncStorage.setItem('user-theme', newTheme);
  };

  const isDark = theme === 'dark';

  // Apply global default styles for core components so screens that use
  // plain <Text> and <View> pick up the selected theme automatically.
  useEffect(() => {
    try {
      const themeColors = Colors[theme];

      // Set default text color
      // Note: defaultProps exists on core components in React Native
      (Text as any).defaultProps = {
        ...(Text as any).defaultProps || {},
        style: [{ color: themeColors.text }, ...(((Text as any).defaultProps || {}).style || [])],
      };

      // Set default view background for empty containers
      (View as any).defaultProps = {
        ...(View as any).defaultProps || {},
        style: [{ backgroundColor: themeColors.background }, ...(((View as any).defaultProps || {}).style || [])],
      };

      // Update StatusBar style
      StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
    } catch (e) {
      // ignore if defaultProps manipulation is unsupported in environment
    }
  }, [theme, isDark]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
