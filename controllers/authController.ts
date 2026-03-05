// controllers/authController.ts
import {
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, db } from "../models/firebaseConfig";
import { User } from "../models/interfaces";

export const signUpUser = async (
  email: string,
  password: string,
  name: string,
  phone: string,
): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );
  const user: User = {
    id: userCredential.user.uid,
    email: userCredential.user.email!,
    name,
    phone,
    createdAt: new Date(),
  };
  // Save additional user data to Realtime Database
  await set(ref(db, "users/" + user.id), {
    name,
    phone,
    createdAt: user.createdAt.toISOString(),
  });
  return user;
};

export const signInUser = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email.trim(), password);
};

export const resetPassword = async (email: string) => {
  return await sendPasswordResetEmail(auth, email.trim());
};

export const logoutUser = async () => {
  console.log("logoutUser function called");
  try {
    await auth.signOut();
    console.log("Firebase signOut completed successfully");
  } catch (error) {
    console.error("Error during logout:", error);
    throw error;
  }
};
