import { auth, db } from "@/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { onValue, ref, update } from "firebase/database";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Cloudinary configuration - same as signup
const CLOUDINARY_CLOUD_NAME = "dlz1lih1j";
const CLOUDINARY_UPLOAD_PRESET = "medireminder";
const CLOUDINARY_FOLDER = "profile_images";

interface UserData {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  profileImageUrl: string;
  createdAt: string;
}

export default function Profile() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  // Form states
  const [editedName, setEditedName] = useState("");
  const [personalInfo, setPersonalInfo] = useState<Partial<UserData>>({});

  // Notification settings
  const [notifications, setNotifications] = useState({
    medications: true,
    appointments: true,
    healthAlerts: true,
    email: true,
    sms: false,
  });

  // Fetch user data from Firebase
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }

    const userRef = ref(db, `users/${userId}`);

    const unsubscribe = onValue(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val() as UserData;
          setUserData(data);
          setEditedName(data.name);
          setPersonalInfo({
            name: data.name,
            email: data.email,
            phone: data.phone,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            address: data.address,
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching user data:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

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

      return data.secure_url;
    } catch (error: any) {
      console.error("Cloudinary upload error:", error);
      throw new Error(error.message || "Erreur lors de l'upload de l'image");
    }
  };

  // Pick and upload new profile image
  const handleChangeProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission refusée",
        "Nous avons besoin d'accéder à votre galerie pour changer la photo.",
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
      setUploadingImage(true);

      try {
        const cloudinaryUrl = await uploadToCloudinary(localUri);

        // Update in Firebase immediately
        const userId = auth.currentUser?.uid;
        if (userId) {
          await update(ref(db, `users/${userId}`), {
            profileImageUrl: cloudinaryUrl,
          });
          Alert.alert("Succès", "Photo de profil mise à jour");
        }
      } catch (error: any) {
        Alert.alert("Erreur", error.message);
      } finally {
        setUploadingImage(false);
      }
    }
  };

  // Save profile name
  const handleSaveProfile = async () => {
    if (!editedName.trim()) {
      Alert.alert("Erreur", "Le nom ne peut pas être vide");
      return;
    }

    setUpdating(true);
    try {
      const userId = auth.currentUser?.uid;
      if (userId) {
        await update(ref(db, `users/${userId}`), {
          name: editedName.trim(),
        });
        setIsEditingProfile(false);
        Alert.alert("Succès", "Profil mis à jour avec succès");
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de mettre à jour le profil");
    } finally {
      setUpdating(false);
    }
  };

  // Save personal info
  const handleSavePersonalInfo = async () => {
    setUpdating(true);
    try {
      const userId = auth.currentUser?.uid;
      if (userId && personalInfo) {
        await update(ref(db, `users/${userId}`), {
          name: personalInfo.name,
          phone: personalInfo.phone,
          dateOfBirth: personalInfo.dateOfBirth,
          gender: personalInfo.gender,
          address: personalInfo.address,
        });
        setIsEditingInfo(false);
        Alert.alert("Succès", "Informations personnelles mises à jour");
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de mettre à jour les informations");
    } finally {
      setUpdating(false);
    }
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formatCreationDate = (isoString: string): string => {
    if (!isoString) return "Date inconnue";
    const date = new Date(isoString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getInitials = (name: string): string => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#00bfa5" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Utilisateur non trouvé</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#e0f2f1", "#f8fafc"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="person" size={24} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Mon Profil</Text>
            <Text style={styles.headerSubtitle}>
              Gérez vos informations personnelles et médicales
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleChangeProfileImage}
              disabled={uploadingImage}
            >
              {userData.profileImageUrl ? (
                <Image
                  source={{ uri: userData.profileImageUrl }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {getInitials(userData.name)}
                  </Text>
                </View>
              )}
              {uploadingImage && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
              <View style={styles.cameraIconContainer}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>

            <View style={styles.profileInfo}>
              {isEditingProfile ? (
                <TextInput
                  style={styles.nameInput}
                  value={editedName}
                  onChangeText={setEditedName}
                  autoFocus
                  placeholder="Votre nom"
                />
              ) : (
                <Text style={styles.profileName}>{userData.name}</Text>
              )}
              <Text style={styles.profileEmail}>{userData.email}</Text>
              <Text style={styles.profileDate}>
                Compte créé le {formatCreationDate(userData.createdAt)}
              </Text>
            </View>
          </View>

          {!isEditingProfile ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditingProfile(true)}
            >
              <Ionicons name="create-outline" size={18} color="#00bfa5" />
              <Text style={styles.editButtonText}>Modifier</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                  setIsEditingProfile(false);
                  setEditedName(userData.name);
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSaveProfile}
                disabled={updating}
              >
                <Text style={styles.saveButtonText}>
                  {updating ? "..." : "Enregistrer"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={22} color="#00bfa5" />
              <Text style={styles.sectionTitle}>Informations personnelles</Text>
            </View>
            {!isEditingInfo ? (
              <TouchableOpacity
                style={styles.penButton}
                onPress={() => setIsEditingInfo(true)}
              >
                <Ionicons name="pencil" size={20} color="#00bfa5" />
              </TouchableOpacity>
            ) : (
              <View style={styles.modifyActions}>
                <TouchableOpacity
                  style={styles.smallCancelButton}
                  onPress={() => {
                    setIsEditingInfo(false);
                    setPersonalInfo({
                      name: userData.name,
                      email: userData.email,
                      phone: userData.phone,
                      dateOfBirth: userData.dateOfBirth,
                      gender: userData.gender,
                      address: userData.address,
                    });
                  }}
                >
                  <Text style={styles.smallCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smallSaveButton}
                  onPress={handleSavePersonalInfo}
                  disabled={updating}
                >
                  <Text style={styles.smallSaveText}>
                    {updating ? "..." : "OK"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <Text style={styles.sectionSubtitle}>
            Gérez vos informations personnelles et médicales
          </Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom complet</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={personalInfo.name}
                  onChangeText={(text) =>
                    setPersonalInfo({ ...personalInfo, name: text })
                  }
                  editable={isEditingInfo}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={personalInfo.email}
                  editable={false} // Email cannot be changed
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Numéro de téléphone</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={personalInfo.phone}
                  onChangeText={(text) =>
                    setPersonalInfo({ ...personalInfo, phone: text })
                  }
                  editable={isEditingInfo}
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date de naissance</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={personalInfo.dateOfBirth}
                  onChangeText={(text) =>
                    setPersonalInfo({ ...personalInfo, dateOfBirth: text })
                  }
                  editable={isEditingInfo}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Genre</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name={
                    personalInfo.gender === "Femme"
                      ? "female-outline"
                      : "male-outline"
                  }
                  size={18}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={personalInfo.gender}
                  onChangeText={(text) =>
                    setPersonalInfo({ ...personalInfo, gender: text })
                  }
                  editable={isEditingInfo}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Adresse</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={personalInfo.address}
                  onChangeText={(text) =>
                    setPersonalInfo({ ...personalInfo, address: text })
                  }
                  editable={isEditingInfo}
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications-outline" size={22} color="#00bfa5" />
            <Text style={styles.sectionTitle}>Paramètres de notifications</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Notifications de médicaments, Notifications de rendez-vous, Alertes
            santé
          </Text>

          <View style={styles.notificationsGrid}>
            <View style={styles.notificationCard}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>
                  Notifications de médicaments
                </Text>
                <Text style={styles.notificationDesc}>
                  Rappels pour vos médicaments
                </Text>
              </View>
              <Switch
                value={notifications.medications}
                onValueChange={() => toggleNotification("medications")}
                trackColor={{ false: "#e2e8f0", true: "#00bfa5" }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.notificationCard}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>
                  Notifications par email
                </Text>
                <Text style={styles.notificationDesc}>Recevoir par email</Text>
              </View>
              <Switch
                value={notifications.email}
                onValueChange={() => toggleNotification("email")}
                trackColor={{ false: "#e2e8f0", true: "#00bfa5" }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.notificationCard}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>
                  Notifications de rendez-vous
                </Text>
                <Text style={styles.notificationDesc}>
                  Rappels de vos rendez-vous
                </Text>
              </View>
              <Switch
                value={notifications.appointments}
                onValueChange={() => toggleNotification("appointments")}
                trackColor={{ false: "#e2e8f0", true: "#00bfa5" }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.notificationCard}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>
                  Notifications par SMS
                </Text>
                <Text style={styles.notificationDesc}>Recevoir par SMS</Text>
              </View>
              <Switch
                value={notifications.sms}
                onValueChange={() => toggleNotification("sms")}
                trackColor={{ false: "#e2e8f0", true: "#00bfa5" }}
                thumbColor="#fff"
              />
            </View>

            <View style={[styles.notificationCard, styles.fullWidth]}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>Alertes santé</Text>
                <Text style={styles.notificationDesc}>
                  Alertes de santé importantes
                </Text>
              </View>
              <Switch
                value={notifications.healthAlerts}
                onValueChange={() => toggleNotification("healthAlerts")}
                trackColor={{ false: "#e2e8f0", true: "#00bfa5" }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Bottom spacing for floating tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },

  // Header
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#00bfa5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e293b",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },

  // Scroll Content
  scrollContent: {
    padding: 16,
    gap: 16,
  },

  // Profile Card
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    position: "relative",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#00bfa5",
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#00bfa5",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#00bfa5",
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    borderBottomWidth: 2,
    borderBottomColor: "#00bfa5",
    paddingVertical: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  profileDate: {
    fontSize: 12,
    color: "#94a3b8",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#e0f2f1",
    borderRadius: 10,
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00bfa5",
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  saveButton: {
    backgroundColor: "#00bfa5",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },

  // Sections
  section: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#00bfa5",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 16,
    marginLeft: 32,
  },

  // Pen Button
  penButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#e0f2f1",
    justifyContent: "center",
    alignItems: "center",
  },
  modifyActions: {
    flexDirection: "row",
    gap: 8,
  },
  smallCancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
  },
  smallCancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  smallSaveButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#00bfa5",
    borderRadius: 8,
  },
  smallSaveText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },

  // Form
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1e293b",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  textAreaContainer: {
    height: 70,
    alignItems: "flex-start",
    paddingTop: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1e293b",
    paddingVertical: 0,
  },
  textArea: {
    height: "100%",
    textAlignVertical: "top",
  },

  // Notifications
  notificationsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    flex: 1,
    minWidth: "45%",
  },
  fullWidth: {
    minWidth: "100%",
  },
  notificationInfo: {
    flex: 1,
    marginRight: 10,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 2,
  },
  notificationDesc: {
    fontSize: 12,
    color: "#94a3b8",
  },
});
