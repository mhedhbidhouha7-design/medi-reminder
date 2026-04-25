import { useAlert } from "@/components/ThemedAlert";
import { Colors } from "@/constants/theme";
import { addProche, updateProche } from "@/controllers/procheController";
import { auth } from "@/firebaseConfig";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      showError(t("proche.alerts.required_fields"), t("proche.alerts.fill_name_email"));
      return;
    }

    // 2. Validate email format
    if (!validateEmail(email.trim())) {
      showError(t("proche.alerts.invalid_email"), t("proche.alerts.invalid_email_desc"));
      return;
    }

    if (!userId) {
      showError(t("proche.alerts.not_logged_in"), t("proche.alerts.not_logged_in_desc"));
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
        showSuccess(t("proche.alerts.contact_modified"), t("proche.alerts.contact_modified_desc"), () => {
          router.back();
        });
      } else {
        await addProche(userId, {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
        });
        showSuccess(t("proche.alerts.contact_added"), t("proche.alerts.contact_added_desc"), () => {
          router.back();
        });
      }

      // Clear form
      setName("");
      setPhone("");
      setEmail("");
    } catch (error) {
      console.error("Error saving proche:", error);
      showError(t("proche.alerts.save_error_title"), t("proche.alerts.save_error_desc"));
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
          {editingId ? t("proche.edit_title") : t("proche.add_title")}
        </Text>
        <View style={{ width: 40 }} />{/* Spacer */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: themeColors.card }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.text }]}>{t("proche.form.name")}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? themeColors.background : themeColors.card, color: themeColors.text, borderColor: themeColors.tabIconDefault }]}
              value={name}
              onChangeText={setName}
              placeholder={t("proche.form.name_placeholder")}
              placeholderTextColor={themeColors.icon}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.text }]}>{t("proche.form.email")}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? themeColors.background : themeColors.card, color: themeColors.text, borderColor: themeColors.tabIconDefault }]}
              value={email}
              onChangeText={setEmail}
              placeholder={t("proche.form.email_placeholder")}
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
                {editingId ? t("proche.form.save_edit") : t("proche.form.save_new")}
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
