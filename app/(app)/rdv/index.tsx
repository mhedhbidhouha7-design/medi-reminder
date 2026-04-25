// app/(app)/rdv/index.tsx
import { Colors } from "@/constants/theme";
import {
  addAppointment,
  completeAppointment,
  deleteAppointment,
  listenToAppointmentHistory,
  listenToAppointments,
  updateAppointmentInsteadOfCreating,
} from "@/controllers/appointmentController";
import { auth } from "@/firebaseConfig";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Appointment, AppointmentHistoryEntry } from "@/models/interfaces";
import { combineDateAndTime, separateHistoryAndTodo, validateDateTime as validateAppointmentDate } from "@/utils/dateHelpers";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
  | "pharmacy"
  | "analysis"
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

export default function AppointmentsScreen() {
  const { t, i18n } = useTranslation();
  const { theme, isDark } = useAppTheme();
  const themeColors = Colors[theme];

  const CONSULTATION_TYPES: {
    key: ConsultationType;
    label: string;
    icon: string;
    color: string;
  }[] = [
    { key: "general", label: t("appointments.types.general"), icon: "medkit", color: "#00bfa5" },
    { key: "specialist", label: t("appointments.types.specialist"), icon: "fitness", color: "#8b5cf6" },
    { key: "dental", label: t("appointments.types.dental"), icon: "happy", color: "#3b82f6" },
    { key: "ophtalmo", label: t("appointments.types.ophtalmo"), icon: "eye", color: "#f59e0b" },
    { key: "cardio", label: t("appointments.types.cardio"), icon: "heart", color: "#ef4444" },
    { key: "pharmacy", label: t("appointments.types.pharmacy"), icon: "medical", color: "#10b981" },
    { key: "analysis", label: t("appointments.types.analysis"), icon: "flask", color: "#ec4899" },
    { key: "other", label: t("appointments.types.other"), icon: "add-circle", color: "#64748b" },
  ];

  const DEFAULT_FORM: FormData = {
    type: "general",
    typeName: t("appointments.types.general"),
    date: "",
    time: "",
    doctor: "",
    location: "",
    notes: "",
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentHistory, setAppointmentHistory] = useState<AppointmentHistoryEntry[]>([]);

  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form Pickers
  const [showFormDatePicker, setShowFormDatePicker] = useState(false);
  const [showFormTimePicker, setShowFormTimePicker] = useState(false);

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
    const unsubHistory = listenToAppointmentHistory(userId, (fetched) =>
      setAppointmentHistory(fetched),
    );
    return () => {
      unsub();
      unsubHistory();
    };
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

  const onFormDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") setShowFormDatePicker(false);
    if (date) {
      const dateStr = date.toISOString().split("T")[0];
      setFormData((prev) => ({ ...prev, date: dateStr }));
    }
  };

  const onFormTimeChange = (event: any, time?: Date) => {
    if (Platform.OS === "android") setShowFormTimePicker(false);
    if (time) {
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      setFormData((prev) => ({ ...prev, time: `${hours}:${minutes}` }));
    }
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

  // ── Filtrage Tabs ─────────────────────────────────────
  const now = new Date();
  const selectedDateStr = toDateStr(selectedDate);

  // Utilize our clean helper function to properly partition active vs history arrays
  const { todo: pendingAppointments, history: combinedHistory } = separateHistoryAndTodo(
    appointments,
    appointmentHistory
  );

  // PENDING: we split pending into "today" and "future" strictly on date string 
  // since timestamps are already guaranteed strictly future via the helper
  const todayStr = toDateStr(now);
  const todayAppointments = pendingAppointments.filter(a => a.date === todayStr);
  const upcomingAppointments = pendingAppointments.filter(a => a.date > todayStr);
  
  // HISTORY: filter further by the UI datepicker
  const historyAppointments = combinedHistory.filter((a) => a.date === selectedDateStr);

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
      type: (appt.type as ConsultationType) || "general",
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
      Alert.alert(t("profile.messages.error"), t("appointments.alerts.missing_date"));
      return;
    }
    if (!formData.time.trim()) {
      Alert.alert(t("profile.messages.error"), t("appointments.alerts.missing_time"));
      return;
    }
    if (!formData.doctor.trim()) {
      Alert.alert(t("profile.messages.error"), t("appointments.alerts.missing_doctor"));
      return;
    }
    if (!userId) return;

    const isoDate = convertDate(formData.date);
    const generatedTimestamp = combineDateAndTime(isoDate, formData.time);

    if (!validateAppointmentDate(generatedTimestamp)) {
      Alert.alert(t("appointments.alerts.invalid_past"), t("appointments.alerts.invalid_past"));
      return;
    }

    try {
      const apptPayload = {
        title: formData.typeName,
        doctor: formData.doctor,
        location: formData.location,
        notes: formData.notes,
        date: isoDate,
        time: formData.time,
        timestamp: generatedTimestamp,
        type: formData.type,
        done: editingAppt ? editingAppt.done : false,
      };

      if (editingAppt) {
        // Update existing document instead of adding a new one
        await updateAppointmentInsteadOfCreating(userId, editingAppt.id, apptPayload);
      } else {
        // Create new
        await addAppointment(userId, apptPayload);
      }
      setModalVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert(t("profile.messages.error"), t("appointments.alerts.save_error"));
    }
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(t("appointments.alerts.delete_title"), t("appointments.alerts.delete_confirm", { title }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("appointments.alerts.delete_title"),
        style: "destructive",
        onPress: async () => {
          if (!userId) return;
          try {
            await deleteAppointment(userId, id);
          } catch {
            Alert.alert(t("profile.messages.error"), t("appointments.alerts.delete_error"));
          }
        },
      },
    ]);
  };

  const toggleCompleted = async (appt: Appointment) => {
    if (!userId) return;
    try {
      await completeAppointment(userId, appt);
    } catch (e) {
      console.error(e);
      Alert.alert(t("profile.messages.error"), t("appointments.alerts.complete_error"));
    }
  };

  const getTypeInfo = (type: ConsultationType) =>
    CONSULTATION_TYPES.find((t) => t.key === type) || CONSULTATION_TYPES[5];

  // ── Carte RDV ────────────────────────────────────────────────────────
  const renderAppointmentCard = (
    appt: Appointment,
    completed = false,
  ) => {
    const typeInfo = getTypeInfo((appt.type as ConsultationType) || "general");
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
          { backgroundColor: isPast ? undefined : themeColors.card, borderColor: isPast ? themeColors.tint : themeColors.tabIconDefault },
        ]}
      >
        {/* Icône gauche */}
        <View style={styles.cardLeft}>
          <View
            style={[
              styles.typeIconContainer,
              {
                backgroundColor: completed
                  ? themeColors.tabIconDefault
                  : isPast
                    ? themeColors.tint
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
                completed ? themeColors.icon : isPast ? themeColors.tint : typeInfo.color
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
                completed && { color: themeColors.tabIconDefault },
                isPast && { color: themeColors.tint },
              ]}
            >
              {appt.title}
            </Text>
            {isPast && (
              <View style={styles.pastBadge}>
                <Text style={styles.pastBadgeText}>{t("appointments.badges.waiting")}</Text>
              </View>
            )}
          </View>

          <View style={styles.appointmentMeta}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={isPast ? themeColors.tint : themeColors.icon}
            />
            <Text style={[styles.metaText, isPast && { color: themeColors.tint }]}> 
              {displayDate(appt.date)}
            </Text>
            <View style={styles.dot} />
            <Ionicons
              name="time-outline"
              size={14}
              color={isPast ? themeColors.tint : themeColors.icon}
            />
            <Text style={[styles.metaText, isPast && { color: themeColors.tint }]}> 
              {appt.time}
            </Text>
            {completed && appt.doneAt && (
                <>
                <View style={styles.dot} />
                <Text style={{ fontSize: 13, color: themeColors.primary, fontWeight: "600" }}>
                  {t("appointments.completed_at", { time: new Date(appt.doneAt).toLocaleTimeString(i18n.language === "ar" ? "ar-EG" : i18n.language, { hour: '2-digit', minute: '2-digit' }) })}
                </Text>
              </>
            )}
          </View>

          {!!appt.doctor && (
            <View style={styles.appointmentMeta}>
              <Ionicons name="person-outline" size={14} color={themeColors.icon} />
              <Text style={styles.metaText}>{appt.doctor}</Text>
            </View>
          )}
          {!!appt.location && (
            <View style={styles.appointmentMeta}>
              <Ionicons name="location-outline" size={14} color={themeColors.icon} />
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
                style={[styles.actionBtn, { backgroundColor: themeColors.background }]}
                onPress={() => openEditModal(appt)}
              >
                <Ionicons name="create-outline" size={20} color={themeColors.icon} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: themeColors.background }]}
                onPress={() => handleDelete(appt.id, appt.title)}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { backgroundColor: themeColors.background },
                  isPast ? styles.checkBtnPast : styles.checkBtn,
                ]}
                onPress={() => toggleCompleted(appt)}
              >
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={isPast ? themeColors.tint : themeColors.primary}
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}> 
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: isDark ? '#0f172a' : themeColors.background }] }>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>{t("appointments.title")}</Text>
        </View>

        <TouchableOpacity style={styles.addButtonHeader} onPress={openAddModal}>
          <LinearGradient
            colors={[themeColors.primary, themeColors.tint]}
            style={styles.addButtonHeaderGradient}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "pending" && styles.activeTab,
            { backgroundColor: activeTab === "pending" ? themeColors.primary : themeColors.card },
          ]}
          onPress={() => setActiveTab("pending")}
        >
          <Text style={[
            styles.tabText,
            activeTab === "pending" && styles.activeTabText,
            { color: activeTab === "pending" ? themeColors.background : themeColors.icon },
          ]}>
            {t("appointments.tabs.todo")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "history" && styles.activeTab,
            { backgroundColor: activeTab === "history" ? themeColors.primary : themeColors.card },
          ]}
          onPress={() => setActiveTab("history")}
        >
          <Text style={[
            styles.tabText,
            activeTab === "history" && styles.activeTabText,
            { color: activeTab === "history" ? themeColors.background : themeColors.icon },
          ]}>
            {t("appointments.tabs.history")}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "history" && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
          <TouchableOpacity
            style={styles.dateSelectionContainer}
            onPress={() => setShowDatePicker(true)}
          >
            <TouchableOpacity onPress={() => changeDate(-1)} style={styles.arrowButton}>
              <Ionicons name="chevron-back" size={20} color={themeColors.primary} />
            </TouchableOpacity>
            <View style={styles.dateInfo}>
              <Text style={styles.currentDateSubtitle}>
                {isToday(selectedDate) ? `${t("home.today")}, ` : ""}
                {selectedDate.toLocaleDateString(i18n.language === "ar" ? "ar-EG" : i18n.language, { day: "numeric", month: "long" })}
              </Text>
            </View>
            <TouchableOpacity onPress={() => changeDate(1)} style={styles.arrowButton}>
              <Ionicons name="chevron-forward" size={20} color={themeColors.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}

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
          {/* ── Pending (À faire) ── */}
          {activeTab === "pending" && (
            <>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIconContainer, { backgroundColor: themeColors.card }]}>
                      <Ionicons name="today" size={18} color={themeColors.primary} />
                    </View>
                    <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>{t("home.today")}</Text>
                    <View style={[styles.badge, { backgroundColor: themeColors.card }]}>
                      <Text style={[styles.badgeText, { color: themeColors.primary }]}>{todayAppointments.length}</Text>
                    </View>
                  </View>

                  <View style={[styles.appointmentsList, { backgroundColor: themeColors.card }]}> 
                    {todayAppointments.length > 0 ? (
                      todayAppointments.map((appt) => renderAppointmentCard(appt))
                    ) : (
                      <View style={styles.emptyState}>
                        <View style={[styles.emptyIconContainer, { backgroundColor: themeColors.card }] }>
                          <Ionicons name="calendar-outline" size={48} color={themeColors.tabIconDefault} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: themeColors.text }]}>{t("appointments.empty.up_to_date")}</Text>
                        <Text style={[styles.emptySubtitle, { color: themeColors.icon }]}>{t("appointments.empty.no_today")}</Text>
                      </View>
                    )}
                  </View>
              </View>

              {upcomingAppointments.length > 0 && (
                <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIconContainer, { backgroundColor: themeColors.card }]}>
                          <Ionicons name="calendar" size={18} color={themeColors.primary} />
                        </View>
                        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{t("home.upcoming_appointments")}</Text>
                        <View style={[styles.badge, { backgroundColor: themeColors.card }]}>
                          <Text style={[styles.badgeText, { color: themeColors.text }]}>{upcomingAppointments.length}</Text>
                        </View>
                      </View>
                      <View style={[styles.appointmentsList, { backgroundColor: themeColors.card }]}>
                        {upcomingAppointments.map((appt) => renderAppointmentCard(appt))}
                      </View>
                </View>
              )}
            </>
          )}

          {/* ── History (Historique) ── */}
          {activeTab === "history" && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, { backgroundColor: themeColors.card }]}> 
                  <Ionicons name="checkmark-circle" size={18} color={themeColors.tabIconDefault} />
                </View>
                <Text style={[styles.sectionTitle, { color: themeColors.tabIconDefault }]}>{t("appointments.sections.past")}</Text>
              </View>
              <View style={[styles.appointmentsList, { backgroundColor: themeColors.card }] }>
                {historyAppointments.length > 0 ? (
                  historyAppointments.map((appt) => renderAppointmentCard(appt, appt.done))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptySubtitle, { color: themeColors.icon }]}>{t("appointments.empty.no_history", { date: displayDate(selectedDateStr) })}</Text>
                  </View>
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
          <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.tabIconDefault }]}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingAppt ? t("appointments.modal.edit") : t("appointments.modal.new")}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {formData.date
                    ? t("appointments.modal.date_label", { date: formData.date })
                    : t("appointments.modal.details")}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <View style={[styles.closeButton, { backgroundColor: themeColors.card }] }>
                  <Ionicons name="close" size={24} color={themeColors.icon} />
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              {/* Type de consultation */}
              <Text style={styles.inputLabel}>{t("appointments.form.type")}</Text>
              <View style={styles.typeGrid}>
                {CONSULTATION_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeOption,
                      formData.type === type.key && styles.typeOptionActive,
                      { backgroundColor: formData.type === type.key ? themeColors.primary : themeColors.card, borderColor: formData.type === type.key ? themeColors.primary : 'transparent' },
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
                              ? themeColors.background
                              : type.color + "15",
                        },
                      ]}
                    >
                      <Ionicons
                        name={type.icon as any}
                        size={24}
                        color={
                          formData.type === type.key ? themeColors.background : type.color
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.typeLabel,
                        formData.type === type.key && styles.typeLabelActive,
                        formData.type === type.key && { color: themeColors.background },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Nom */}
              <Text style={styles.inputLabel}>{t("appointments.form.name")}</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={themeColors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.typeName}
                  onChangeText={(text) => updateForm({ typeName: text })}
                  placeholder={t("appointments.form.name_placeholder")}
                  placeholderTextColor={themeColors.icon}
                />
              </View>

              {/* Date + Heure */}
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>{t("appointments.form.date")}</Text>
                  <TouchableOpacity
                    style={styles.inputContainer}
                    onPress={() => setShowFormDatePicker(true)}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={themeColors.icon}
                      style={styles.inputIcon}
                    />
                    <Text style={[styles.input, { color: formData.date ? themeColors.text : themeColors.icon }]}>
                      {formData.date ? displayDate(formData.date) : t("appointments.form.select")}
                    </Text>
                  </TouchableOpacity>
                  {showFormDatePicker && (
                    <DateTimePicker
                      value={formData.date ? new Date(`${formData.date}T12:00:00`) : new Date()}
                      mode="date"
                      display="default"
                      onChange={onFormDateChange}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>{t("appointments.form.time")}</Text>
                  <TouchableOpacity
                    style={styles.inputContainer}
                    onPress={() => setShowFormTimePicker(true)}
                  >
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={themeColors.icon}
                      style={styles.inputIcon}
                    />
                    <Text style={[styles.input, { color: formData.time ? themeColors.text : themeColors.icon }]}>
                      {formData.time ? formData.time : t("appointments.form.select")}
                    </Text>
                  </TouchableOpacity>
                  {showFormTimePicker && (
                    <DateTimePicker
                      value={formData.time && formData.date ? new Date(`${formData.date}T${formData.time}:00`) : new Date()}
                      mode="time"
                      display="default"
                      onChange={onFormTimeChange}
                    />
                  )}
                </View>
              </View>

              {/* Médecin */}
              <Text style={styles.inputLabel}>{t("appointments.form.doctor")}</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={themeColors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.doctor}
                  onChangeText={(text) => updateForm({ doctor: text })}
                  placeholder={t("appointments.form.doctor_placeholder")}
                  placeholderTextColor={themeColors.icon}
                />
              </View>

              {/* Lieu */}
              <Text style={styles.inputLabel}>{t("appointments.form.location")}</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={themeColors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.location}
                  onChangeText={(text) => updateForm({ location: text })}
                  placeholder={t("appointments.form.location_placeholder")}
                  placeholderTextColor={themeColors.icon}
                />
              </View>

              {/* Notes */}
              <Text style={styles.inputLabel}>{t("appointments.form.notes")}</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.notes}
                  onChangeText={(text) => updateForm({ notes: text })}
                  placeholder={t("appointments.form.notes_placeholder")}
                  placeholderTextColor={themeColors.icon}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Bouton sauvegarder */}
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <LinearGradient
                  colors={[themeColors.primary, themeColors.tint]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>
                    {editingAppt ? t("appointments.form.save_edit") : t("appointments.form.save_new")}
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
  container: { flex: 1, backgroundColor: "transparent" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "transparent",
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  activeTab: {
    backgroundColor: "transparent",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748b",
  },
  activeTabText: {
    color: "#fff",
  },

  // Dashboard & Search
  dashboardContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  dashboardStats: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#8b5cf6",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1e293b",
  },
  categoriesScroll: {
    flexDirection: "row",
  },
  categoryFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginRight: 8,
  },
  categoryFilterActive: {
    backgroundColor: "#8b5cf6",
    borderColor: "transparent",
  },
  categoryFilterText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  categoryFilterTextActive: {
    color: "#fff",
    fontWeight: "600",
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
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b", flex: 1 },
  badge: {
    backgroundColor: "transparent",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  // Liste conteneur
  appointmentsList: {
    backgroundColor: "transparent",
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
    backgroundColor: "transparent",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  appointmentCardCompleted: { opacity: 0.7 },
  appointmentCardPast: {
    backgroundColor: "transparent",
    borderColor: "transparent",
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
    backgroundColor: "transparent",
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
    backgroundColor: "transparent",
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
    borderBottomColor: "transparent",
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
    backgroundColor: "transparent",
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
    backgroundColor: "transparent",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  typeOptionActive: { backgroundColor: "transparent", borderColor: "transparent" },
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
    backgroundColor: "transparent",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "transparent",
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
