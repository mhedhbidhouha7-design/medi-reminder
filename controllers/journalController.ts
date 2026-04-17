import { onValue, push, ref } from "firebase/database";
import { db } from "../models/firebaseConfig";
import { HealthJournalEntry } from "../models/interfaces";

/**
 * Cette fonction ajoute une entrée dans le journal de santé de l'utilisateur
 * et renvoie l'ID de cette entrée.
 */
export const addJournalEntry = async (
  userId: string,
  entry: HealthJournalEntry,
) => {
  const journalRef = ref(db, `users/${userId}/journal`);

  // Supprimer les clés avec des valeurs undefined car Firebase RTDB ne les accepte pas
  const cleanEntry = Object.fromEntries(
    Object.entries(entry).filter(([_, v]) => v !== undefined),
  );

  const newEntryRef = await push(journalRef, {
    ...cleanEntry,
    createdAt: new Date().toISOString(),
  });
  return newEntryRef.key;
};

/**
 * Cette fonction permet de récupérer en direct
 * toutes les entrées du journal pour un utilisateur
 * et de mettre à jour l'interface automatiquement lorsqu'une entrée change.
 */
export const listenToJournal = (
  userId: string,
  callback: (entries: HealthJournalEntry[]) => void,
) => {
  const journalRef = ref(db, `users/${userId}/journal`);

  return onValue(
    journalRef,
    (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entriesArray: HealthJournalEntry[] = Object.keys(data).map(
          (key) => ({
            id: key,
            ...data[key],
          }),
        );
        // Trier par date de création (décroissant - plus récent en premier)
        entriesArray.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        callback(entriesArray);
      } else {
        callback([]);
      }
    },
    (error) => {
      console.error("Error fetching journal entries:", error);
      callback([]);
    },
  );
};
