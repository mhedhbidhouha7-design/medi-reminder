import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAQ70M1YilJe3sOm8VfpLAj5nS_sKiSUnE",
  authDomain: "medi-reminder-2c715.firebaseapp.com",
  databaseURL:
    "https://medi-reminder-2c715-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "medi-reminder-2c715",
  storageBucket: "medi-reminder-2c715.firebasestorage.app",
  messagingSenderId: "257432894415",
  appId: "1:257432894415:web:506c53f5be604e4457b0ba",
  measurementId: "G-WXBWGQS61B",
};
//Initialise Firebase avec la configuration
export const app = initializeApp(firebaseConfig);

//Initialise authentification+ l'utilisateur reste connecte meme apres fermeture de l'app 
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getDatabase(app);
export const firestoreDb = getFirestore(app);
