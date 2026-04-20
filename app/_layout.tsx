import React, { useEffect, useState } from "react";
import { Modal } from "react-native";
import { Slot } from "expo-router";
import { ThemeProvider } from "../hooks/use-app-theme";
import { MedicationAlertScreen } from "../components/MedicationAlertScreen";

import {
  PendingMedicationAlert,
  subscribeToPendingMedicationAlert,
} from "../services/medicationNotificationHandler";

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
    </ThemeProvider>
  );
}
