import * as Notifications from "expo-notifications";
import { getAuth } from "firebase/auth";
import { recordMedicationTaken } from "../utils/medicationTracker";

export interface PendingMedicationAlert {
  medicationId: string;
  medicationName: string;
  dose: string;
  scheduledTime: string;
  notificationId: string;
  timestamp: number;
}

// Global state for pending medication alerts (on-time notifications)
let pendingMedicationAlert: PendingMedicationAlert | null = null;
let notificationListeners: ((alert: PendingMedicationAlert | null) => void)[] =
  [];

//Écoute les changements d’état des alertes
export const subscribeToPendingMedicationAlert = (
  callback: (alert: PendingMedicationAlert | null) => void,
) => {
  notificationListeners.push(callback);

  // Send current alert immediately if exists
  callback(pendingMedicationAlert);

  // Return unsubscribe function
  return () => {
    notificationListeners = notificationListeners.filter(
      (cb) => cb !== callback,
    );
  };
};

/**
 * Set the current pending medication alert and notify all listeners.
 */
const setPendingMedicationAlert = (alert: PendingMedicationAlert | null) => {
  pendingMedicationAlert = alert;
  notificationListeners.forEach((callback) => {
    callback(alert);
  });
};

/**
 * Handle foreground notifications from Expo.
 * Separates pre-reminders from on-time medication notifications.
 */
export const handleMedicationNotification = async (
  response: Notifications.NotificationResponse,
): Promise<void> => {
  const { notification } = response;
  const data = (notification.request.content.data as Record<string, any>) || {};

  // Check if this is a medication dose (on-time) notification
  if (data?.type === "medication_dose") {
    const medicationId = data?.medId || "unknown";
    const medicationName = data?.medicationName || "Médicament";
    const dose = data?.dose || "dose";
    const scheduledTime =
      data?.scheduledTime || new Date().toLocaleTimeString();

    const alert: PendingMedicationAlert = {
      medicationId,
      medicationName,
      dose,
      scheduledTime,
      notificationId: notification.request.identifier,
      timestamp: Date.now(),
    };

    // Set as pending and show full-screen overlay
    setPendingMedicationAlert(alert);
  }

  // Pre-reminders (30min, 15min) are handled as normal notifications
  // and don't trigger the full-screen overlay
};

/**
 * Mark medication as taken and dismiss the full-screen overlay.
 */
export const confirmMedicationTaken = async (
  medicationId: string,
  medicationName: string = "Médicament",
  dose: string = "dose",
  scheduleIndex: number = 0,
): Promise<void> => {
  try {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;

    if (!userId) {
      console.error("No user logged in");
      return;
    }

    const scheduledTime = new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Record in Firebase and local storage
    await recordMedicationTaken(
      userId,
      medicationId,
      medicationName,
      scheduleIndex,
      dose,
      scheduledTime,
    );

    // Clear the pending alert
    setPendingMedicationAlert(null);

    console.log(`✅ Medication ${medicationId} marked as taken`);
  } catch (error) {
    console.error("Error confirming medication taken:", error);
  }
};

/**
 * Dismiss the full-screen notification without marking as taken.
 * (This should trigger an alert or require some action)
 */
export const dismissMedicationAlert = () => {
  setPendingMedicationAlert(null);
};

/**
 * Get the current pending medication alert.
 */
export const getPendingMedicationAlert = (): PendingMedicationAlert | null => {
  return pendingMedicationAlert;
};
