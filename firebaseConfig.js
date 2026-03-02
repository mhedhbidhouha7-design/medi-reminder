// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
