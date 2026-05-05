import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../constants/theme";
import { auth } from "../firebaseConfig";
import { useAppTheme } from "../hooks/use-app-theme";

/**
 * Page affichée lorsque le compte d'un utilisateur est désactivé.
 * Elle bloque l'accès à l'application et force la déconnexion.
 */
export default function DisabledAccountScreen() {
  // --- Hooks pour la traduction, la navigation et le thème ---
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useAppTheme();
  const themeColors = Colors[theme];

  // --- Variables pour les animations (opacité et mouvement) ---
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // --- Lancement des animations au chargement de la page ---
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // --- Fonction pour déconnecter l'utilisateur et le renvoyer au Login ---
  const handleLogout = async () => {
    try {
      await signOut(auth); // Déconnexion de Firebase
      router.replace("/signin"); // Redirection vers la page de connexion
    } catch (error) {
      console.error("Error signing out:", error);
      router.replace("/signin");
    }
  };

  return (
    // Fond avec un dégradé de couleur
    <LinearGradient
      colors={[themeColors.background, themeColors.card]}
      style={styles.container}
    >
      {/* Conteneur principal animé */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            backgroundColor: themeColors.card,
          },
        ]}
      >
        {/* Section Icône (Cadenas avec les couleurs d'accentuation du thème) */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[themeColors.notification.pulse, themeColors.notification.accent]}
            style={styles.iconGradient}
          >
            <Ionicons name="lock-closed" size={64} color="#FFF" />
          </LinearGradient>
        </View>

        {/* Titre et Message de désactivation avec les couleurs du thème */}
        <Text style={[styles.title, { color: themeColors.text }]}>{t("auth.disabled.title", "Compte Désactivé")}</Text>
        <Text style={[styles.description, { color: themeColors.text, opacity: 0.7 }]}>
          {t(
            "auth.disabled.description",
            "Votre compte a été désactivé. Vous allez être redirigé vers la page de connexion."
          )}
        </Text>

        {/* Bouton pour se déconnecter (utilise la couleur primaire ou accentuée) */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: themeColors.notification.accent }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{t("profile.logout", "Se déconnecter")}</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

// --- Styles CSS pour l'apparence de la page ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    borderRadius: 32,
    padding: 40,
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
