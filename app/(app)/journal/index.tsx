import {
    addJournalEntry,
    listenToJournal,
} from "@/controllers/journalController";
import { auth } from "@/firebaseConfig";
import { HealthJournalEntry } from "@/models/interfaces";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function HealthJournalScreen() {
  const [entries, setEntries] = useState<HealthJournalEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [mood, setMood] = useState("");
  const [bloodSugar, setBloodSugar] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
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
      return alert("Humeur obligatoire !");
    }

    if (!userId) {
      return alert("Utilisateur non authentifié. Veuillez vous reconnecter.");
    }

    const newEntry: HealthJournalEntry = {
      mood: mood.trim(),
      bloodSugar: bloodSugar ? Number(bloodSugar) : undefined,
      bloodPressure: bloodPressure.trim() || undefined,
      notes: notes.trim() || undefined,
      date: new Date().toLocaleDateString("fr-FR"),
      createdAt: new Date().toISOString(),
    };

    try {
      const newDocId = await addJournalEntry(userId, newEntry);
      setEntries((prevEntries) => [
        { ...newEntry, id: newDocId },
        ...prevEntries,
      ]);
      setMood("");
      setBloodSugar("");
      setBloodPressure("");
      setNotes("");
      setModalVisible(false);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du journal :", error);
      alert("Impossible d'enregistrer l'entrée. Vérifiez votre connexion.");
    }
  };

  const renderItem = ({ item }: { item: HealthJournalEntry }) => (
    <View style={styles.card}>
      <Text style={styles.date}>{item.date}</Text>
      <Text>😊 Humeur: {item.mood}</Text>
      {item.bloodSugar !== undefined ? (
        <Text>🩸 Glycémie: {item.bloodSugar}</Text>
      ) : null}
      {item.bloodPressure ? (
        <Text>❤️ Tension: {item.bloodPressure}</Text>
      ) : null}
      {item.notes ? <Text>📝 Notes: {item.notes}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ Ajouter une entrée</Text>
      </TouchableOpacity>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id || item.createdAt}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Aucune entrée pour le moment. Ajoutez votre première note.
            </Text>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.label}>Humeur du jour *</Text>
          <TextInput
            style={styles.input}
            value={mood}
            onChangeText={setMood}
            placeholder="Ex: Heureux, Fatigué..."
          />

          <Text style={styles.label}>Glycémie</Text>
          <TextInput
            style={styles.input}
            value={bloodSugar}
            onChangeText={setBloodSugar}
            keyboardType="numeric"
            placeholder="Ex: 120"
          />

          <Text style={styles.label}>Tension</Text>
          <TextInput
            style={styles.input}
            value={bloodPressure}
            onChangeText={setBloodPressure}
            placeholder="Ex: 120/80"
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Notes..."
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Enregistrer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },

  addButton: {
    backgroundColor: "#4ade80",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  addButtonText: {
    textAlign: "center",
    color: "white",
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  date: {
    fontWeight: "bold",
    marginBottom: 5,
  },

  modalContainer: {
    flex: 1,
    padding: 20,
  },

  label: {
    marginTop: 10,
    fontWeight: "bold",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },

  saveButton: {
    backgroundColor: "#22c55e",
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  saveButtonText: {
    textAlign: "center",
    color: "white",
    fontWeight: "bold",
  },

  cancelButton: {
    backgroundColor: "#ef4444",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  cancelButtonText: {
    textAlign: "center",
    color: "white",
    fontWeight: "bold",
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    color: "#64748b",
    textAlign: "center",
    fontSize: 16,
  },
});
