import { Slot } from "expo-router";
import { useEffect } from "react";
import { requestNotificationPermissions } from "../services/notificationService";

export default function RootLayout() {
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  return <Slot />;
}
