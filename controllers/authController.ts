// controllers/authController.ts
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, db } from "../models/firebaseConfig";
import { User } from "../models/interfaces";
//créer un nouvel utilisateur à la fois
// dans Authentication et dans la base de données
export const signUpUser = async (
  email: string,
  password: string,
  name: string,
  phone: string,
  dateOfBirth: string,
  gender: string,
  address: string,
  profileImageUrl: string,
): Promise<User> => {
  //renvoi un objet de type User 
  // mais uniquement une fois que l’opération asynchrone sera terminée
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );
  const userId = userCredential.user.uid;

  // Remove the freeimage.host upload - URL is already from Cloudinary!
  console.log("Using Cloudinary URL:", profileImageUrl);

  const user: User = {
    id: userId,
    email: userCredential.user.email!,
    name,
    phone,
    dateOfBirth,
    gender,
    address,
    password,
    profileImageUrl, // Use directly - no upload needed!
    createdAt: new Date(),
    active: true,

  };

  //stocke les infos essentielles du profil dans la base de données Firebase sous le "users/userId"
  await set(ref(db, "users/" + userId), {
    name,
    phone,
    createdAt: user.createdAt.toISOString(),
    email: userCredential.user.email!,
    dateOfBirth,
    gender,
    address,
    profileImageUrl, // This will now have the Cloudinary URL!
    active: true,
    role: "patient"
  });

  return user;
};

export const signInUser = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email.trim(), password);
};

export const resetPassword = async (email: string) => {
  console.log("resetPassword called for email:", email);
  if (!auth) {
    console.error("Auth is not initialized!");
    throw new Error("Auth system not ready");
  }
  try {
    const result = await sendPasswordResetEmail(auth, email.trim());
    console.log("sendPasswordResetEmail success");
    return result;
  } catch (error) {
    console.error("sendPasswordResetEmail error:", error);
    throw error;
  }
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
