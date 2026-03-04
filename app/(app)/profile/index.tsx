// app/(app)/profile/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { signOut } from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../../firebaseConfig"; // adjust path

export default function ProfileScreen() {
  console.log("Rendering ProfileScreen");
  const { colors } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      {
        text: "Annuler",
        style: "cancel",
      },
      {
        text: "Se déconnecter",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try {
            await signOut(auth);
          } catch (error) {
            Alert.alert("Erreur", "Impossible de se déconnecter");
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Profil</Text>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.label, { color: colors.text + "80" }]}>Nom</Text>
        <Text style={[styles.value, { color: colors.text }]}>Omar</Text>

        <Text
          style={[styles.label, { color: colors.text + "80", marginTop: 16 }]}
        >
          Email
        </Text>
        <Text style={[styles.value, { color: colors.text }]}>
          omar@example.com
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.card }]}
        onPress={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <ActivityIndicator size="small" color="#ef4444" />
        ) : (
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 32,
  },
  card: {
    padding: 20,
    borderRadius: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: "500",
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
