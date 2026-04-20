import { auth, firestoreDb } from "@/firebaseConfig"; // ⬅️ tes exports réels
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    addDoc,
    collection,
    onSnapshot,
    query,
    serverTimestamp,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { Colors } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function DoctorSearchScreen() {
  const { theme, isDark } = useAppTheme();
  const themeColors = Colors[theme];
  const router = useRouter();

  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;

  // Chargement en temps réel des médecins (collection "medecins")
  useEffect(() => {
    const q = query(collection(firestoreDb, "medecins"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const doctorsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDoctors(doctorsList);
        setFilteredDoctors(doctorsList);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        Alert.alert("Erreur", "Impossible de charger la liste des médecins");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // Filtre local (nom + prénom + spécialité)
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDoctors(doctors);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = doctors.filter((doc) => {
        const fullName =
          `${doc.firstName || ""} ${doc.lastName || ""}`.toLowerCase();
        return (
          fullName.includes(lowerQuery) ||
          (doc.specialty && doc.specialty.toLowerCase().includes(lowerQuery))
        );
      });
      setFilteredDoctors(filtered);
    }
  }, [searchQuery, doctors]);

  const sendRequest = async (
    doctorId: string,
    firstName: string,
    lastName: string,
  ) => {
    if (!currentUser) {
      Alert.alert("Erreur", "Vous devez être connecté");
      return;
    }

    Alert.alert(
      "Demande de rendez-vous",
      `Envoyer une demande au Dr ${firstName} ${lastName} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Envoyer",
          onPress: async () => {
            try {
              await addDoc(collection(firestoreDb, "requests"), {
                patientId: currentUser.uid,
                doctorId: doctorId,
                status: "pending",
                message: "Demande de rendez-vous depuis MediReminder",
                dateRequested: serverTimestamp(),
                appointmentDate: null,
              });
              Alert.alert("Succès", "Votre demande a été envoyée au médecin");
            } catch (error) {
              console.error(error);
              Alert.alert("Erreur", "Échec de l'envoi de la demande");
            }
          },
        },
      ],
    );
  };

  const renderDoctorCard = ({ item }: { item: any }) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: themeColors.card,
          borderLeftColor: themeColors.primary,
        },
      ]}
    >
      <View style={styles.cardContent}>
        <Text style={[styles.doctorName, { color: themeColors.text }]}>
          Dr {item.firstName} {item.lastName}
        </Text>
        <Text style={[styles.specialty, { color: themeColors.icon }]}>
          {item.specialty || "Spécialité non renseignée"}
        </Text>
        {item.hospital && (
          <View style={styles.hospitalContainer}>
            <Ionicons
              name="business-outline"
              size={14}
              color={themeColors.primary}
            />
            <Text style={[styles.hospital, { color: themeColors.primary }]}>
              {item.hospital}
            </Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: themeColors.primary }]}
        onPress={() => sendRequest(item.id, item.firstName, item.lastName)}
      >
        <Text style={styles.buttonText}>Envoyer une demande</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View
        style={[styles.center, { backgroundColor: themeColors.background }]}
      >
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {/* Header avec bouton retour */}
      <View
        style={[
          styles.header,
          { backgroundColor: isDark ? "#0f172a" : "#e0f2f1" },
        ]}
      >
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: themeColors.card }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.icon} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>
          Chercher un médecin
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color={themeColors.icon}
          style={styles.searchIcon}
        />
        <TextInput
          style={[
            styles.searchBar,
            {
              backgroundColor: themeColors.card,
              color: themeColors.text,
              borderColor: themeColors.tabIconDefault,
            },
          ]}
          placeholder="Nom, spécialité..."
          placeholderTextColor={themeColors.icon}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item.id}
        renderItem={renderDoctorCard}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="medkit-outline"
              size={48}
              color={themeColors.icon}
            />
            <Text style={[styles.emptyText, { color: themeColors.icon }]}>
              Aucun médecin trouvé
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchIcon: { position: "absolute", left: 32, zIndex: 1 },
  searchBar: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    paddingLeft: 40,
    paddingRight: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: { flex: 1 },
  doctorName: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  specialty: { fontSize: 14, marginBottom: 4 },
  hospitalContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  hospital: { fontSize: 13, fontWeight: "500" },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 30,
    marginLeft: 12,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { fontSize: 16 },
});
