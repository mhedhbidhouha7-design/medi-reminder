import { deleteProche, listenToProches } from "@/controllers/procheController";
import { auth } from "@/firebaseConfig";
import { Proche } from "@/models/interfaces";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function ProcheScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [proches, setProches] = useState<Proche[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const unsubscribe = listenToProches(userId, (fetchedProches) => {
      setProches(fetchedProches);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const openAddModal = () => {
    router.push("/proche/add");
  };

  const openEditModal = (proche: Proche) => {
    router.push({
      pathname: "/proche/add",
      params: {
        id: proche.id,
        name: proche.name,
        phone: proche.phone,
        email: proche.email
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Supprimer",
      `Êtes-vous sûr de vouloir supprimer ${name} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            if (!userId) return;
            try {
              await deleteProche(userId, id);
            } catch (error) {
              console.error("Error deleting proche:", error);
              Alert.alert("Erreur", "Impossible de supprimer ce contact.");
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Proche }) => (
    <View style={[styles.item, { backgroundColor: colors.card }]}>
      <View style={styles.itemHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="person" size={24} color="#00bfa5" />
        </View>
        <View style={styles.infoContainer}>
          <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>

          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={14} color="#64748b" />
            <Text style={styles.contactText}>{item.phone}</Text>
          </View>

          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={14} color="#64748b" />
            <Text style={styles.contactText}>{item.email}</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
            <Ionicons name="create-outline" size={22} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Mes Proches
          </Text>
          <Text style={styles.headerSubtitle}>
            Contacts de confiance
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00bfa5" />
        </View>
      ) : (
        <FlatList
          data={proches}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={colors.text + "20"} />
              <Text style={[styles.emptyText, { color: colors.text + "70" }]}>
                Vous n'avez pas encore ajouté de proche. Appuyez sur le bouton + pour en ajouter un.
              </Text>
            </View>
          }
        />
      )}
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
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
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
  emptyContainer: {
    marginTop: 40,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
  },
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
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e0f2f1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  contactText: {
    fontSize: 14,
    color: "#475569",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
});
