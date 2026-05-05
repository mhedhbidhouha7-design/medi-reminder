import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { get, ref } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Animated,
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
import { signInUser } from "../../controllers/authController";
import { auth, db } from "../../firebaseConfig";

export default function Login() {
  const { t } = useTranslation();
  console.log("Rendering Signin screen");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Simple auth check to prevent landing on login if already authenticated
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User already logged in, redirecting from signin to home");
        router.replace("/home");
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const checkUserStatus = async (uid: string) => {
    const snapshot = await get(ref(db, "users/" + uid));

    if (snapshot.exists()) {
      const data = snapshot.val();

      if (data.active === false || data.activate === false) {
        return false;
      }
    }

    return true;
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t("profile.messages.attention"), t("auth.signin.errors.fill_fields"));
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInUser(email, password);
      const user = userCredential.user;

      // ✅ AJOUT IMPORTANT
      const isActive = await checkUserStatus(user.uid);

      if (!isActive) {
        router.replace("/disabled");
        return;
      }

      // ✅ accès autorisé
      router.replace("/home");

    } catch (error: any) {
      Alert.alert(t("auth.signin.errors.login_failed"), error.message);
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
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <Text style={styles.title}>{t("auth.signin.title")}</Text>
            <Text style={styles.subtitle}>{t("auth.signin.subtitle")}</Text>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#94a3b8" />
              <TextInput
                placeholder={t("auth.signin.email_placeholder")}
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
              <TextInput
                placeholder={t("auth.signin.password_placeholder")}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={styles.input}
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <View style={{ alignItems: "flex-end", marginBottom: 20 }}>
              <Link href="/forgot-password" asChild>
                <Pressable>
                  <Text style={styles.link}>{t("auth.signin.forgot_password")}</Text>
                </Pressable>
              </Link>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? t("auth.signin.logging_in") : t("auth.signin.login_button")}
              </Text>
            </TouchableOpacity>

            {/* Signup Link */}
            <View style={styles.signupRow}>
              <Text style={{ color: "#64748b" }}>{t("auth.signin.no_account")}</Text>
              <Link href="/signup" asChild>
                <Pressable>
                  <Text style={styles.link}>{t("auth.signin.create_account")}</Text>
                </Pressable>
              </Link>
            </View>
          </Animated.View>
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
    fontSize: 26,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 8,
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
    marginBottom: 18,
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
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  link: {
    color: "#00bfa5",
    fontWeight: "600",
  },
});
