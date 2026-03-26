import { addProche, updateProche } from "@/controllers/procheController";
import { auth } from "@/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

export default function AddProcheScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();

  // If we pass an `id` param, it means we are editing
  const editingId = params.id as string | undefined;

  const [name, setName] = useState(params.name as string || "");
  const [phone, setPhone] = useState(params.phone as string || "");
  const [email, setEmail] = useState(params.email as string || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userId = auth.currentUser?.uid;

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSave = async () => {
    // 1. Validate required fields
    if (!name.trim() || !phone.trim() || !email.trim()) {
      Alert.alert("Erreur", "Tous les champs (Nom, Téléphone, Email) sont requis.");
      return;
    }

    // 2. Validate email format
    if (!validateEmail(email.trim())) {
      Alert.alert("Erreur", "Veuillez entrer une adresse email valide.");
      return;
    }

    if (!userId) {
      Alert.alert("Erreur", "Vous devez être connecté pour ajouter un proche.");
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
        Alert.alert("Succès", "Le contact a été modifié avec succès.");
      } else {
        await addProche(userId, {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
        });
        Alert.alert("Succès", "Le contact a été ajouté avec succès.");
      }

      // 4. Success feedback and Navigation
      
      // Clear form
      setName("");
      setPhone("");
      setEmail("");
      
      // Navigate back
      router.back();
    } catch (error) {
      console.error("Error saving proche:", error);
      Alert.alert("Erreur", "Impossible d'ajouter ce contact. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.card }]}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {editingId ? "Modifier le proche" : "Nouveau proche"}
        </Text>
        <View style={{ width: 40 }} /> {/* Spacer */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: colors.card }]}> 
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom complet *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Marie Martin"
              placeholderTextColor={colors.text + "60"}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Numéro de téléphone *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Ex: 06 12 34 56 78"
              keyboardType="phone-pad"
              placeholderTextColor={colors.text + "60"}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Adresse email *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              value={email}
              onChangeText={setEmail}
              placeholder="Ex: marie@exemple.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={colors.text + "60"}
            />
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled, { backgroundColor: colors.primary ?? colors.text }]} 
            onPress={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.saveButtonText}>
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
    backgroundColor: "#f1f5f9",
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
    color: "#475569",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1e293b",
  },
  saveButton: {
    backgroundColor: "#00bfa5",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
