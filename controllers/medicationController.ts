import { onValue, push, ref, remove, update } from "firebase/database";
import { db } from "../models/firebaseConfig";
import { DosageSchedule, Medication } from "../models/interfaces";

/**
 * Listens to medications for a specific user.
 * @param userId The ID of the user
 * @param callback Callback function executed with the array of medications when data changes
 * @returns Unsubscribe function to detach the listener
 */
export const listenToMedications = (
    userId: string,
    callback: (medications: Medication[]) => void
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
        }
    );
};

/**
 * Adds a new medication with complex scheduling.
 */
export const addMedication = async (
    userId: string,
    name: string,
    schedules: DosageSchedule[],
    startDate: string,
    endDate: string
) => {
    const medsRef = ref(db, `users/${userId}/medications`);
    await push(medsRef, {
        name: name.trim(),
        startDate,
        endDate,
        schedules,
        createdAt: new Date().toISOString(),
    });
};

/**
 * Deletes a medication completely.
 */
export const deleteMedication = async (userId: string, medId: string) => {
    const medRef = ref(db, `users/${userId}/medications/${medId}`);
    await remove(medRef);
};

/**
 * Toggles a specific dose within a medication's schedule for a specific date.
 */
export const toggleMedicationDose = async (
    userId: string,
    medication: Medication,
    scheduleIndex: number,
    dateStr: string
) => {
    const specificDoseLogRef = ref(
        db,
        `users/${userId}/medications/${medication.id}/takenLogs/${dateStr}/${scheduleIndex}`
    );

    const logs = medication.takenLogs || {};
    const dateLogs = logs[dateStr] || {};
    const currentStatus = !!dateLogs[scheduleIndex];

    await update(ref(db, `users/${userId}/medications/${medication.id}/takenLogs/${dateStr}`), {
        [scheduleIndex]: !currentStatus,
    });
};
