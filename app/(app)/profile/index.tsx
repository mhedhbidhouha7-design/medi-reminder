import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Sample user data
const SAMPLE_USER = {
  name: "Jean Dupont",
  email: "jean.dupont@email.com",
  phone: "55 123 456",
  dateOfBirth: "15/05/1985",
  gender: "Homme",
  address: "123 Rue de la Santé, Tunis",
  createdAt: "2024-03-10T10:00:00Z",
};

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(SAMPLE_USER.name);
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  // Editable personal info
  const [personalInfo, setPersonalInfo] = useState({
    name: SAMPLE_USER.name,
    email: SAMPLE_USER.email,
    phone: SAMPLE_USER.phone,
    dateOfBirth: SAMPLE_USER.dateOfBirth,
    gender: SAMPLE_USER.gender,
    address: SAMPLE_USER.address,
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    medications: true,
    appointments: true,
    healthAlerts: true,
    email: true,
    sms: false,
  });

  const formatCreationDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSaveProfile = () => {
    setIsEditing(false);
    Alert.alert("Succès", "Profil mis à jour avec succès");
  };

  const handleSavePersonalInfo = () => {
    setIsEditingInfo(false);
    Alert.alert("Succès", "Informations personnelles mises à jour");
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {getInitials(personalInfo.name)}
                </Text>
              </View>
            </View>
            <View style={styles.profileInfo}>
              {isEditing ? (
                <TextInput
                  style={styles.nameInput}
                  value={editedName}
                  onChangeText={setEditedName}
                  autoFocus
                />
              ) : (
                <Text style={styles.profileName}>{personalInfo.name}</Text>
              )}
              <Text style={styles.profileEmail}>{personalInfo.email}</Text>
              <Text style={styles.profileDate}>
                Compte créé le {formatCreationDate(SAMPLE_USER.createdAt)}
              </Text>
            </View>
          </View>

          {!isEditing ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="create-outline" size={18} color="#00bfa5" />
              <Text style={styles.editButtonText}>Modifier</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                  setIsEditing(false);
                  setEditedName(personalInfo.name);
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>Enregistrer</Text>
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
                      name: SAMPLE_USER.name,
                      email: SAMPLE_USER.email,
                      phone: SAMPLE_USER.phone,
                      dateOfBirth: SAMPLE_USER.dateOfBirth,
                      gender: SAMPLE_USER.gender,
                      address: SAMPLE_USER.address,
                    });
                  }}
                >
                  <Text style={styles.smallCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smallSaveButton}
                  onPress={handleSavePersonalInfo}
                >
                  <Text style={styles.smallSaveText}>OK</Text>
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
                  onChangeText={(text) =>
                    setPersonalInfo({ ...personalInfo, email: text })
                  }
                  editable={isEditingInfo}
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
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
                  value={
                    isEditingInfo
                      ? personalInfo.phone
                      : `+33 ${personalInfo.phone}`
                  }
                  onChangeText={(text) =>
                    setPersonalInfo({ ...personalInfo, phone: text })
                  }
                  editable={isEditingInfo}
                  placeholderTextColor="#94a3b8"
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
    backgroundColor: "#00bfa5",
    justifyContent: "center",
    alignItems: "center",
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
