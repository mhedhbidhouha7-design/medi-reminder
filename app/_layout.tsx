import "../services/i18n";
import React, { useEffect, useState } from "react";
import { Modal, LogBox } from "react-native";
import { Slot } from "expo-router";
import { ThemeProvider } from "../hooks/use-app-theme";
import { AlertProvider } from "../components/ThemedAlert";
import { MedicationAlertScreen } from "../components/MedicationAlertScreen";

import {
  PendingMedicationAlert,
  subscribeToPendingMedicationAlert,
} from "../services/medicationNotificationHandler";

// Suppress expo-notifications warnings (yellow box)
LogBox.ignoreLogs([
  "expo-notifications",
  "Android Push notifications",
]);

// Suppress expo-notifications errors (red box) in Expo Go
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const msg = typeof args[0] === "string" ? args[0] : "";
  if (msg.includes("expo-notifications") || msg.includes("Android Push notifications")) {
    return; // silently ignore
  }
  originalConsoleError(...args);
};

export default function App() {
  const [medicationAlert, setMedicationAlert] =
    useState<PendingMedicationAlert | null>(null);

  useEffect(() => {
    // Écoute en permanence — dès qu'une alerte arrive, le Modal s'ouvre
    const unsubscribe = subscribeToPendingMedicationAlert((alert) => {
      // Si l'alerte est reportée, on attend le délai avant de ré-afficher
      if (alert?.snoozedUntil && alert.snoozedUntil > Date.now()) {
        const delay = alert.snoozedUntil - Date.now();
        setTimeout(() => setMedicationAlert(alert), delay);
        setMedicationAlert(null); // cache pendant le snooze
      } else {
        setMedicationAlert(alert);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <ThemeProvider>
      <AlertProvider>
        {/* Slot renders the matched child route (index, auth, app, etc.) */}
        <Slot />

        {/* Modal plein écran — s'affiche par-dessus tout, non fermable */}
        <Modal
          visible={!!medicationAlert}
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => {}} // bloque la fermeture native Android
        >
          {medicationAlert && <MedicationAlertScreen alert={medicationAlert} />}
        </Modal>
      </AlertProvider>
    </ThemeProvider>
  );
}
