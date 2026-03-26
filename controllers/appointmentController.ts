import { onValue, push, ref, remove, update } from "firebase/database";
import { db } from "../models/firebaseConfig";
import { Appointment } from "../models/interfaces";

import { AppointmentHistoryEntry } from "../models/interfaces";
import { scheduleAppointmentReminders } from "../services/notificationService";

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
    (snapshot) => {//snapshot = etat de donnnee actuel a cet instant 
      const data = snapshot.val();//tout les rdvs (donneez reelles sous forme d'objet )
      if (data) {//si base contient des rdvs 
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

export const addAppointment = async (
  userId: string,
  data: Omit<Appointment, "id">,
) => {
  const apptRef = ref(db, `users/${userId}/appointments`);
  const status = data.done ? "done" : "planned";
  const apptData = {
    ...data,
    done: data.done ?? false,
    status: data.status || status,
  };

  const newApptRef = await push(apptRef, {
    ...apptData,
    createdAt: new Date().toISOString(),
  });

  await scheduleAppointmentReminders(userId, {
    id: newApptRef.key!,
    ...apptData,
  } as Appointment);
};

export const updateAppointmentInsteadOfCreating = async (
  userId: string,
  apptId: string,
  data: Partial<Appointment>
) => {
  const specificApptRef = ref(db, `users/${userId}/appointments/${apptId}`);
  await update(specificApptRef, data);

  await scheduleAppointmentReminders(userId, {
    id: apptId,
    ...data,
  } as Appointment);
};

/**
 * Supprime un rendez-vous complètement et annule ses rappels.
 */
export const deleteAppointment = async (userId: string, apptId: string) => {
  const apptRef = ref(db, `users/${userId}/appointments/${apptId}`);
  await remove(apptRef);
};

/**
 * Marque un rendez-vous comme terminé, le déplace vers l'historique et le supprime de la liste active.
 */
export const completeAppointment = async (
  userId: string,
  appointment: Appointment,
) => {
  const apptRef = ref(db, `users/${userId}/appointments/${appointment.id}`);
  const historyRef = ref(db, `users/${userId}/appointmentHistory`);

  const historyEntry: AppointmentHistoryEntry = {
    ...appointment,
    done: true,
    completedAt: new Date().toISOString(),
  };

  try {
    // 1. Ajouter à l'historique
    await push(historyRef, historyEntry);
    // 2. Supprimer de la liste active
    await remove(apptRef);
    console.log(`✅ Rendez-vous "${appointment.title}" déplacé vers l'historique.`);
  } catch (error) {
    console.error("Erreur lors de la complétion du rendez-vous:", error);
    throw error;
  }
};

/**
 * Listens to completed appointments history for a specific user.
 */
export const listenToAppointmentHistory = (
  userId: string,
  callback: (appointments: AppointmentHistoryEntry[]) => void,
) => {
  const historyRef = ref(db, `users/${userId}/appointmentHistory`);

  return onValue(historyRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const historyArray: AppointmentHistoryEntry[] = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
      // Trier par date de complétion (décroissant)
      historyArray.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
      callback(historyArray);
    } else {
      callback([]);
    }
  });
};
