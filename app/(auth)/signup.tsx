import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
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

const CLOUDINARY_CLOUD_NAME = "dlz1lih1j";
const CLOUDINARY_UPLOAD_PRESET = "medireminder";
const CLOUDINARY_FOLDER = "profile_images";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const genderOptions = ["Homme", "Femme"];

  // Upload image to Cloudinary
  const uploadToCloudinary = async (localUri: string): Promise<string> => {
    try {
      const formData = new FormData();

      const filename = localUri.split("/").pop() || "image.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      // @ts-ignore - React Native FormData format
      formData.append("file", {
        uri: localUri,
        name: filename,
        type: type,
      });

      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", CLOUDINARY_FOLDER);

      const timestamp = Date.now();
      formData.append("public_id", `user_${timestamp}`);

      console.log("Uploading to Cloudinary...");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Upload failed");
      }

      console.log("Upload successful:", data.secure_url);
      return data.secure_url;
    } catch (error: any) {
      console.error("Cloudinary upload error:", error);
      throw new Error(error.message || "Erreur lors de l'upload de l'image");
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission refusée",
        "Nous avons besoin d'accéder à votre galerie pour ajouter une photo.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const localUri = result.assets[0].uri;
      setProfileImage(localUri);

      setUploadingImage(true);
      try {
        const cloudinaryUrl = await uploadToCloudinary(localUri);
        setProfileImage(cloudinaryUrl);
      } catch (error: any) {
        Alert.alert("Erreur d'upload", error.message);
        setProfileImage(null);
      } finally {
        setUploadingImage(false);
      }
    }
  };



  //Age
  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const age = calculateAge(selectedDate);
      if (age < 18) {
        Alert.alert("Erreur", "Vous devez avoir au moins 18 ans");
        return;
      }
      setDateOfBirth(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleSignup = async () => {
    if (
      !name ||
      !email ||
      !password ||
      !dateOfBirth ||
      !gender ||
      !phone ||
      !confirmPassword ||
      !profileImage
    ) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (uploadingImage) {
      Alert.alert("Patientez", "L'image est en cours d'upload...");
      return;
    }

    if (
      profileImage.startsWith("file://") ||
      profileImage.startsWith("content://")
    ) {
      Alert.alert(
        "Erreur",
        "L'image n'a pas été uploadée correctement. Veuillez réessayer.",
      );
      return;
    }

    const age = calculateAge(dateOfBirth);
    if (age < 18) {
      Alert.alert(
        "Erreur",
        "Vous devez avoir au moins 18 ans pour créer un compte",
      );
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
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
    const phoneRegex = /^[2459][0-9]{7}$/;
    if (!phoneRegex.test(phone)) {
      Alert.alert(
        "Erreur",
        "Le numéro doit contenir 8 chiffres et commencer par 2, 4, 5 ou 9",
      );
      return;
    }

    setLoading(true);
    try {
      await signUpUser(
        email,
        password,
        name,
        phone,
        (dateOfBirth?.toISOString() || "") as string,
        gender,
        address,
        profileImage, 
      );
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
    <LinearGradient colors={["#00bfa5", "#009688"]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>
              Inscrivez-vous pour accéder à votre espace personnel
            </Text>

            {/* Profile Image Picker */}
            <TouchableOpacity
              style={styles.imagePickerContainer}
              onPress={pickImage}
              disabled={uploadingImage}
            >
              {profileImage ? (
                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.profileImage}
                  />
                  {uploadingImage && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator color="#fff" />
                    </View>
                  )}
                  <View style={styles.editIconContainer}>
                    <Ionicons name="camera" size={16} color="#fff" />
                  </View>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  {uploadingImage ? (
                    <ActivityIndicator color="#94a3b8" />
                  ) : (
                    <>
                      <Ionicons
                        name="camera-outline"
                        size={32}
                        color="#94a3b8"
                      />
                      <Text style={styles.imagePlaceholderText}>Photo *</Text>
                    </>
                  )}
                </View>
              )}
            </TouchableOpacity>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#94a3b8" />
              <TextInput
                placeholder="Nom complet *"
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#94a3b8" />
              <TextInput
                placeholder="Email *"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#94a3b8" />
              <TextInput
                placeholder="Téléphone *"
                value={phone}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, "");
                  setPhone(cleaned);
                }}
                style={styles.input}
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                maxLength={8}
              />
            </View>

            {/* Date of Birth Picker */}
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#94a3b8" />
              <Text
                style={[styles.input, !dateOfBirth && { color: "#94a3b8" }]}
              >
                {dateOfBirth ? formatDate(dateOfBirth) : "Date de naissance *"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#94a3b8" />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dateOfBirth || new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
              />
            )}

            {/* Gender Selector */}
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowGenderModal(true)}
            >
              <Ionicons name="male-female-outline" size={20} color="#94a3b8" />
              <Text style={[styles.input, !gender && { color: "#94a3b8" }]}>
                {gender || "Genre *"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#94a3b8" />
            </TouchableOpacity>

            {/* Gender Modal */}
            <Modal
              visible={showGenderModal}
              transparent={true}
              animationType="slide"
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Sélectionner le genre</Text>
                  {genderOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.modalOption}
                      onPress={() => {
                        setGender(option);
                        setShowGenderModal(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          gender === option && styles.modalOptionTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                      {gender === option && (
                        <Ionicons name="checkmark" size={20} color="#00bfa5" />
                      )}
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.modalCancel}
                    onPress={() => setShowGenderModal(false)}
                  >
                    <Text style={styles.modalCancelText}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Address Input */}
            <View style={[styles.inputContainer, styles.addressInput]}>
              <Ionicons
                name="location-outline"
                size={20}
                color="#94a3b8"
                style={styles.addressIcon}
              />
              <TextInput
                placeholder="Adresse"
                value={address}
                onChangeText={setAddress}
                style={[styles.input, styles.addressTextInput]}
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
              <TextInput
                placeholder="Mot de passe *"
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

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
              <TextInput
                placeholder="Confirmer le mot de passe *"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                style={styles.input}
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#94a3b8"
                />
              </TouchableOpacity>
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
                <Text style={styles.termsLink}>Conditions dutilisation</Text>
              </Text>
            </TouchableOpacity>

            {/* Signup Button */}
            <TouchableOpacity
              style={[
                styles.button,
                (loading || uploadingImage) && { opacity: 0.7 },
              ]}
              onPress={handleSignup}
              disabled={loading || uploadingImage}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonText}>
                {loading
                  ? "Création en cours..."
                  : uploadingImage
                    ? "Upload en cours..."
                    : "S'inscrire"}
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.signinRow}>
              <Text style={styles.signinText}>Déjà un compte ?</Text>
              <Link href="/signin" asChild>
                <Pressable>
                  <Text style={styles.link}> Se connecter</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    marginTop: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
  },
  imagePickerContainer: {
    alignSelf: "center",
    marginBottom: 20,
  },
  imageWrapper: {
    position: "relative",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#00bfa5",
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#00bfa5",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#1e293b",
    paddingVertical: 0,
  },
  addressInput: {
    height: 70,
    alignItems: "flex-start",
    paddingTop: 12,
  },
  addressIcon: {
    marginTop: 4,
  },
  addressTextInput: {
    height: "100%",
    textAlignVertical: "top",
    paddingTop: 2,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#00bfa5",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: "#00bfa5",
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: "#64748b",
    lineHeight: 18,
  },
  termsLink: {
    color: "#00bfa5",
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#00bfa5",
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#00bfa5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  signinRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    paddingBottom: 8,
  },
  signinText: {
    color: "#64748b",
    fontSize: 13,
  },
  link: {
    color: "#00bfa5",
    fontWeight: "600",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalOptionText: {
    fontSize: 15,
    color: "#475569",
  },
  modalOptionTextSelected: {
    color: "#00bfa5",
    fontWeight: "600",
  },
  modalCancel: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 15,
    color: "#64748b",
    fontWeight: "600",
  },
});
