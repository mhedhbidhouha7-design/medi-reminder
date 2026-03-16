import { onValue, push, ref, remove, update } from "firebase/database";
import { db } from "../models/firebaseConfig";
import { DosageSchedule, Medication } from "../models/interfaces";

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

// Fonction pour enregistrer un nouveau médicament dans Firebase avec son planning, sa période, et la date de création
import { scheduleMedicationReminders } from "../services/notificationService";

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
  await scheduleMedicationReminders({
    id: newMedRef.key!,
    name: name.trim(),
    startDate,
    endDate,
    schedules,
    createdAt: new Date().toISOString(),
  });
};

/**
 * Deletes a medication completely and cancels its reminders.
 */
export const deleteMedication = async (userId: string, medId: string) => {
  const medRef = ref(db, `users/${userId}/medications/${medId}`);
  await remove(medRef);
  // Ideally we'd cancel specific notifications here, but for now we'll 
  // rely on a refresh strategy or just let them expire if not implemented yet.
};

//toggleMedicationDose fonction pour marquer une dose comme prise ou non dans Firebase pour un jour précis,
// sans modifier le reste des doses ou des médicaments.

export const toggleMedicationDose = async (
  userId: string,
  medication: Medication,
  scheduleIndex: number,
  dateStr: string,
) => {
  const specificDoseLogRef = ref(
    db,
    `users/${userId}/medications/${medication.id}/takenLogs/${dateStr}/${scheduleIndex}`,
  );

  const logs = medication.takenLogs || {};
  const dateLogs = logs[dateStr] || {};
  const currentStatus = !!dateLogs[scheduleIndex];

  await update(
    ref(
      db,
      `users/${userId}/medications/${medication.id}/takenLogs/${dateStr}`,
    ),
    {
      [scheduleIndex]: !currentStatus,
    },
  );
};
