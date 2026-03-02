import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

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

const app = initializeApp(firebaseConfig);

// Export the initialized services so other files can use them
export const auth = getAuth(app);
export const db = getDatabase(app);
