import { useAlert } from "@/components/ThemedAlert";
import { Colors } from "@/constants/theme";
import { addProche, updateProche } from "@/controllers/procheController";
import { auth } from "@/firebaseConfig";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddProcheScreen() {
  const router = useRouter();
  const { theme, isDark } = useAppTheme();
  const themeColors = Colors[theme];
  const { showError, showSuccess } = useAlert();
  const params = useLocalSearchParams();

  // If we pass an `id` param, it means we are editing
  const editingId = params.id as string | undefined;

  const [name, setName] = useState((params.name as string) || "");
  const [phone, setPhone] = useState((params.phone as string) || "");
  const [email, setEmail] = useState((params.email as string) || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userId = auth.currentUser?.uid;

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSave = async () => {
    // 1. Validate required fields
    if (!name.trim() || !email.trim()) {
      showError("Champs requis", "Veuillez remplir le nom et l'email.");
      return;
    }

    // 2. Validate email format
    if (!validateEmail(email.trim())) {
      showError("Email invalide", "Veuillez entrer une adresse email valide.");
      return;
    }

    if (!userId) {
      showError("Non connecté", "Vous devez être connecté pour ajouter un proche.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 3. Save to Firestore
      if (editingId) {
        await updateProche(userId, editingId, {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
        });
        showSuccess("Contact modifié", "Le contact a été modifié avec succès.", () => {
          router.back();
        });
      } else {
        await addProche(userId, {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
        });
        showSuccess("Contact ajouté", "Le contact a été ajouté avec succès.", () => {
          router.back();
        });
      }

      // Clear form
      setName("");
      setPhone("");
      setEmail("");
    } catch (error) {
      console.error("Error saving proche:", error);
      showError("Échec", "Impossible d'ajouter ce contact. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: themeColors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { backgroundColor: isDark ? "#0f172a" : themeColors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: themeColors.card }]}>
          <Ionicons name="arrow-back" size={24} color={themeColors.icon} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>
          {editingId ? "Modifier le proche" : "Nouveau proche"}
        </Text>
        <View style={{ width: 40 }} />{/* Spacer */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: themeColors.card }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.text }]}>Nom complet *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? themeColors.background : themeColors.card, color: themeColors.text, borderColor: themeColors.tabIconDefault }]}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Marie Martin"
              placeholderTextColor={themeColors.icon}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.text }]}>Adresse email *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? themeColors.background : themeColors.card, color: themeColors.text, borderColor: themeColors.tabIconDefault }]}
              value={email}
              onChangeText={setEmail}
              placeholder="Ex: marie@exemple.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={themeColors.icon}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled, { backgroundColor: themeColors.primary }]}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={themeColors.background} />
            ) : (
              <Text style={[styles.saveButtonText, { color: themeColors.background }]}>
                {editingId ? "Enregistrer les modifications" : "Enregistrer le contact"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  saveButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
