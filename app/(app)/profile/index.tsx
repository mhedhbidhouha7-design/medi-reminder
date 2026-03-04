// app/(app)/profile/index.tsx
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { Alert, Button, StyleSheet, Text, View } from "react-native";
import { auth } from "../../../firebaseConfig"; // adjust path

export default function ProfileScreen() {
  console.log("Rendering ProfileScreen");
  const { colors } = useTheme();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/signin");
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    }
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

      <View style={{ marginTop: 40 }}>
        <Button title="Se déconnecter" onPress={handleLogout} color="red" />
      </View>
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
});
