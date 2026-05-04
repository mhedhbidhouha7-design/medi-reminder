import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { resetPassword } from "../../controllers/authController";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert(t("profile.messages.attention"), t("auth.forgot_password.errors.enter_email"));
      return;
    }

    console.log("handleReset triggered for:", email);
    setLoading(true);
    try {
      console.log("Calling resetPassword controller...");
      await resetPassword(email);
      console.log("resetPassword controller success");
      setSent(true);
    } catch (error: any) {
      console.error("handleReset caught error:", error);
      Alert.alert(t("profile.messages.error"), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#00bfa5", "#009688"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {!sent ? (
              <>
                <Text style={styles.title}>{t("auth.forgot_password.title")}</Text>
                <Text style={styles.subtitle}>
                  {t("auth.forgot_password.subtitle")}
                </Text>

                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#94a3b8" />
                  <TextInput
                    placeholder={t("auth.forgot_password.email_placeholder")}
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && { opacity: 0.7 }]}
                  onPress={handleReset}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <Text style={styles.buttonText}>
                    {loading ? t("auth.forgot_password.sending") : t("auth.forgot_password.send_button")}
                  </Text>
                </TouchableOpacity>

                <View style={styles.backRow}>
                  <Link href="./signin" asChild>
                    <Pressable>
                      <Text style={styles.link}>{t("auth.forgot_password.back_to_login")}</Text>
                    </Pressable>
                  </Link>
                </View>
              </>
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={70}
                  color="#00bfa5"
                  style={{ alignSelf: "center", marginBottom: 20 }}
                />
                <Text style={styles.title}>{t("auth.forgot_password.email_sent_title")}</Text>
                <Text style={styles.subtitle}>
                  {t("auth.forgot_password.email_sent_subtitle")}
                </Text>

                <TouchableOpacity style={styles.button} activeOpacity={0.85}>
                  <Link href="./signin" asChild>
                    <Pressable>
                      <Text style={styles.buttonText}>
                        {t("auth.forgot_password.back_to_login")}
                      </Text>
                    </Pressable>
                  </Link>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 28,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 20,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1e293b",
  },
  button: {
    backgroundColor: "#00bfa5",
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#00bfa5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backRow: {
    marginTop: 20,
    alignItems: "center",
  },
  link: {
    color: "#00bfa5",
    fontWeight: "600",
  },
});
