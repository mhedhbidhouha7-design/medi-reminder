import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
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
import { signUpUser } from "../../controllers/authController";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Erreur",
        "Le mot de passe doit contenir au moins 6 caractères",
      );
      return;
    }

    if (!agreeToTerms) {
      Alert.alert("Erreur", "Veuillez accepter les conditions d'utilisation");
      return;
    }

    setLoading(true);
    try {
      await signUpUser(email, password, name, phone);
      router.replace("/home");
    } catch (error: any) {
      let errorMessage = "Une erreur est survenue lors de l'inscription";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Cette adresse email est déjà utilisée";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Adresse email invalide";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Le mot de passe est trop faible";
      }

      Alert.alert("Inscription échouée", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Left Side - Branding (visible on larger screens or as header) */}
        <View style={styles.brandSection}>
          <View style={styles.brandContent}>
            <View style={styles.logoContainer}>
              <Ionicons name="heart" size={32} color="#fff" />
            </View>
            <Text style={styles.brandTitle}>MediCare</Text>
            <Text style={styles.brandSubtitle}>
              Votre santé, notre priorité
            </Text>

            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name="pulse" size={20} color="#00bfa5" />
                </View>
                <View>
                  <Text style={styles.featureTitle}>Suivi intelligent</Text>
                  <Text style={styles.featureDesc}>
                    Gérez vos médicaments et rendez-vous en toute simplicité
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name="shield-checkmark" size={20} color="#00bfa5" />
                </View>
                <View>
                  <Text style={styles.featureTitle}>Sécurité maximale</Text>
                  <Text style={styles.featureDesc}>
                    Vos données de santé sont protégées et confidentielles
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.imageContainer}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop",
                }}
                style={styles.doctorImage}
                resizeMode="cover"
              />
              <Text style={styles.imageCaption}>
                Application sécurisée pour la gestion de votre santé
              </Text>
            </View>
          </View>
        </View>

        {/* Right Side - Signup Form */}
        <View style={styles.formSection}>
          <View style={styles.formContainer}>
            <Text style={styles.welcomeTitle}>Créer un compte</Text>
            <Text style={styles.welcomeSubtitle}>
              Inscrivez-vous pour accéder à votre espace personnel
            </Text>

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom complet</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Jean Dupont"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="exemple@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* Phone Input (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Téléphone (optionnel)</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="+33 6 12 34 56 78"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  style={styles.input}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Mot de passe</Text>
              </View>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Votre mot de passe"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.passwordHint}>Minimum 6 caractères</Text>
            </View>

            {/* Terms Checkbox */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
            >
              <View
                style={[
                  styles.checkbox,
                  agreeToTerms && styles.checkboxChecked,
                ]}
              >
                {agreeToTerms && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.termsText}>
                Jaccepte les{" "}
                <Text style={styles.termsLink}>Conditions dutilisation</Text> et
                la{" "}
                <Text style={styles.termsLink}>
                  Politique de confidentialité
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Signup Button */}
            <TouchableOpacity
              style={[
                styles.signupButton,
                loading && styles.signupButtonDisabled,
              ]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.signupButtonText}>
                {loading ? "Création en cours..." : "S'inscrire"}
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Déjà un compte ? </Text>
              <Link href="/signin" asChild>
                <Pressable>
                  <Text style={styles.loginLink}>Se connecter</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    flexDirection: Platform.OS === "web" ? "row" : "column",
  },
  // Brand Section Styles
  brandSection: {
    backgroundColor: "#00bfa5",
    flex: Platform.OS === "web" ? 1 : undefined,
    padding: 32,
    justifyContent: "center",
  },
  brandContent: {
    maxWidth: 480,
    alignSelf: "center",
  },
  logoContainer: {
    width: 56,
    height: 56,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  brandSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 40,
  },
  featuresContainer: {
    gap: 20,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  featureIcon: {
    width: 44,
    height: 44,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 20,
  },
  imageContainer: {
    marginTop: "auto",
  },
  doctorImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 12,
  },
  imageCaption: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  // Form Section Styles
  formSection: {
    flex: Platform.OS === "web" ? 1 : undefined,
    backgroundColor: "#fafafa",
    justifyContent: "center",
    padding: 24,
  },
  formContainer: {
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1e293b",
    height: "100%",
  },
  eyeIcon: {
    padding: 4,
  },
  passwordHint: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 6,
    marginLeft: 4,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "#00bfa5",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: "#00bfa5",
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 20,
  },
  termsLink: {
    color: "#00bfa5",
    fontWeight: "500",
  },
  signupButton: {
    backgroundColor: "#00bfa5",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#00bfa5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: "#64748b",
  },
  loginLink: {
    fontSize: 14,
    color: "#00bfa5",
    fontWeight: "600",
  },
});
