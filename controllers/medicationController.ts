import { onValue, push, ref, remove, update } from "firebase/database";
import { db } from "../models/firebaseConfig";
import { DosageSchedule, Medication, MedicationHistoryEntry } from "../models/interfaces";
import { scheduleMedicationReminders } from "../services/notificationService";

/**
 * Listens to medications for a specific user.
 * @param userId The ID of the user 
 * @param callback Callback function executed with the array of medications when data changes
 * @returns Unsubscribe function to detach the listener
 */
// Écoute en temps réel tous les médicaments d’un utilisateur
// Appelle le callback avec la liste mise à jour chaque fois que les données changent
export const listenToMedications = (
  userId: string,
  callback: (medications: Medication[]) => void,
) => {
  const medsRef = ref(db, `users/${userId}/medications`);

  return onValue(
    medsRef,
    (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const medsArray: Medication[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        callback(medsArray);
      } else {
        callback([]);
      }
    },
    (error) => {
      console.error("Error fetching medications:", error);
      callback([]);
    },
  );
};



export const addMedication = async (
  userId: string,
  name: string,
  schedules: DosageSchedule[],
  startDate: string,
  endDate: string,
) => {
  const medsRef = ref(db, `users/${userId}/medications`);
  const newMedRef = await push(medsRef, {
    name: name.trim(),
    startDate,
    endDate,
    schedules,
    createdAt: new Date().toISOString(),
  });

  // Schedule notifications for the new medication
  await scheduleMedicationReminders(userId, {
    id: newMedRef.key!,
    name: name.trim(),
    startDate,
    endDate,
    schedules,
    createdAt: new Date().toISOString(),
  });
};

/**
 * Updates an existing medication and reschedules its notifications.
 */
export const updateMedication = async (
  userId: string,
  medId: string,
  name: string,
  schedules: DosageSchedule[],
  startDate: string,
  endDate: string,
) => {
  const medRef = ref(db, `users/${userId}/medications/${medId}`);
  await update(medRef, {
    name: name.trim(),
    startDate,
    endDate,
    schedules,
    updatedAt: new Date().toISOString(),
  });

  // Reschedule notifications
  await scheduleMedicationReminders(userId, {
    id: medId,
    name: name.trim(),
    startDate,
    endDate,
    schedules,
    createdAt: new Date().toISOString(), // Use current as a reference for rescheduling
  });
};

/**
 * Deletes a medication completely and cancels its reminders.
 */
export const deleteMedication = async (userId: string, medId: string) => {
  const medRef = ref(db, `users/${userId}/medications/${medId}`);
  await remove(medRef);
};

/**
 * Marque une dose comme prise, met à jour les logs internes et ajoute une entrée dans l'historique.
 */
export const toggleMedicationDose = async (
  userId: string,
  medication: Medication,
  scheduleIndex: number,
  dateStr: string,
) => {
  const historyRef = ref(db, `users/${userId}/medicationHistory`);
  const logs = medication.takenLogs || {};
  const dateLogs = logs[dateStr] || {};
  const isCurrentlyTaken = !!dateLogs[scheduleIndex];

  try {
    if (!isCurrentlyTaken) {
      const takenAt = new Date().toISOString();

      // 1. Mise à jour des logs internes pour le filtrage en temps réel
      await update(ref(db, `users/${userId}/medications/${medication.id}/takenLogs/${dateStr}`), {
        [scheduleIndex]: takenAt,
      });

      // 2. Ajout à l'historique global
      const historyEntry: Omit<MedicationHistoryEntry, 'id'> = {
        userId,
        medicationId: medication.id,
        medicationName: medication.name,
        scheduleIndex,
        dose: medication.schedules[scheduleIndex].dose,
        scheduledTime: medication.schedules[scheduleIndex].time,
        takenAt,
        date: dateStr,
      };
      await push(historyRef, historyEntry);
      console.log(`✅ Dose de ${medication.name} (${medication.schedules[scheduleIndex].dose}) ajoutée à l'historique.`);
    } else {
      // Décocher la dose
      await update(ref(db, `users/${userId}/medications/${medication.id}/takenLogs/${dateStr}`), {
        [scheduleIndex]: null,
      });
      console.log(`ℹ️ Dose de ${medication.name} décochée.`);
    }
  } catch (error) {
    console.error("Erreur lors du toggle de la dose:", error);
    throw error;
  }
};

/**
 * Listens to medication intake history for a specific user.
 */
export const listenToMedicationHistory = (
  userId: string,
  callback: (history: MedicationHistoryEntry[]) => void,
) => {
  const historyRef = ref(db, `users/${userId}/medicationHistory`);

  return onValue(historyRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const historyArray: MedicationHistoryEntry[] = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
      // Trier par date de prise (décroissant)
      historyArray.sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());
      callback(historyArray);
    } else {
      callback([]);
    }
  });
};
