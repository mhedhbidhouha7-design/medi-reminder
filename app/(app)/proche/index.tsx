import { Colors } from "@/constants/theme";
import { useAlert } from "@/components/ThemedAlert";
import { deleteProche, listenToProches } from "@/controllers/procheController";
import { auth } from "@/firebaseConfig";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Proche } from "@/models/interfaces";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProcheScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme, isDark } = useAppTheme();
  const themeColors = Colors[theme];
  const { showConfirm, showError } = useAlert();
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
        email: proche.email,
      },
    });
  };

  const handleDelete = (id: string, name: string) => {
    showConfirm(
      t("proche.alerts.delete_title"),
      t("proche.alerts.delete_confirm", { name }),
      async () => {
        if (!userId) return;
        try {
          await deleteProche(userId, id);
        } catch (error) {
          console.error("Error deleting proche:", error);
          showError(t("profile.messages.error"), t("proche.alerts.delete_error"));
        }
      },
      t("common.delete"),
      t("common.cancel"),
    );
  };

  const renderItem = ({ item }: { item: Proche }) => (
    <View style={[styles.item, { backgroundColor: themeColors.card }]}>
      <View style={styles.itemHeader}>
        <View style={[styles.iconContainer, { backgroundColor: isDark ? themeColors.background : themeColors.card }]}>
          <Ionicons name="person" size={24} color={themeColors.primary} />
        </View>
        <View style={styles.infoContainer}>
          <Text style={[styles.name, { color: themeColors.text }]}>{item.name}</Text>

          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={14} color={themeColors.icon} />
            <Text style={[styles.contactText, { color: themeColors.icon }]}>{item.phone}</Text>
          </View>

          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={14} color={themeColors.icon} />
            <Text style={[styles.contactText, { color: themeColors.icon }]}>{item.email}</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
            <Ionicons name="create-outline" size={22} color={themeColors.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <View style={[styles.header, { backgroundColor: isDark ? "#0f172a" : themeColors.background }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: themeColors.card }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.icon} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            {t("proche.title")}
          </Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.icon }]}>
            {t("proche.subtitle")}
          </Text>
        </View>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: themeColors.primary, shadowColor: themeColors.primary }]} onPress={openAddModal}>
          <Ionicons name="add" size={24} color={themeColors.background} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={proches}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={themeColors.icon} />
              <Text style={[styles.emptyText, { color: themeColors.icon }]}>
                {t("proche.empty_text")}
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
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
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
