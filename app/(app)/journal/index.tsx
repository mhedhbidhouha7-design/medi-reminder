import {
  addJournalEntry,
  listenToJournal,
} from "@/controllers/journalController";
import { auth } from "@/firebaseConfig";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Colors } from "@/constants/theme";
import { HealthJournalEntry } from "@/models/interfaces";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";

export default function HealthJournalScreen() {
  const { t, i18n } = useTranslation();
  const { theme, isDark } = useAppTheme();
  const themeColors = Colors[theme];
  
  const [entries, setEntries] = useState<HealthJournalEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form fields
  const [mood, setMood] = useState("");
  const [bloodSugar, setBloodSugar] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [illness, setIllness] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");
  
  const [userId, setUserId] = useState<string | null>(
    auth.currentUser?.uid ?? null,
  );

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!userId) {
      setEntries([]);
      return;
    }

    const unsubscribe = listenToJournal(userId, (fetchedEntries) => {
      setEntries(fetchedEntries);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleSave = async () => {
    if (!mood.trim()) {
      return Alert.alert(t("profile.messages.attention"), t("journal.alerts.mood_required"));
    }

    if (!userId) {
      return Alert.alert(t("profile.messages.error"), t("journal.alerts.auth_error"));
    }

    const newEntry: HealthJournalEntry = {
      mood: mood.trim(),
      bloodSugar: bloodSugar ? Number(bloodSugar) : undefined,
      bloodPressure: bloodPressure.trim() || undefined,
      weight: weight ? Number(weight) : undefined,
      height: height ? Number(height) : undefined,
      illness: illness.trim() || undefined,
      symptoms: symptoms.trim() || undefined,
      notes: notes.trim() || undefined,
      date: new Date().toLocaleDateString(i18n.language === "ar" ? "ar-EG" : i18n.language === "en" ? "en-US" : "fr-FR"),
      createdAt: new Date().toISOString(),
    };

    try {
      await addJournalEntry(userId, newEntry);
      resetForm();
      Alert.alert(t("profile.messages.success"), t("journal.alerts.save_success"));
      setModalVisible(false);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du journal :", error);
      Alert.alert(t("profile.messages.error"), t("journal.alerts.save_error"));
    }
  };

  const resetForm = () => {
    setMood("");
    setBloodSugar("");
    setBloodPressure("");
    setWeight("");
    setHeight("");
    setIllness("");
    setSymptoms("");
    setNotes("");
  };

  const renderItem = ({ item }: { item: HealthJournalEntry }) => (
    <View style={[styles.card, { backgroundColor: themeColors.card }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.dateText, { color: themeColors.icon }]}>{item.date}</Text>
        <View style={styles.moodBadge}>
           <Text style={styles.moodText}>😊 {item.mood}</Text>
        </View>
      </View>
      
      <View style={styles.cardGrid}>
        {item.bloodPressure && (
          <View style={styles.gridItem}>
            <Ionicons name="heart" size={16} color="#ef4444" />
            <Text style={[styles.gridText, { color: themeColors.text }]}>{item.bloodPressure} mmHg</Text>
          </View>
        )}
        {item.bloodSugar !== undefined && (
          <View style={styles.gridItem}>
            <Ionicons name="water" size={16} color="#3b82f6" />
            <Text style={[styles.gridText, { color: themeColors.text }]}>{item.bloodSugar} mg/dL</Text>
          </View>
        )}
        {item.weight !== undefined && (
          <View style={styles.gridItem}>
            <Ionicons name="speedometer" size={16} color="#10b981" />
            <Text style={[styles.gridText, { color: themeColors.text }]}>{item.weight} kg</Text>
          </View>
        )}
        {item.height !== undefined && (
          <View style={styles.gridItem}>
            <Ionicons name="resize" size={16} color="#8b5cf6" />
            <Text style={[styles.gridText, { color: themeColors.text }]}>{item.height} cm</Text>
          </View>
        )}
      </View>

      {(item.illness || item.symptoms) && (
        <View style={styles.healthSection}>
          {item.illness && (
             <Text style={[styles.healthText, { color: themeColors.text }]}>
               <Text style={{fontWeight: 'bold'}}>{t("journal.card.illness")} </Text>{item.illness}
             </Text>
          )}
          {item.symptoms && (
             <Text style={[styles.healthText, { color: themeColors.text }]}>
               <Text style={{fontWeight: 'bold'}}>{t("journal.card.symptoms")} </Text>{item.symptoms}
             </Text>
          )}
        </View>
      )}

      {item.notes && (
        <View style={[styles.notesSection, { borderTopColor: isDark ? "#334155" : "#e2e8f0" }]}>
          <Text style={[styles.notesText, { color: themeColors.icon }]}>{item.notes}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <LinearGradient
        colors={[themeColors.primary, themeColors.tint]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>{t("journal.title")}</Text>
        <Text style={styles.headerSubtitle}>{t("journal.subtitle")}</Text>
      </LinearGradient>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id || item.createdAt}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color={themeColors.icon} />
            <Text style={[styles.emptyText, { color: themeColors.icon }]}>
              {t("journal.empty.title")}
            </Text>
            <TouchableOpacity 
              style={[styles.emptyButton, { backgroundColor: themeColors.primary }]}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.emptyButtonText}>{t("journal.empty.button")}</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: themeColors.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      <Modal 
        visible={modalVisible} 
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.modalContainer, { backgroundColor: themeColors.background }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>{t("journal.modal.title")}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color={themeColors.icon} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
            {/* Section: Humeur */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: themeColors.text }]}>{t("journal.modal.mood_label")}</Text>
              <View style={[styles.inputWithIcon, { borderColor: themeColors.icon }]}>
                <Ionicons name="happy-outline" size={20} color={themeColors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.inputNoBorder, { color: themeColors.text }]}
                  value={mood}
                  onChangeText={setMood}
                  placeholder={t("journal.modal.mood_placeholder")}
                  placeholderTextColor={themeColors.icon}
                />
              </View>
            </View>

            {/* Section: Biométrie */}
            <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>{t("journal.modal.biometrics")}</Text>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: themeColors.text }]}>{t("journal.modal.blood_pressure")}</Text>
                <TextInput
                  style={[styles.input, { color: themeColors.text, borderColor: themeColors.icon }]}
                  value={bloodPressure}
                  onChangeText={setBloodPressure}
                  placeholder="120/80"
                  placeholderTextColor={themeColors.icon}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.label, { color: themeColors.text }]}>{t("journal.modal.blood_sugar")}</Text>
                <TextInput
                  style={[styles.input, { color: themeColors.text, borderColor: themeColors.icon }]}
                  value={bloodSugar}
                  onChangeText={setBloodSugar}
                  keyboardType="numeric"
                  placeholder="mg/dL"
                  placeholderTextColor={themeColors.icon}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: themeColors.text }]}>{t("journal.modal.weight")}</Text>
                <TextInput
                  style={[styles.input, { color: themeColors.text, borderColor: themeColors.icon }]}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  placeholder="70"
                  placeholderTextColor={themeColors.icon}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.label, { color: themeColors.text }]}>{t("journal.modal.height")}</Text>
                <TextInput
                  style={[styles.input, { color: themeColors.text, borderColor: themeColors.icon }]}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  placeholder="175"
                  placeholderTextColor={themeColors.icon}
                />
              </View>
            </View>

            {/* Section: Santé */}
            <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>{t("journal.modal.health_state")}</Text>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: themeColors.text }]}>{t("journal.modal.illness")}</Text>
              <TextInput
                style={[styles.input, { color: themeColors.text, borderColor: themeColors.icon }]}
                value={illness}
                onChangeText={setIllness}
                placeholder={t("journal.modal.illness_placeholder")}
                placeholderTextColor={themeColors.icon}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: themeColors.text }]}>{t("journal.modal.symptoms")}</Text>
              <TextInput
                style={[styles.input, { color: themeColors.text, borderColor: themeColors.icon }]}
                value={symptoms}
                onChangeText={setSymptoms}
                placeholder={t("journal.modal.symptoms_placeholder")}
                placeholderTextColor={themeColors.icon}
                multiline
              />
            </View>

            {/* Section: Notes */}
            <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>{t("journal.modal.notes")}</Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: themeColors.text, borderColor: themeColors.icon }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              placeholder={t("journal.modal.notes_placeholder")}
              placeholderTextColor={themeColors.icon}
            />

            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: isDark ? "#334155" : "#e2e8f0" }]}>
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: themeColors.primary }]} 
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>{t("journal.modal.save")}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginTop: 5,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
  },
  moodBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  moodText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#059669",
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  gridItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.03)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: '45%',
  },
  gridText: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: "500",
  },
  healthSection: {
    marginTop: 8,
    gap: 4,
  },
  healthText: {
    fontSize: 14,
  },
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  notesText: {
    fontSize: 13,
    fontStyle: "italic",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 90,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 20 : 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  modalForm: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputNoBorder: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
  },
  saveButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
