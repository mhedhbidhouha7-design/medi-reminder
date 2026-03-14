// app/(app)/rdv/index.tsx
import {
  addAppointment,
  deleteAppointment,
  listenToAppointments,
  toggleAppointmentDone,
} from "@/controllers/appointmentController";
import { auth } from "@/firebaseConfig";
import { Appointment } from "@/models/interfaces";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
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

const { width } = Dimensions.get("window");

type ConsultationType =
  | "general"
  | "specialist"
  | "dental"
  | "ophtalmo"
  | "cardio"
  | "other";

type FormData = {
  type: ConsultationType;
  typeName: string;
  date: string;
  time: string;
  doctor: string;
  location: string;
  notes: string;
};

const CONSULTATION_TYPES: {
  key: ConsultationType;
  label: string;
  icon: string;
  color: string;
}[] = [
  { key: "general", label: "Général", icon: "medkit", color: "#00bfa5" },
  {
    key: "specialist",
    label: "Spécialiste",
    icon: "fitness",
    color: "#8b5cf6",
  },
  { key: "dental", label: "Dentaire", icon: "happy", color: "#3b82f6" },
  { key: "ophtalmo", label: "Ophtalmo", icon: "eye", color: "#f59e0b" },
  { key: "cardio", label: "Cardio", icon: "heart", color: "#ef4444" },
  { key: "other", label: "Autre", icon: "add-circle", color: "#64748b" },
];

const DEFAULT_FORM: FormData = {
  type: "general",
  typeName: "Consultation générale",
  date: "",
  time: "",
  doctor: "",
  location: "",
  notes: "",
};

