import {
  addMedication,
  deleteMedication,
  listenToMedications,
  toggleMedicationDose,
} from "@/controllers/medicationController";
import { auth } from "@/firebaseConfig";
import { DosageSchedule, Medication } from "@/models/interfaces";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "@react-navigation/native";
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
  const { colors } = useTheme();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newMedName, setNewMedName] = useState("");
  const [newMedStartDate, setNewMedStartDate] = useState(new Date());
  const [newMedEndDate, setNewMedEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // History / View Date State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showHistoryPicker, setShowHistoryPicker] = useState(false);

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

    return () => unsubscribe();
  }, [userId]);

  const handleToggleTaken = async (med: Medication, index: number) => {
    if (!userId) return;
    const dateStr = selectedDate.toISOString().split('T')[0];
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

    if (!userId) return;

    try {
      await addMedication(
        userId,
        newMedName,
        validSchedules,
        newMedStartDate.toISOString().split('T')[0],
        newMedEndDate.toISOString().split('T')[0]
      );

      // Reset and close
      setNewMedName("");
      setNewMedStartDate(new Date());
      setNewMedEndDate(new Date());
      setNewSchedules([{ time: "", dose: "" }]);
      setAddModalVisible(false);
    } catch (error) {
      console.error("Error adding medication:", error);
      Alert.alert("Erreur", "Impossible d'ajouter le médicament.");
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
    const dateStr = selectedDate.toISOString().split('T')[0];
    const logs = item.takenLogs?.[dateStr] || {};

    // Check if ALL schedules are taken for SELECTED date
    const allTaken = item.schedules?.length > 0 && item.schedules.every((_, idx) => !!logs[idx]);
    const durationStr = calculateDuration(item.startDate, item.endDate);

    return (
      <View style={[
        styles.item,
        { backgroundColor: allTaken ? "#f8fafc" : colors.card },
        allTaken && { opacity: 0.8, borderColor: "#e2e8f0", borderWidth: 1 }
      ]}>
        <View style={{ flex: 1, marginBottom: 8 }}>
          <View style={styles.medicationHeader}>
            <View>
              <Text style={[
                styles.name,
                { color: allTaken ? "#94a3b8" : colors.text },
                allTaken && { textDecorationLine: "line-through" }
              ]}>{item.name}</Text>
              {(!!item.startDate || !!durationStr) && (
                <Text style={styles.durationText}>
                  <Ionicons name="calendar-outline" size={14} /> {durationStr ? `${durationStr} (${item.startDate} → ${item.endDate})` : item.startDate}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteMedication(item.id, item.name)}
              style={styles.deleteButtonHeader}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
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
                    isTaken && styles.scheduleRowTaken
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      { color: colors.text + "80", fontSize: 14 },
                      isTaken && { textDecorationLine: "line-through", color: "#94a3b8" }
                    ]}>
                      {schedule.time ? `${schedule.time}` : "Heure non spécifiée"}
                    </Text>
                    <Text
                      style={[
                        { color: colors.text, fontWeight: "500", fontSize: 15 },
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
                      color={isTaken ? "#00bfa5" : colors.text + "60"}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
        </View>
      </View>
    );
  };

  const filteredMedications = medications.filter(med => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    if (!med.startDate || !med.endDate) return true;
    return dateStr >= med.startDate && dateStr <= med.endDate;
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Mes médicaments
          </Text>
          <TouchableOpacity
            style={styles.dateSelectionContainer}
            onPress={() => setShowHistoryPicker(true)}
          >
            <TouchableOpacity onPress={() => changeDate(-1)} style={styles.arrowButton}>
              <Ionicons name="chevron-back" size={20} color="#00bfa5" />
            </TouchableOpacity>

            <View style={styles.dateInfo}>
              <Text style={styles.currentDateSubtitle}>
                {isToday(selectedDate) ? "Aujourd'hui, " : ""}
                {selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              </Text>
            </View>

            <TouchableOpacity onPress={() => changeDate(1)} style={styles.arrowButton}>
              <Ionicons name="chevron-forward" size={20} color="#00bfa5" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

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
          <ActivityIndicator size="large" color="#00bfa5" />
        </View>
      ) : (
        <FlatList
          data={filteredMedications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={{ marginTop: 40, alignItems: "center" }}>
              <Ionicons name="calendar-outline" size={48} color={colors.text + "20"} />
              <Text
                style={{
                  textAlign: "center",
                  color: colors.text + "70",
                  marginTop: 12,
                  fontSize: 16,
                }}
              >
                {isToday(selectedDate)
                  ? "Aucun médicament ajouté pour le moment. Appuyez sur le bouton + pour en ajouter un."
                  : `Aucun médicament prévu pour le ${selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}.`}
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouveau médicament</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
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
                      placeholderTextColor="#94a3b8"
                    />
                  </View>

                  <View style={styles.dateRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.inputLabel}>Date de début</Text>
                      <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => setShowStartPicker(true)}
                      >
                        <Ionicons name="calendar-outline" size={18} color="#00bfa5" />
                        <Text style={styles.dateInputText}>
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
                        style={styles.datePickerButton}
                        onPress={() => setShowEndPicker(true)}
                      >
                        <Ionicons name="calendar-outline" size={18} color="#ef4444" />
                        <Text style={styles.dateInputText}>
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
                    <Ionicons name="time-outline" size={16} color="#00bfa5" />
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
                    <View key={index} style={styles.scheduleInputContainer}>
                      <View style={styles.scheduleInputRow}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.subLabel}>Heure / Moment</Text>
                          <TextInput
                            style={styles.input}
                            value={schedule.time}
                            onChangeText={(val) =>
                              updateScheduleField(index, "time", val)
                            }
                            placeholder="Ex: Matin"
                            placeholderTextColor="#94a3b8"
                          />
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
                            placeholderTextColor="#94a3b8"
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

                  <TouchableOpacity
                    style={styles.addDoseButton}
                    onPress={addScheduleField}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#00bfa5" />
                    <Text style={styles.addDoseButtonText}>
                      Ajouter une autre dose (Midi, Soir...)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
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
  addButton: {
    backgroundColor: "#00bfa5",
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
    backgroundColor: "#f1f5f9",
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
    borderBottomColor: "#f1f5f9",
    paddingBottom: 8,
  },
  deleteButtonHeader: {
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
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  scheduleRowTaken: {
    backgroundColor: "#f0fdfa",
    borderColor: "#ccfbf1",
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
    backgroundColor: "#fff",
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
    backgroundColor: "#f1f5f9",
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
    backgroundColor: "#f0fdfa",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ccfbf1",
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
    borderBottomColor: "#e2e8f0",
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: "#1e293b",
  },
  scheduleInputContainer: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
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
    backgroundColor: "#f0fdfa",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#00bfa5",
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
    backgroundColor: "#00bfa5",
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
