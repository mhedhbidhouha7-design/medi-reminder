import * as Notifications from "expo-notifications";
import { getAuth } from "firebase/auth";
import { recordMedicationTaken } from "../utils/medicationTracker";
import { speakNotification } from "./audioService";
import { NotificationType } from "./notificationMessages";

export interface PendingMedicationAlert {
  medicationId: string;
  medicationName: string;
  dose: string;
  scheduledTime: string;
  notificationId: string;
  timestamp: number;
  snoozedUntil?: number; // ← timestamp si reporté
}

let pendingMedicationAlert: PendingMedicationAlert | null = null;
let notificationListeners: ((alert: PendingMedicationAlert | null) => void)[] =
  [];

export const subscribeToPendingMedicationAlert = (
  callback: (alert: PendingMedicationAlert | null) => void,
) => {
  notificationListeners.push(callback);
  callback(pendingMedicationAlert);
  return () => {
    notificationListeners = notificationListeners.filter(
      (cb) => cb !== callback,
    );
  };
};

const setPendingMedicationAlert = (alert: PendingMedicationAlert | null) => {
  pendingMedicationAlert = alert;
  notificationListeners.forEach((cb) => cb(alert));
};

export const handleMedicationNotification = async (
  response: Notifications.NotificationResponse,
): Promise<void> => {
  const { notification } = response;
  const data = (notification.request.content.data as Record<string, any>) || {};

  // Lecture vocale pour tous les types
  speakNotification(data?.type as NotificationType, {
    medicationName: data?.medicationName,
    dose: data?.dose,
    appointmentTitle: data?.appointmentTitle || data?.title,
    time: data?.time,
  });

  // Plein écran forcé uniquement pour medication_dose
  if (data?.type === "medication_dose") {
    const alert: PendingMedicationAlert = {
      medicationId: data?.medId || "unknown",
      medicationName: data?.medicationName || "Médicament",
      dose: data?.dose || "dose",
      scheduledTime:
        data?.scheduledTime ||
        new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      notificationId: notification.request.identifier,
      timestamp: Date.now(),
    };
    setPendingMedicationAlert(alert);
  }
};

// Appelé quand l'utilisateur confirme la prise
export const confirmMedicationTaken = async (
  medicationId: string,
  medicationName: string = "Médicament",
  dose: string = "dose",
  scheduleIndex: number = 0,
): Promise<void> => {
  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const scheduledTime = new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    await recordMedicationTaken(
      userId,
      medicationId,
      medicationName,
      scheduleIndex,
      dose,
      scheduledTime,
    );

    setPendingMedicationAlert(null);
  } catch (error) {
    console.error("Error confirming medication taken:", error);
  }
};

// Reporter de N minutes — garde l'alerte active avec un timestamp
export const snoozeMedicationAlert = (minutes: number = 5): void => {
  if (!pendingMedicationAlert) return;
  setPendingMedicationAlert({
    ...pendingMedicationAlert,
    snoozedUntil: Date.now() + minutes * 60 * 1000,
  });
};

export const dismissMedicationAlert = () => setPendingMedicationAlert(null);

export const getPendingMedicationAlert = (): PendingMedicationAlert | null =>
  pendingMedicationAlert;
