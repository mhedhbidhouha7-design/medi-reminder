import { firestoreDb } from "@/firebaseConfig";
import { HealthJournalEntry } from "@/models/interfaces";
import {
    addDoc,
    collection,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";

/**
 //Cette fonction ajoute une entrée dans le journal de santé de l’utilisateur 
 // et renvoie l’ID de cette entrée.
 */
export const addJournalEntry = async (
  userId: string,
  entry: HealthJournalEntry,
) => {
  const docRef = await addDoc(collection(firestoreDb, "journal"), {
    ...entry,
    userId,
  });
  return docRef.id;
};

//Cette fonction permet de récupérer en direct
//toutes les entrées du journal pour un utilisateur
//et de mettre à jour l’interface automatiquement lorsqu’une entrée change.
export const listenToJournal = (
  userId: string,
  callback: (entries: HealthJournalEntry[]) => void,
) => {
  const q = query(
    collection(firestoreDb, "journal"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as HealthJournalEntry,
    );
    callback(data);
  });
};
