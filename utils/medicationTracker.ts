import AsyncStorage from "@react-native-async-storage/async-storage";
import { push, ref, update } from "firebase/database";
import { db } from "../models/firebaseConfig";
import { MedicationHistoryEntry } from "../models/interfaces";

/**
 * Record that a medication was taken at a specific time.
 * Stores both locally and in Firebase.
 */
export const recordMedicationTaken = async (
  userId: string,
  medicationId: string,
  medicationName: string,
  scheduleIndex: number,
  dose: string,
  scheduledTime: string,
): Promise<void> => {
  try {
    const takenAt = new Date().toISOString();
    const today = new Date().toISOString().split("T")[0];

    // Local storage key
    const localKey = `med_${medicationId}_${scheduleIndex}_${today}`;
    await AsyncStorage.setItem(
      localKey,
      JSON.stringify({
        medicationId,
        medicationName,
        scheduleIndex,
        dose,
        scheduledTime,
        takenAt,
      }),
    );

    // Firebase history entry
    const historyEntry: Omit<MedicationHistoryEntry, "id"> = {
      userId,
      medicationId,
      medicationName,
      scheduleIndex,
      dose,
      scheduledTime,
      takenAt,
      date: today,
    };

    const historyRef = ref(db, `users/${userId}/medicationHistory`);
    await push(historyRef, historyEntry);

    // Update the takenLogs in the medication document
    const medRef = ref(
      db,
      `users/${userId}/medications/${medicationId}/takenLogs`,
    );
    const takenLogsUpdate = {
      [today]: {
        [scheduleIndex]: { takenAt, status: "taken" },
      },
    };
    try {
      await update(medRef, takenLogsUpdate);
    } catch (error) {
      // If update fails, it might be because the path doesn't exist
      // This is fine, we already recorded it in history
      console.log("Could not update takenLogs:", error);
    }

    console.log(`✅ Medication ${medicationId} recorded as taken`);
  } catch (error) {
    console.error("Error recording medication taken:", error);
    throw error;
  }
};

/**
 * Check if a medication was already taken today at a specific schedule index.
 */
export const isMedicationTakenToday = async (
  medicationId: string,
  scheduleIndex: number,
): Promise<boolean> => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const localKey = `med_${medicationId}_${scheduleIndex}_${today}`;
    const data = await AsyncStorage.getItem(localKey);
    return !!data;
  } catch (error) {
    console.error("Error checking medication status:", error);
    return false;
  }
};

/**
 * Get all medications taken today.
 */
export const getMedicationsTakenToday = async (): Promise<
  { medicationId: string; scheduleIndex: number; takenAt: string }[]
> => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const allKeys = await AsyncStorage.getAllKeys();

    const todayMedKeys = allKeys.filter(
      (key) => key.startsWith("med_") && key.includes(today),
    );

    const results = [];
    for (const key of todayMedKeys) {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        results.push({
          medicationId: parsed.medicationId,
          scheduleIndex: parsed.scheduleIndex,
          takenAt: parsed.takenAt,
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Error getting medications taken today:", error);
    return [];
  }
};

/**
 * Mark a medication as skipped (not taken).
 */
export const recordMedicationSkipped = async (
  userId: string,
  medicationId: string,
  medicationName: string,
  scheduleIndex: number,
  dose: string,
  scheduledTime: string,
  reason?: string,
): Promise<void> => {
  try {
    const skippedAt = new Date().toISOString();
    const today = new Date().toISOString().split("T")[0];

    // Local storage
    const localKey = `med_skipped_${medicationId}_${scheduleIndex}_${today}`;
    await AsyncStorage.setItem(
      localKey,
      JSON.stringify({
        medicationId,
        medicationName,
        scheduleIndex,
        dose,
        scheduledTime,
        skippedAt,
        reason: reason || "User skipped",
      }),
    );

    // Firebase history
    const historyRef = ref(db, `users/${userId}/medicationHistory`);
    await push(historyRef, {
      userId,
      medicationId,
      medicationName,
      scheduleIndex,
      dose,
      scheduledTime,
      takenAt: skippedAt,
      status: "skipped",
      reason: reason || "User skipped",
      date: today,
    });

    console.log(`⏭️ Medication ${medicationId} marked as skipped`);
  } catch (error) {
    console.error("Error recording medication skipped:", error);
    throw error;
  }
};
