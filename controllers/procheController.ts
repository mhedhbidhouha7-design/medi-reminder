import { get, onValue, push, ref, remove, update } from "firebase/database";
import { db } from "../firebaseConfig";
import { Proche } from "../models/interfaces";

/**
 * Listens to "proches" for a specific user.
 * Provides real-time updates for the list.
 */
export const listenToProches = (
  userId: string,
  callback: (proches: Proche[]) => void
) => {
  const prochesRef = ref(db, `users/${userId}/proches`);

  return onValue(
    prochesRef,
    (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const prochesList: Proche[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        } as Proche));
        callback(prochesList);
      } else {
        callback([]);
      }
    },
    (error) => {
      console.error("Error fetching proches from Realtime DB:", error);
      callback([]);
    }
  );
};

/**
 * Fetches all proches for a specific user.
 * Returns a Promise that resolves to an array of Proches.
 */
export const getProches = async (userId: string): Promise<Proche[]> => {
  const prochesRef = ref(db, `users/${userId}/proches`);
  try {
    const snapshot = await get(prochesRef);
    const data = snapshot.val();
    if (data) {
      return Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      } as Proche));
    }
    return [];
  } catch (error) {
    console.error("Error fetching proches:", error);
    return [];
  }
};

/**
 * Adds a new Proche to Realtime Database.
 */
export const addProche = async (
  userId: string,
  data: Omit<Proche, "id">
) => {
  const prochesRef = ref(db, `users/${userId}/proches`);
  await push(prochesRef, {
    ...data,
    createdAt: new Date().toISOString(),
  });
};

/**
 * Updates an existing Proche in Realtime Database.
 */
export const updateProche = async (
  userId: string,
  procheId: string,
  data: Partial<Omit<Proche, "id">>
) => {
  const procheDocRef = ref(db, `users/${userId}/proches/${procheId}`);
  await update(procheDocRef, data);
};

/**
 * Deletes a Proche completely from Realtime Database.
 */
export const deleteProche = async (userId: string, procheId: string) => {
  const procheDocRef = ref(db, `users/${userId}/proches/${procheId}`);
  await remove(procheDocRef);
};
