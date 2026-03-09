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
  dateOfBirth: string,
  gender: string,
  address: string,
  profileImagePath: string,
): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );
  const userId = userCredential.user.uid;

  let profileImageUrl = "";

  if (profileImagePath) {
    try {
      const formData = new FormData();
      formData.append("source", {
        uri: profileImagePath,
        name: `profile_${userId}.jpg`,
        type: "image/jpeg",
      } as any); // TS workaround pour RN

      const response = await fetch("https://freeimage.host/api/1/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      console.log("Réponse complète freeimage.host :", json); // ← Debug important !

      if (json.status_code === 200 && json.image && json.image.url) {
        profileImageUrl = json.image.url; // URL directe de l'image (ex: http://freeimage.host/images/.../xxx.jpg)
        console.log("Image uploadée avec succès :", profileImageUrl);
      } else {
        throw new Error(
          json.error?.message ||
            json.status_txt ||
            "Échec de l'upload (vérifie la réponse)",
        );
      }
    } catch (error: any) {
      console.error("Erreur upload freeimage.host :", error);
      // Alert.alert(
      // "Info",
      // "La photo n'a pas pu être uploadée (connexion ou serveur ?). Inscription continue sans photo.",
      // );
      // Tu peux aussi throw si tu veux bloquer l'inscription sans photo
    }
  }

  const user: User = {
    id: userId,
    email: userCredential.user.email!,
    name,
    phone,
    dateOfBirth,
    gender,
    address,
    password,
    profileImageUrl,
    createdAt: new Date(),
  };

  // Sauvegarde dans Realtime DB (sans password)
  await set(ref(db, "users/" + userId), {
    name,
    phone,
    createdAt: user.createdAt.toISOString(),
    email: userCredential.user.email!,
    dateOfBirth,
    gender,
    address,
    profileImageUrl,
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
