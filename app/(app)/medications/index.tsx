import { Colors } from "@/constants/theme";
import {
  addMedication,
  deleteMedication,
  listenToMedicationHistory,
  listenToMedications,
  toggleMedicationDose,
  updateMedication,
} from "@/controllers/medicationController";
import { auth } from "@/firebaseConfig";
import { useAppTheme } from "@/hooks/use-app-theme";
import { DosageSchedule, Medication, MedicationHistoryEntry } from "@/models/interfaces";
import { combineDateAndTime, validateDateTime } from "@/utils/dateHelpers";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function MedicationsScreen() {
  const { theme } = useAppTheme();
  const themeColors = Colors[theme];
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newMedName, setNewMedName] = useState("");
  const [newMedStartDate, setNewMedStartDate] = useState(new Date());
  const [newMedEndDate, setNewMedEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  // History / View Date State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showHistoryPicker, setShowHistoryPicker] = useState(false);
  const [medicationHistory, setMedicationHistory] = useState<MedicationHistoryEntry[]>([]);

  // Editing State
  const [editingMedId, setEditingMedId] = useState<string | null>(null);

  // Time Picker for Schedules State
  const [timePickerIndex, setTimePickerIndex] = useState<number | null>(null);

  // Allow multiple doses per medication
  const [newSchedules, setNewSchedules] = useState<DosageSchedule[]>([
    { time: "", dose: "" },
  ]);

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Call the controller which sets up the snapshot listener
    const unsubscribe = listenToMedications(userId, (fetchedMedications) => {
      setMedications(fetchedMedications);
      setLoading(false);
    });

    const unsubHistory = listenToMedicationHistory(userId, (fetched) => {
      setMedicationHistory(fetched);
    });

    return () => {
      unsubscribe();
      unsubHistory();
    };
  }, [userId]);

  const handleToggleTaken = async (med: Medication, index: number) => {
    if (!userId) return;
    const dateStr = activeTab === "history" 
      ? selectedDate.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
      
    try {
      await toggleMedicationDose(userId, med, index, dateStr);
    } catch (error) {
      console.error("Error toggling taken status:", error);
      Alert.alert("Erreur", "Impossible de mettre à jour le statut.");
    }
  };

  const handleDeleteMedication = (id: string, name: string) => {
    Alert.alert(
      "Supprimer le médicament",
      `Êtes-vous sûr de vouloir supprimer ${name} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            if (!userId) return;
            try {
              await deleteMedication(userId, id);
            } catch (error) {
              console.error("Error deleting medication:", error);
              Alert.alert("Erreur", "Impossible de supprimer ce médicament.");
            }
          },
        },
      ]
    );
  };

  const openEditModal = (med: Medication) => {
    setEditingMedId(med.id);
    setNewMedName(med.name);
    setNewMedStartDate(new Date(med.startDate));
    setNewMedEndDate(new Date(med.endDate));
    setNewSchedules(med.schedules);
    setAddModalVisible(true);
  };

  const addScheduleField = () => {
    setNewSchedules([...newSchedules, { time: "", dose: "" }]);
  };

  const updateScheduleField = (
    index: number,
    field: keyof DosageSchedule,
    value: string
  ) => {
    const updated = [...newSchedules];
    // @ts-ignore
    updated[index][field] = value;
    setNewSchedules(updated);
  };

  const removeScheduleField = (index: number) => {
    if (newSchedules.length > 1) {
      setNewSchedules(newSchedules.filter((_, i) => i !== index));
    }
  };

  const handleAddMedication = async () => {
    if (!newMedName.trim()) {
      Alert.alert("Erreur", "Veuillez entrer le nom du médicament.");
      return;
    }

    // Time validation regex (HH:MM or HHhMM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3])[:h][0-5][0-9]$/;

    // Ensure all schedules have some data
    const validSchedules = newSchedules.filter(
      (s) => s.time.trim() !== "" || s.dose.trim() !== ""
    );

    if (validSchedules.length === 0) {
      Alert.alert("Erreur", "Veuillez ajouter au moins une dose.");
      return;
    }

    // Validate each schedule's time format
    for (const schedule of validSchedules) {
      if (!timeRegex.test(schedule.time.trim())) {
        Alert.alert(
          "Format d'heure invalide",
          `L'heure "${schedule.time}" doit être au format HH:MM (ex: 08:30 ou 14:00).`
        );
        return;
      }
    }

    if (newMedEndDate < newMedStartDate) {
      Alert.alert("Date invalide", "La date de fin ne peut pas être antérieure à la date de début.");
      return;
    }

    // Validation to prevent selecting past date/time for NEW medications
    if (!editingMedId) {
       for (const schedule of validSchedules) {
         const timestamp = combineDateAndTime(newMedStartDate.toISOString().split('T')[0], schedule.time);
         if (!validateDateTime(timestamp)) {
            Alert.alert("Date Invalide", "Vous ne pouvez pas créer un médicament dont la première prise est dans le passé.");
            return;
         }
       }
    }

    if (!userId) return;

    try {
      if (editingMedId) {
        await updateMedication(
          userId,
          editingMedId,
          newMedName,
          validSchedules,
          newMedStartDate.toISOString().split('T')[0],
          newMedEndDate.toISOString().split('T')[0]
        );
      } else {
        await addMedication(
          userId,
          newMedName,
          validSchedules,
          newMedStartDate.toISOString().split('T')[0],
          newMedEndDate.toISOString().split('T')[0]
        );
      }

      // Reset and close
      setNewMedName("");
      setNewMedStartDate(new Date());
      setNewMedEndDate(new Date());
      setNewSchedules([{ time: "", dose: "" }]);
      setEditingMedId(null);
      setAddModalVisible(false);
    } catch (error) {
      console.error("Error saving medication:", error);
      Alert.alert("Erreur", "Impossible d'enregistrer le médicament.");
    }
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setNewMedStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setNewMedEndDate(selectedDate);
    }
  };

  const onScheduleTimeChange = (event: any, time?: Date) => {
    if (Platform.OS === "android") setTimePickerIndex(null);
    if (time && timePickerIndex !== null) {
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      updateScheduleField(timePickerIndex, "time", `${hours}:${minutes}`);
    }
  };

  const onHistoryDateChange = (event: any, date?: Date) => {
    // For Android, we hide the picker after selection
    if (Platform.OS === 'android') {
      setShowHistoryPicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const calculateDuration = (start: any, end: any) => {
    if (!start || !end) return "";
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = e.getTime() - s.getTime();
    if (diffTime < 0) return "Période invalide";
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  };

  const renderItem = ({ item }: { item: Medication }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const dateStr = activeTab === "history" ? selectedDate.toISOString().split('T')[0] : todayStr;
    const logs = item.takenLogs?.[dateStr] || {};

    // Check if ALL schedules are taken for SELECTED date
    const allTaken = item.schedules?.length > 0 && item.schedules.every((_, idx) => !!logs[idx]);
    const durationStr = calculateDuration(item.startDate, item.endDate);

    return (
      <View style={[
        styles.item,
        { backgroundColor: themeColors.background },
        allTaken && { opacity: 0.8, borderColor: themeColors.tabIconDefault, borderWidth: 1 }
      ]}>
        <View style={{ flex: 1, marginBottom: 8 }}>
          <View style={styles.medicationHeader}>
            <View>
              <Text style={[
                styles.name,
                { color: allTaken ? themeColors.text + "60" : themeColors.text },
                allTaken && { textDecorationLine: "line-through" }
              ]}>{item.name}</Text>
              {(!!item.startDate || !!durationStr) && (
                <Text style={[styles.durationText, { color: themeColors.text + "60" }] }>
                  <Ionicons name="calendar-outline" size={14} color={themeColors.text + "60"} /> {durationStr ? `${durationStr} (${item.startDate} → ${item.endDate})` : item.startDate}
                </Text>
              )}
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => openEditModal(item)}
                style={styles.editButtonHeader}
              >
                <Ionicons name="create-outline" size={20} color={themeColors.text + "60"} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteMedication(item.id, item.name)}
                style={styles.deleteButtonHeader}
              >
                <Ionicons name="trash-outline" size={20} color={themeColors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Render Each Schedule Dose individually */}
          {item.schedules &&
            item.schedules.map((schedule, index) => {
              const isTaken = !!logs[index];
              return (
                <View
                  key={index}
                    style={[
                    styles.scheduleRow,
                    { backgroundColor: themeColors.background },
                    isTaken && styles.scheduleRowTaken
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      { color: themeColors.text + "80", fontSize: 14 },
                      isTaken && { textDecorationLine: "line-through", color: "#94a3b8" }
                    ]}>
                      {schedule.time ? `${schedule.time}` : "Heure non spécifiée"}
                      {isTaken && typeof logs[index] === "string" && ` • Pris à ${new Date(logs[index] as string).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                    </Text>
                    <Text
                      style={[
                        { color: themeColors.text, fontWeight: "500", fontSize: 15 },
                        isTaken && { textDecorationLine: "line-through", color: "#94a3b8" }
                      ]}
                    >
                      {schedule.dose ? schedule.dose : "Dose non spécifiée"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleToggleTaken(item, index)}
                    style={styles.actionButton}
                  >
                    <Ionicons
                      name={isTaken ? "checkmark-circle" : "ellipse-outline"}
                      size={32}
                      color={isTaken ? themeColors.primary : themeColors.text + "60"}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
        </View>
      </View>
    );
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const compareDateStr = activeTab === "history" ? selectedDate.toISOString().split('T')[0] : todayStr;

  const filteredMedications = medications.filter(med => {
    if (!med.startDate || !med.endDate) return true;
    return compareDateStr >= med.startDate && compareDateStr <= med.endDate;
  });

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
          <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}> 
            Mes médicaments
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: themeColors.primary, shadowColor: themeColors.primary }]}
          onPress={() => setAddModalVisible(true)}
        >
          <Ionicons name="add" size={24} color={themeColors.background} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: activeTab === "pending" ? themeColors.primary : themeColors.background }]}
          onPress={() => setActiveTab("pending")}
        >
          <Text style={[styles.tabText, { color: activeTab === "pending" ? themeColors.background : themeColors.text + "60", fontWeight: activeTab === "pending" ? "700" : "600" }]}> 
            À faire
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: activeTab === "history" ? themeColors.primary : themeColors.background }]}
          onPress={() => setActiveTab("history")}
        >
          <Text style={[styles.tabText, { color: activeTab === "history" ? themeColors.background : themeColors.text + "60", fontWeight: activeTab === "history" ? "700" : "600" }]}> 
            Historique
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "history" && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
          <TouchableOpacity
            style={[styles.dateSelectionContainer, { backgroundColor: themeColors.background }]}
            onPress={() => setShowHistoryPicker(true)}
          >
            <TouchableOpacity onPress={() => changeDate(-1)} style={styles.arrowButton}>
              <Ionicons name="chevron-back" size={20} color={themeColors.primary} />
            </TouchableOpacity>

            <View style={styles.dateInfo}>
              <Text style={[styles.currentDateSubtitle, { color: themeColors.text }]}> 
                {isToday(selectedDate) ? "Aujourd'hui, " : ""}
                {selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              </Text>
            </View>

            <TouchableOpacity onPress={() => changeDate(1)} style={styles.arrowButton}>
              <Ionicons name="chevron-forward" size={20} color={themeColors.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}

      {showHistoryPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onHistoryDateChange}
        />
      )}

      {loading ? (
          <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredMedications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={{ marginTop: 40, alignItems: "center" }}>
              <Ionicons name="calendar-outline" size={48} color={themeColors.text + "20"} />
              <Text
                style={{
                  textAlign: "center",
                  color: themeColors.text + "70",
                  marginTop: 12,
                  fontSize: 16,
                }}
              >
                {activeTab === "pending"
                  ? "Aucune dose programmée." 
                  : "Aucun historique pour ce jour."}
              </Text>
            </View>
          }
        />
      )}

      {/* Add Medication Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addModalVisible}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.background }] }>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingMedId ? "Modifier le médicament" : "Nouveau médicament"}
              </Text>
              <TouchableOpacity onPress={() => {
                setAddModalVisible(false);
                setEditingMedId(null);
                setNewMedName("");
                setNewSchedules([{ time: "", dose: "" }]);
              }}>
                <Ionicons name="close" size={24} color={themeColors.text + "60"} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Form Content */}
            <FlatList
              showsVerticalScrollIndicator={false}
              data={[1]} // Dummy to wrap everything in flatlist for scrolling
              renderItem={() => (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Nom du médicament</Text>
                      <TextInput
                      style={styles.input}
                      value={newMedName}
                      onChangeText={setNewMedName}
                      placeholder="Ex: Doliprane 500"
                      placeholderTextColor={themeColors.text + "60"}
                    />
                  </View>

                  <View style={styles.dateRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.inputLabel}>Date de début</Text>
                                <TouchableOpacity
                                  style={[styles.datePickerButton, { backgroundColor: themeColors.background }]}
                                    onPress={() => setShowStartPicker(true)}
                                  >
                                    <Ionicons name="calendar-outline" size={18} color={themeColors.primary} />
                                    <Text style={[styles.dateInputText, { color: themeColors.text }]}>
                                      {newMedStartDate.toLocaleDateString('fr-FR')}
                                    </Text>
                                  </TouchableOpacity>
                      {showStartPicker && (
                        <DateTimePicker
                          value={newMedStartDate}
                          mode="date"
                          display="default"
                          onChange={onStartDateChange}
                        />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Date de fin</Text>
                      <TouchableOpacity
                        style={[styles.datePickerButton, { backgroundColor: themeColors.background }]}
                        onPress={() => setShowEndPicker(true)}
                      >
                        <Ionicons name="calendar-outline" size={18} color={themeColors.primary} />
                        <Text style={[styles.dateInputText, { color: themeColors.text }]}>
                          {newMedEndDate.toLocaleDateString('fr-FR')}
                        </Text>
                      </TouchableOpacity>
                      {showEndPicker && (
                        <DateTimePicker
                          value={newMedEndDate}
                          mode="date"
                          display="default"
                          onChange={onEndDateChange}
                        />
                      )}
                    </View>
                  </View>

                  <View style={styles.durationBanner}>
                    <Ionicons name="time-outline" size={16} color={themeColors.primary} />
                    <Text style={styles.durationBannerText}>
                      Durée du traitement : {calculateDuration(newMedStartDate, newMedEndDate)}
                    </Text>
                  </View>



                  <View style={styles.schedulesSectionLabel}>
                    <Text style={styles.inputLabel}>
                      Posologie (Doses par jour)
                    </Text>
                  </View>

                  {newSchedules.map((schedule, index) => (
                    <View key={index} style={[styles.scheduleInputContainer, { backgroundColor: themeColors.background, borderColor: themeColors.tabIconDefault }]}>
                      <View style={styles.scheduleInputRow}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.subLabel}>Heure / Moment</Text>
                          <TouchableOpacity
                            style={[
                              styles.input,
                              {
                                justifyContent: "center",
                                borderColor: themeColors.tabIconDefault,
                                borderWidth: 1,
                                borderRadius: 14,
                                backgroundColor: themeColors.background,
                                minHeight: 48,
                                paddingHorizontal: 12
                              }
                            ]}
                            onPress={() => setTimePickerIndex(index)}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                              <Ionicons name="time-outline" size={18} color={themeColors.text + "60"} />
                              <Text style={{ color: schedule.time ? themeColors.text : themeColors.text + "60", fontSize: 16 }}>
                                {schedule.time || "Sélectionner..."}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subLabel}>Quantité</Text>
                          <TextInput
                            style={styles.input}
                            value={schedule.dose}
                            onChangeText={(val) =>
                              updateScheduleField(index, "dose", val)
                            }
                            placeholder="Ex: 2 pilules"
                            placeholderTextColor={themeColors.text + "60"}
                          />
                        </View>
                      </View>
                      {newSchedules.length > 1 && (
                        <TouchableOpacity
                          style={styles.removeScheduleBtn}
                          onPress={() => removeScheduleField(index)}
                        >
                          <Ionicons
                            name="remove-circle-outline"
                            size={20}
                            color="#ef4444"
                          />
                          <Text style={styles.removeScheduleText}>Retirer</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}

                  {timePickerIndex !== null && (
                    <DateTimePicker
                      value={newSchedules[timePickerIndex]?.time ? new Date(`1970-01-01T${newSchedules[timePickerIndex].time}:00`) : new Date()}
                      mode="time"
                      display="default"
                      onChange={onScheduleTimeChange}
                    />
                  )}

                  <TouchableOpacity
                    style={[styles.addDoseButton, { backgroundColor: themeColors.background, borderColor: themeColors.primary }]}
                    onPress={addScheduleField}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={themeColors.primary} />
                    <Text style={[styles.addDoseButtonText, { color: themeColors.primary }] }>
                      Ajouter une autre dose (Midi, Soir...)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: themeColors.primary }]}
                    onPress={handleAddMedication}
                  >
                    <Text style={styles.saveButtonText}>Enregistrer</Text>
                  </TouchableOpacity>
                </>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  headerTitleContainer: {
    flex: 1,
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
    backgroundColor: "#00bfa5",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748b",
  },
  activeTabText: {
    color: "#fff",
  },
  addButton: {
    backgroundColor: "transparent",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#00bfa5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dateSelectionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "transparent",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  arrowButton: {
    padding: 4,
  },
  dateInfo: {
    paddingHorizontal: 12,
  },
  currentDateSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textTransform: "capitalize",
    fontWeight: "600",
  },
  // Item Styles
  item: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  medicationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
    paddingBottom: 8,
  },
  deleteButtonHeader: {
    padding: 4,
  },
  editButtonHeader: {
    padding: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  durationText: {
    fontSize: 13,
    color: "#00bfa5",
    fontWeight: "500",
    marginTop: 2,
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "transparent",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  scheduleRowTaken: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  actionButton: {
    padding: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "transparent",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
    marginTop: 4,
  },
  dateRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 10,
    padding: 14,
    height: 50,
  },
  dateInputText: {
    marginLeft: 8,
    fontSize: 15,
    color: "#1e293b",
  },
  durationBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  durationBannerText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#0f766e",
    fontWeight: "600",
  },
  durationPreview: {
    fontSize: 13,
    color: "#00bfa5",
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "right",
  },
  schedulesSectionLabel: {
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "transparent",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: "#1e293b",
  },
  scheduleInputContainer: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  scheduleInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  removeScheduleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 4,
  },
  removeScheduleText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "500",
  },
  addDoseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "transparent",
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    marginTop: 8,
    gap: 8,
  },
  addDoseButtonText: {
    color: "#00bfa5",
    fontWeight: "600",
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: "transparent",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
