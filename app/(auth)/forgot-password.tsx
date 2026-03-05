import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { useState } from "react";
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
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert("Erreur", "Veuillez entrer votre email");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
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
                <Text style={styles.title}>Mot de passe oublié</Text>
                <Text style={styles.subtitle}>
                  Entrez votre email pour recevoir un lien de réinitialisation
                </Text>

                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#94a3b8" />
                  <TextInput
                    placeholder="exemple@email.com"
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
                    {loading ? "Envoi..." : "Envoyer le lien"}
                  </Text>
                </TouchableOpacity>

                <View style={styles.backRow}>
                  <Link href="./signin" asChild>
                    <Pressable>
                      <Text style={styles.link}>Retour à la connexion</Text>
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
                <Text style={styles.title}>Email envoyé ✅</Text>
                <Text style={styles.subtitle}>
                  Vérifiez votre boîte mail (et spam).
                </Text>

                <TouchableOpacity style={styles.button} activeOpacity={0.85}>
                  <Link href="./signin" asChild>
                    <Pressable>
                      <Text style={styles.buttonText}>
                        Retour à la connexion
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
