import { onValue, push, ref, remove, update } from "firebase/database";
import { db } from "../models/firebaseConfig";
import { Appointment } from "../models/interfaces";

/**
 * Listens to appointments for a specific user.
 * @param userId The ID of the user
 * @param callback Callback function executed with the array of appointments when data changes
 * @returns Unsubscribe function to detach the listener
 */
export const listenToAppointments = (
  userId: string,
  callback: (appointments: Appointment[]) => void,
) => {
  const apptRef = ref(db, `users/${userId}/appointments`);

  return onValue(
    apptRef,
    (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const apptArray: Appointment[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        // Trier par date puis heure
        apptArray.sort((a, b) => {
          const da = new Date(`${a.date}T${a.time}`);
          const db = new Date(`${b.date}T${b.time}`);
          return da.getTime() - db.getTime();
        });
        callback(apptArray);
      } else {
        callback([]);
      }
    },
    (error) => {
      console.error("Error fetching appointments:", error);
      callback([]);
    },
  );
};

/**
 * Ajoute un nouveau rendez-vous dans Firebase et planifie les notifications.
 */
import { scheduleAppointmentReminders } from "../services/notificationService";

export const addAppointment = async (
  userId: string,
  data: Omit<Appointment, "id">,
) => {
  const apptRef = ref(db, `users/${userId}/appointments`);
  const newApptRef = await push(apptRef, {
    ...data,
    createdAt: new Date().toISOString(),
  });

  // Schedule notifications for the new appointment
  await scheduleAppointmentReminders({
    id: newApptRef.key!,
    ...data,
  });
};

/**
 * Supprime un rendez-vous complètement et annule ses rappels.
 */
export const deleteAppointment = async (userId: string, apptId: string) => {
  const apptRef = ref(db, `users/${userId}/appointments/${apptId}`);
  await remove(apptRef);
};

/**
 * Bascule le statut done d'un rendez-vous (effectué / non effectué).
 */
export const toggleAppointmentDone = async (
  userId: string,
  appointment: Appointment,
) => {
  const apptRef = ref(db, `users/${userId}/appointments/${appointment.id}`);
  await update(apptRef, {
    done: !appointment.done,
  });
};
