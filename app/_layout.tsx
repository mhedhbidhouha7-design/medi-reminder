import { Slot } from "expo-router";
import { useEffect } from "react";
import { LogBox } from "react-native";
import { ThemeProvider } from "../hooks/use-app-theme";
import { requestNotificationPermissions } from "../services/notificationService";

export default function RootLayout() {
  useEffect(() => {
    // Suppress the Expo SDK 53 Push Notification warning for Expo Go
    LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);
    
    requestNotificationPermissions();
  }, []);

  return (
    <ThemeProvider>
      <Slot />
    </ThemeProvider>
  );
}
