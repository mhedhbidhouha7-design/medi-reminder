import { useAlert } from "@/components/ThemedAlert";
import { Colors } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { onValue, ref, update } from "firebase/database";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  DevSettings,
  I18nManager,
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
  const { theme, setTheme, isDark } = useAppTheme();
  const themeColors = Colors[theme];
  const { t, i18n } = useTranslation();
  const { showError, showSuccess, showConfirm, showAlert } = useAlert();
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
      throw new Error(error.message || t("profile.messages.error_upload"));
    }
  };

  // Pick and upload new profile image
  const handleChangeProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showError(
        t("profile.messages.permission_denied"),
        t("profile.messages.permission_denied_desc"),
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
          showSuccess(t("profile.messages.photo_updated"), t("profile.messages.photo_updated_desc"));
        }
      } catch (error: any) {
        showError(t("profile.messages.error"), error.message);
      } finally {
        setUploadingImage(false);
      }
    }
  };

  // Save profile name
  const handleSaveProfile = async () => {
    if (!editedName.trim()) {
      showError(t("profile.messages.required_field"), t("profile.messages.name_empty"));
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
        showSuccess(t("profile.messages.profile_updated"), t("profile.messages.profile_updated_desc"));
      }
    } catch (error) {
      showError(t("profile.messages.error"), t("profile.messages.error_update"));
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
        showSuccess(t("profile.messages.info_updated"), t("profile.messages.info_updated_desc"));
      }
    } catch (error) {
      showError(t("profile.messages.error"), t("profile.messages.error_update"));
    } finally {
      setUpdating(false);
    }
  };

  const changeLanguage = async (lng: string) => {
    if (i18n.language === lng) return;

    try {
      await i18n.changeLanguage(lng);
      const isRTL = lng === "ar";

      if (I18nManager.isRTL !== isRTL) {
        I18nManager.allowRTL(isRTL);
        I18nManager.forceRTL(isRTL);

        showAlert(
          t("profile.language_section"),
          t("profile.language_restart_msg"),
          [
            {
              text: t("common.cancel"),
              style: "cancel",
            },
            {
              text: t("common.ok"),
              onPress: () => {
                DevSettings.reload();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error changing language:", error);
    }
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formatCreationDate = (isoString: string): string => {
    if (!isoString) return t("profile.messages.unknown_date");
    const date = new Date(isoString);
    return date.toLocaleDateString(i18n.language === "ar" ? "ar-EG" : i18n.language === "en" ? "en-US" : "fr-FR", {
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
      <View style={[styles.container, styles.centered, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.tint} />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: themeColors.background }]}>
        <Text style={{ color: themeColors.text }}>Utilisateur non trouvé</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.card }]}>
        <View style={styles.headerContentWrapper}>
          <View style={styles.headerContent}>
            <View style={[styles.headerIcon, { backgroundColor: themeColors.tint }]}>
              <Ionicons name="person" size={24} color="#fff" />
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text style={[styles.headerTitle, { color: themeColors.text }]}>{t("profile.title")}</Text>
              <Text style={[styles.headerSubtitle, { color: themeColors.icon }]}>
                {t("profile.subtitle")}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.headerLogoutButton, { backgroundColor: themeColors.card }]}
            onPress={() => {
              showConfirm(
                t("profile.logout_confirm_title"),
                t("profile.logout_confirm_message"),
                async () => {
                  try {
                    await auth.signOut();
                  } catch (error) {
                    showError(t("profile.messages.error"), t("profile.messages.error_logout"));
                  }
                },
                t("profile.logout_confirm_btn"),
                t("profile.cancel"),
              );
            }}
          >
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Theme Selection Section */}
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="color-palette-outline" size={22} color={themeColors.tint} />
            <Text style={[styles.sectionTitle, { color: themeColors.tint }]}>{t("profile.theme_section")}</Text>
          </View>

          <View style={styles.themeGrid}>
            {[
              { id: 'light', label: t("profile.themes.light"), icon: 'sunny-outline' },
              { id: 'dark', label: t("profile.themes.dark"), icon: 'moon-outline' },
              { id: 'emerald', label: t("profile.themes.emerald"), icon: 'leaf-outline' },
              { id: 'royal', label: t("profile.themes.royal"), icon: 'ribbon-outline' },
            ].map((t_theme) => (
              <TouchableOpacity
                key={t_theme.id}
                style={[
                  styles.themeButton,
                  theme === t_theme.id && { borderColor: themeColors.tint, borderWidth: 2 },
                  { backgroundColor: themeColors.card }
                ]}
                onPress={() => setTheme(t_theme.id as any)}
              >
                <Ionicons name={t_theme.icon as any} size={20} color={t_theme.id === theme ? themeColors.tint : themeColors.icon} />
                <Text style={[
                  styles.themeButtonText,
                  { color: t_theme.id === theme ? themeColors.tint : themeColors.text }
                ]}>
                  {t_theme.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Language Selection Section */}
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="language-outline" size={22} color={themeColors.tint} />
            <Text style={[styles.sectionTitle, { color: themeColors.tint }]}>{t("profile.language_section")}</Text>
          </View>

          <View style={styles.themeGrid}>
            {[
              { id: 'fr', label: t("profile.languages.fr"), icon: 'text-outline' },
              { id: 'en', label: t("profile.languages.en"), icon: 'text-outline' },
              { id: 'ar', label: t("profile.languages.ar"), icon: 'text-outline' },
            ].map((l) => (
              <TouchableOpacity
                key={l.id}
                style={[
                  styles.themeButton,
                  i18n.language === l.id && { borderColor: themeColors.tint, borderWidth: 2 },
                  { backgroundColor: themeColors.card }
                ]}
                onPress={() => changeLanguage(l.id)}
              >
                <Ionicons name={l.icon as any} size={20} color={l.id === i18n.language ? themeColors.tint : themeColors.icon} />
                <Text style={[
                  styles.themeButtonText,
                  { color: l.id === i18n.language ? themeColors.tint : themeColors.text }
                ]}>
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: themeColors.card }]}>
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
                <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors.primary }]}>
                  <Text style={[styles.avatarText, { color: themeColors.background }]}>
                    {getInitials(userData.name)}
                  </Text>
                </View>
              )}
              {uploadingImage && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color={themeColors.background} />
                </View>
              )}
              <View style={[styles.cameraIconContainer, { backgroundColor: themeColors.primary, borderColor: themeColors.background }]}>
                <Ionicons name="camera" size={16} color={themeColors.background} />
              </View>
            </TouchableOpacity>

            <View style={styles.profileInfo}>
              {isEditingProfile ? (
                <TextInput
                  style={[styles.nameInput, { color: themeColors.text, borderBottomColor: themeColors.primary }]}
                  value={editedName}
                  onChangeText={setEditedName}
                  autoFocus
                  placeholder={t("profile.form.placeholder_name")}
                  placeholderTextColor={themeColors.icon}
                />
              ) : (
                <Text style={[styles.profileName, { color: themeColors.text }]}>{userData.name}</Text>
              )}
              <Text style={[styles.profileEmail, { color: themeColors.icon }]}>{userData.email}</Text>
              <Text style={[styles.profileDate, { color: themeColors.icon }]}>
                {t("profile.account_created_on")} {formatCreationDate(userData.createdAt)}
              </Text>
            </View>
          </View>

          {!isEditingProfile ? (
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: themeColors.card }]}
              onPress={() => setIsEditingProfile(true)}
            >
              <Ionicons name="create-outline" size={18} color={themeColors.primary} />
              <Text style={[styles.editButtonText, { color: themeColors.primary }]}>{t("profile.edit")}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton, { backgroundColor: themeColors.card }]}
                onPress={() => {
                  setIsEditingProfile(false);
                  setEditedName(userData.name);
                }}
              >
                <Text style={[styles.cancelButtonText, { color: themeColors.icon }]}>{t("profile.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton, { backgroundColor: themeColors.primary }]}
                onPress={handleSaveProfile}
                disabled={updating}
              >
                <Text style={[styles.saveButtonText, { color: themeColors.background }]}>
                  {updating ? "..." : t("profile.save")}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Personal Information Section */}
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="person-outline" size={22} color={themeColors.tint} />
              <Text style={[styles.sectionTitle, { color: themeColors.tint }]} numberOfLines={1}>{t("profile.personal_info")}</Text>
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
                  <Text style={styles.smallCancelText}>{t("profile.cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smallSaveButton}
                  onPress={handleSavePersonalInfo}
                  disabled={updating}
                >
                  <Text style={styles.smallSaveText}>
                    {updating ? "..." : t("profile.ok")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <Text style={styles.sectionSubtitle}>
            {t("profile.personal_info_subtitle")}
          </Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>{t("profile.form.full_name")}</Text>
              <View style={[styles.inputContainer, { backgroundColor: themeColors.card }]}>
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  value={personalInfo.name}
                  onChangeText={(text) =>
                    setPersonalInfo({ ...personalInfo, name: text })
                  }
                  editable={isEditingInfo}
                  placeholderTextColor={themeColors.icon}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>{t("profile.form.email")}</Text>
              <View style={[styles.inputContainer, { backgroundColor: themeColors.card }]}>
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  value={personalInfo.email}
                  editable={false} // Email cannot be changed
                  placeholderTextColor={themeColors.icon}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>{t("profile.form.phone")}</Text>
              <View style={[styles.inputContainer, { backgroundColor: themeColors.card }]}>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={themeColors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  value={personalInfo.phone}
                  onChangeText={(text) =>
                    setPersonalInfo({ ...personalInfo, phone: text })
                  }
                  editable={isEditingInfo}
                  placeholderTextColor={themeColors.icon}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>{t("profile.form.dob")}</Text>
              <View style={[styles.inputContainer, { backgroundColor: themeColors.card }]}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={themeColors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  value={personalInfo.dateOfBirth}
                  onChangeText={(text) =>
                    setPersonalInfo({ ...personalInfo, dateOfBirth: text })
                  }
                  editable={isEditingInfo}
                  placeholderTextColor={themeColors.icon}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>{t("profile.form.gender")}</Text>
              <View style={[styles.inputContainer, { backgroundColor: themeColors.card }]}>
                <Ionicons
                  name={
                    personalInfo.gender === "Femme"
                      ? "female-outline"
                      : "male-outline"
                  }
                  size={18}
                  color={themeColors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  value={personalInfo.gender}
                  onChangeText={(text) =>
                    setPersonalInfo({ ...personalInfo, gender: text })
                  }
                  editable={isEditingInfo}
                  placeholderTextColor={themeColors.icon}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>{t("profile.form.address")}</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer, { backgroundColor: themeColors.card }]}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={themeColors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.textArea, { color: themeColors.text }]}
                  value={personalInfo.address}
                  onChangeText={(text) =>
                    setPersonalInfo({ ...personalInfo, address: text })
                  }
                  editable={isEditingInfo}
                  placeholderTextColor={themeColors.icon}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={[styles.section, { backgroundColor: themeColors.card }]}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="notifications-outline" size={22} color={themeColors.tint} />
            <Text style={[styles.sectionTitle, { color: themeColors.tint }]} numberOfLines={1}>{t("profile.notifications")}</Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: themeColors.icon }]}>
            {t("profile.notifications_subtitle")}
          </Text>

          <View style={styles.notificationsGrid}>
            <View style={[styles.notificationCard, { backgroundColor: themeColors.card }]}>
              <View style={styles.notificationInfo}>
                <Text style={[styles.notificationTitle, { color: themeColors.text }]}>{t("profile.notification_items.medications")}</Text>
                <Text style={[styles.notificationDesc, { color: themeColors.icon }]}>{t("profile.notification_items.medications_desc")}</Text>
              </View>
              <Switch
                value={notifications.medications}
                onValueChange={() => toggleNotification("medications")}
                trackColor={{ false: themeColors.card, true: themeColors.primary }}
                thumbColor={themeColors.background}
              />
            </View>

            <View style={[styles.notificationCard, { backgroundColor: themeColors.card }]}>
              <View style={styles.notificationInfo}>
                <Text style={[styles.notificationTitle, { color: themeColors.text }]}>{t("profile.notification_items.email")}</Text>
                <Text style={[styles.notificationDesc, { color: themeColors.icon }]}>{t("profile.notification_items.email_desc")}</Text>
              </View>
              <Switch
                value={notifications.email}
                onValueChange={() => toggleNotification("email")}
                trackColor={{ false: themeColors.card, true: themeColors.primary }}
                thumbColor={themeColors.background}
              />
            </View>

            <View style={[styles.notificationCard, { backgroundColor: themeColors.card }]}>
              <View style={styles.notificationInfo}>
                <Text style={[styles.notificationTitle, { color: themeColors.text }]}>{t("profile.notification_items.appointments")}</Text>
                <Text style={[styles.notificationDesc, { color: themeColors.icon }]}>{t("profile.notification_items.appointments_desc")}</Text>
              </View>
              <Switch
                value={notifications.appointments}
                onValueChange={() => toggleNotification("appointments")}
                trackColor={{ false: themeColors.card, true: themeColors.primary }}
                thumbColor={themeColors.background}
              />
            </View>

            <View style={[styles.notificationCard, { backgroundColor: themeColors.card }]}>
              <View style={styles.notificationInfo}>
                <Text style={[styles.notificationTitle, { color: themeColors.text }]}>{t("profile.notification_items.sms")}</Text>
                <Text style={[styles.notificationDesc, { color: themeColors.icon }]}>{t("profile.notification_items.sms_desc")}</Text>
              </View>
              <Switch
                value={notifications.sms}
                onValueChange={() => toggleNotification("sms")}
                trackColor={{ false: themeColors.card, true: themeColors.primary }}
                thumbColor={themeColors.background}
              />
            </View>

            <View style={[styles.notificationCard, styles.fullWidth, { backgroundColor: themeColors.card }]}>
              <View style={styles.notificationInfo}>
                <Text style={[styles.notificationTitle, { color: themeColors.text }]}>{t("profile.notification_items.health_alerts")}</Text>
                <Text style={[styles.notificationDesc, { color: themeColors.icon }]}>{t("profile.notification_items.health_alerts_desc")}</Text>
              </View>
              <Switch
                value={notifications.healthAlerts}
                onValueChange={() => toggleNotification("healthAlerts")}
                trackColor={{ false: themeColors.card, true: themeColors.primary }}
                thumbColor={themeColors.background}
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
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 15,
  },
  themeButton: {
    flex: 1,
    minWidth: '45%',
    height: 60,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  headerContentWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1, // ensure the title section handles shrink
    marginRight: 10,
  },
  headerLogoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(239, 68, 68, 0.1)", // Light red transparent background
    justifyContent: "center",
    alignItems: "center",
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
    gap: 8,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#00bfa5",
    flexShrink: 1,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 16,
    marginLeft: 32,
    flexShrink: 1,
    flexWrap: "wrap",
    width: "100%",
    paddingRight: 40, // Prevent overlapping with outer borders
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
    gap: 6,
    flexShrink: 0,
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
    flexDirection: "column",
    gap: 12,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
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