export default function AppointmentsScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    if (!userId) return;
    const unsub = listenToAppointments(userId, (fetched) =>
      setAppointments(fetched),
    );
    return () => unsub();
  }, [userId]);

  // ── Helpers date ────────────────────────────────────────────────────
  const toDateStr = (d: Date) => d.toISOString().split("T")[0];

  const isToday = (d: Date) => {
    const t = new Date();
    return (
      d.getDate() === t.getDate() &&
      d.getMonth() === t.getMonth() &&
      d.getFullYear() === t.getFullYear()
    );
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  const onDatePickerChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const displayDate = (dateStr: string): string => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const convertDate = (input: string): string => {
    if (input.includes("-")) return input;
    const parts = input.split("/");
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return input;
  };

  // ── Filtrage avec date ET heure ─────────────────────────────────────
  const now = new Date();
  const selectedDateStr = toDateStr(selectedDate);

  // RDV du jour sélectionné non terminés, triés par heure
  const todayAppointments = appointments
    .filter((a) => a.date === selectedDateStr && !a.done)
    .sort((a, b) => {
      const tA = new Date(`${a.date}T${a.time}`).getTime();
      const tB = new Date(`${b.date}T${b.time}`).getTime();
      return tA - tB;
    });

  // À venir : date future OU même jour sélectionné avec heure future
  const upcomingAppointments = appointments
    .filter((a) => {
      if (a.done) return false;
      if (a.date > selectedDateStr) return true;
      // même jour sélectionné mais heure pas encore passée par rapport à maintenant
      if (a.date === selectedDateStr) {
        const apptDateTime = new Date(`${a.date}T${a.time}`);
        return apptDateTime > now;
      }
      return false;
    })
    .sort((a, b) => {
      const tA = new Date(`${a.date}T${a.time}`).getTime();
      const tB = new Date(`${b.date}T${b.time}`).getTime();
      return tA - tB;
    });

  // Passés : done OU date passée OU même jour mais heure dépassée
  const pastAppointments = appointments
    .filter((a) => {
      if (a.done) return true;
      if (a.date < selectedDateStr) return true;
      if (a.date === selectedDateStr) {
        const apptDateTime = new Date(`${a.date}T${a.time}`);
        return apptDateTime <= now;
      }
      return false;
    })
    .sort((a, b) => {
      const tA = new Date(`${a.date}T${a.time}`).getTime();
      const tB = new Date(`${b.date}T${b.time}`).getTime();
      return tB - tA; // plus récent en premier pour les passés
    });

  // ── Formulaire ───────────────────────────────────────────────────────
  const updateForm = (field: Partial<FormData>) =>
    setFormData((prev) => ({ ...prev, ...field }));

  const openAddModal = () => {
    setEditingAppt(null);
    setFormData({ ...DEFAULT_FORM, date: selectedDateStr });
    setModalVisible(true);
  };

  const openEditModal = (appt: Appointment) => {
    setEditingAppt(appt);
    setFormData({
      type: "general",
      typeName: appt.title,
      date: appt.date,
      time: appt.time,
      doctor: appt.doctor ?? "",
      location: appt.location ?? "",
      notes: appt.notes ?? "",
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.date.trim()) {
      Alert.alert("Erreur", "Veuillez saisir la date du rendez-vous.");
      return;
    }
    if (!formData.time.trim()) {
      Alert.alert("Erreur", "Veuillez saisir l'heure du rendez-vous.");
      return;
    }
    if (!formData.doctor.trim()) {
      Alert.alert("Erreur", "Veuillez saisir le nom du médecin.");
      return;
    }
    if (!userId) return;

    const isoDate = convertDate(formData.date);

    try {
      if (editingAppt) {
        await deleteAppointment(userId, editingAppt.id);
      }
      await addAppointment(userId, {
        title: formData.typeName,
        doctor: formData.doctor,
        location: formData.location,
        notes: formData.notes,
        date: isoDate,
        time: formData.time,
        done: false,
      });
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'enregistrer le rendez-vous.");
    }
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert("Supprimer", `Voulez-vous supprimer "${title}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          if (!userId) return;
          try {
            await deleteAppointment(userId, id);
          } catch {
            Alert.alert("Erreur", "Impossible de supprimer ce rendez-vous.");
          }
        },
      },
    ]);
  };

  const toggleCompleted = async (appt: Appointment) => {
    if (!userId) return;
    try {
      await toggleAppointmentDone(userId, appt);
    } catch (e) {
      console.error(e);
    }
  };

  const getTypeInfo = (type: ConsultationType) =>
    CONSULTATION_TYPES.find((t) => t.key === type) || CONSULTATION_TYPES[5];

  // ── Carte RDV ────────────────────────────────────────────────────────
  const renderAppointmentCard = (
    appt: Appointment,
    completed = false,
    showUndo = false,
  ) => {
    const typeInfo = getTypeInfo("general");
    const apptDateTime = new Date(`${appt.date}T${appt.time}`);
    const isPast =
      !completed && apptDateTime <= now && appt.date === selectedDateStr;

    return (
      <View
        key={appt.id}
        style={[
          styles.appointmentCard,
          completed && styles.appointmentCardCompleted,
          isPast && styles.appointmentCardPast,
        ]}
      >
        {/* Icône gauche */}
        <View style={styles.cardLeft}>
          <View
            style={[
              styles.typeIconContainer,
              {
                backgroundColor: completed
                  ? "#f1f5f9"
                  : isPast
                    ? "#fef3c7"
                    : typeInfo.color + "15",
              },
            ]}
          >
            <Ionicons
              name={
                completed
                  ? "checkmark-circle"
                  : isPast
                    ? "time"
                    : (typeInfo.icon as any)
              }
              size={24}
              color={
                completed ? "#94a3b8" : isPast ? "#f59e0b" : typeInfo.color
              }
            />
          </View>
        </View>

        {/* Contenu centre */}
        <View style={styles.cardCenter}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <Text
              style={[
                styles.appointmentType,
                completed && { color: "#94a3b8" },
                isPast && { color: "#92400e" },
              ]}
            >
              {appt.title}
            </Text>
            {isPast && (
              <View style={styles.pastBadge}>
                <Text style={styles.pastBadgeText}>En attente</Text>
              </View>
            )}
          </View>

          <View style={styles.appointmentMeta}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={isPast ? "#f59e0b" : "#64748b"}
            />
            <Text style={[styles.metaText, isPast && { color: "#f59e0b" }]}>
              {displayDate(appt.date)}
            </Text>
            <View style={styles.dot} />
            <Ionicons
              name="time-outline"
              size={14}
              color={isPast ? "#f59e0b" : "#64748b"}
            />
            <Text style={[styles.metaText, isPast && { color: "#f59e0b" }]}>
              {appt.time}
            </Text>
          </View>

          {!!appt.doctor && (
            <View style={styles.appointmentMeta}>
              <Ionicons name="person-outline" size={14} color="#64748b" />
              <Text style={styles.metaText}>{appt.doctor}</Text>
            </View>
          )}
          {!!appt.location && (
            <View style={styles.appointmentMeta}>
              <Ionicons name="location-outline" size={14} color="#64748b" />
              <Text style={styles.metaText} numberOfLines={1}>
                {appt.location}
              </Text>
            </View>
          )}
        </View>

        {/* Actions droite */}
        <View style={styles.cardRight}>
          {!completed && (
            <>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => openEditModal(appt)}
              >
                <Ionicons name="create-outline" size={20} color="#64748b" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleDelete(appt.id, appt.title)}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  isPast ? styles.checkBtnPast : styles.checkBtn,
                ]}
                onPress={() => toggleCompleted(appt)}
              >
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={isPast ? "#f59e0b" : "#00bfa5"}
                />
              </TouchableOpacity>
            </>
          )}
          {showUndo && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => toggleCompleted(appt)}
            >
              <Ionicons name="arrow-undo-outline" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Rendez-vous</Text>

          {/* Sélecteur de date */}
          <TouchableOpacity
            style={styles.dateSelectionContainer}
            onPress={() => setShowDatePicker(true)}
          >
            <TouchableOpacity
              onPress={() => changeDate(-1)}
              style={styles.arrowButton}
            >
              <Ionicons name="chevron-back" size={20} color="#8b5cf6" />
            </TouchableOpacity>
            <View style={styles.dateInfo}>
              <Text style={styles.currentDateSubtitle}>
                {isToday(selectedDate) ? "Aujourd'hui, " : ""}
                {selectedDate.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                })}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => changeDate(1)}
              style={styles.arrowButton}
            >
              <Ionicons name="chevron-forward" size={20} color="#8b5cf6" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.addButtonHeader} onPress={openAddModal}>
          <LinearGradient
            colors={["#8b5cf6", "#7c3aed"]}
            style={styles.addButtonHeaderGradient}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDatePickerChange}
        />
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* ── Section : jour sélectionné ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="today" size={18} color="#8b5cf6" />
              </View>
              <Text style={styles.sectionTitle}>
                {isToday(selectedDate)
                  ? "Aujourd'hui"
                  : displayDate(selectedDateStr)}
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{todayAppointments.length}</Text>
              </View>
            </View>

            <View style={styles.appointmentsList}>
              {todayAppointments.length > 0 ? (
                todayAppointments.map((appt) => renderAppointmentCard(appt))
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons
                      name="calendar-outline"
                      size={48}
                      color="#cbd5e1"
                    />
                  </View>
                  <Text style={styles.emptyTitle}>Aucun rendez-vous</Text>
                  <Text style={styles.emptySubtitle}>
                    {isToday(selectedDate)
                      ? "Appuyez sur + pour en ajouter un"
                      : `Aucun RDV le ${displayDate(selectedDateStr)}`}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Section : À venir ── */}
          {upcomingAppointments.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="calendar" size={18} color="#8b5cf6" />
                </View>
                <Text style={styles.sectionTitle}>À venir</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {upcomingAppointments.length}
                  </Text>
                </View>
              </View>
              <View style={styles.appointmentsList}>
                {upcomingAppointments.map((appt) =>
                  renderAppointmentCard(appt),
                )}
              </View>
            </View>
          )}

          {/* ── Section : Passés / terminés ── */}
          {pastAppointments.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View
                  style={[
                    styles.sectionIconContainer,
                    { backgroundColor: "#f1f5f9" },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#94a3b8" />
                </View>
                <Text style={[styles.sectionTitle, { color: "#94a3b8" }]}>
                  Passés
                </Text>
              </View>
              <View style={styles.appointmentsList}>
                {pastAppointments.map((appt) =>
                  renderAppointmentCard(appt, true, true),
                )}
              </View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>

      {/* ── Modal ajout/édition ── */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingAppt ? "Modifier" : "Nouveau rendez-vous"}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {formData.date
                    ? `Date : ${formData.date}`
                    : "Définir les détails"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <View style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              {/* Type de consultation */}
              <Text style={styles.inputLabel}>Type de consultation</Text>
              <View style={styles.typeGrid}>
                {CONSULTATION_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeOption,
                      formData.type === type.key && styles.typeOptionActive,
                    ]}
                    onPress={() =>
                      updateForm({ type: type.key, typeName: type.label })
                    }
                  >
                    <View
                      style={[
                        styles.typeIconLarge,
                        {
                          backgroundColor:
                            formData.type === type.key
                              ? "#fff"
                              : type.color + "15",
                        },
                      ]}
                    >
                      <Ionicons
                        name={type.icon as any}
                        size={24}
                        color={
                          formData.type === type.key ? "#8b5cf6" : type.color
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.typeLabel,
                        formData.type === type.key && styles.typeLabelActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Nom */}
              <Text style={styles.inputLabel}>Nom de la consultation</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.typeName}
                  onChangeText={(text) => updateForm({ typeName: text })}
                  placeholder="Ex : Consultation générale"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {/* Date + Heure */}
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Date</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#94a3b8"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={formData.date}
                      onChangeText={(text) => updateForm({ date: text })}
                      placeholder="JJ/MM/AAAA"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Heure</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color="#94a3b8"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={formData.time}
                      onChangeText={(text) => updateForm({ time: text })}
                      placeholder="HH:MM"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>
              </View>

              {/* Médecin */}
              <Text style={styles.inputLabel}>Nom du médecin</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.doctor}
                  onChangeText={(text) => updateForm({ doctor: text })}
                  placeholder="Dr. ..."
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {/* Lieu */}
              <Text style={styles.inputLabel}>Lieu</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.location}
                  onChangeText={(text) => updateForm({ location: text })}
                  placeholder="Adresse du cabinet"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {/* Notes */}
              <Text style={styles.inputLabel}>Notes (optionnel)</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.notes}
                  onChangeText={(text) => updateForm({ notes: text })}
                  placeholder="Instructions spéciales..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Bouton sauvegarder */}
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <LinearGradient
                  colors={["#8b5cf6", "#7c3aed"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>
                    {editingAppt ? "Mettre à jour" : "Confirmer le rendez-vous"}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#f8fafc",
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },

  // Sélecteur de date
  dateSelectionContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  arrowButton: { padding: 4 },
  dateInfo: { paddingHorizontal: 12 },
  currentDateSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textTransform: "capitalize",
    fontWeight: "600",
  },

  // Bouton +
  addButtonHeader: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonHeaderGradient: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },

  scrollContent: { flexGrow: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8 },

  // Sections
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b", flex: 1 },
  badge: {
    backgroundColor: "#8b5cf6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  // Liste conteneur
  appointmentsList: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },

  // Card RDV
  appointmentCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  appointmentCardCompleted: { opacity: 0.7 },
  appointmentCardPast: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
  },

  // Badge "En attente"
  pastBadge: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pastBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },

  cardLeft: { marginRight: 14 },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  cardCenter: { flex: 1 },
  appointmentType: { fontSize: 16, fontWeight: "600", color: "#1e293b" },
  appointmentMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  metaText: { fontSize: 13, color: "#64748b" },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#cbd5e1" },
  cardRight: { gap: 8 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  checkBtn: { backgroundColor: "#e0f2f1" },
  checkBtnPast: { backgroundColor: "#fef3c7" },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 30,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  emptySubtitle: { fontSize: 14, color: "#94a3b8", textAlign: "center" },

  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: "92%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  modalSubtitle: { fontSize: 14, color: "#64748b" },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  modalScroll: { padding: 24 },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 10,
    marginTop: 4,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  typeOption: {
    width: (width - 72) / 3,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  typeOptionActive: { backgroundColor: "#8b5cf6", borderColor: "#8b5cf6" },
  typeIconLarge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  typeLabel: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  typeLabelActive: { color: "#fff", fontWeight: "600" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
  },
  inputIcon: { paddingLeft: 16 },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#1e293b",
  },
  row: { flexDirection: "row", gap: 12 },
  textAreaContainer: { alignItems: "flex-start" },
  textArea: { height: 80, textAlignVertical: "top", paddingTop: 14 },
  saveButton: {
    marginTop: 8,
    marginBottom: 30,
    borderRadius: 16,
    overflow: "hidden",
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
