// components/SidebarMenu.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; //  useRouter au lieu de useNavigation
import { useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

type SidebarMenuProps = {
  visible: boolean;
  onClose: () => void;
  activeRoute: string; // "home" | "medications" | "profile" | ...
};

// ✅ Les routes correspondent exactement à votre structure app/(app)/
const MENU_ITEMS = [
  {
    icon: "grid-outline",
    label: "Tableau de bord",
    route: "/(app)/home",
    key: "home",
  },
  {
    icon: "medical-outline",
    label: "Médicaments",
    route: "/(app)/medications/index",
    key: "medications",
  },
  {
    icon: "calendar-outline",
    label: "Rendez-vous",
    route: "/(app)/rdv/index",
    key: "rdv",
  },
  {
    icon: "sparkles-outline",
    label: "Analyse IA",
    route: "/(app)/IA/index",
    key: "ia",
  },
  {
    icon: "document-text-outline",
    label: "Résumé de santé",
    route: "/(app)/health-summary",
    key: "health-summary",
  },
  {
    icon: "book-outline",
    label: "Journal de santé",
    route: "/(app)/journal/index",
    key: "journal",
  },
  {
    icon: "people-outline",
    label: "Proches",
    route: "/(app)/family",
    key: "family",
  },
];

export default function SidebarMenu({
  visible,
  onClose,
  activeRoute,
}: SidebarMenuProps) {
  const router = useRouter(); // ✅ useRouter
  const slideAnim = useRef(new Animated.Value(-width)).current;

  if (visible) {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handleNavigate = (item: (typeof MENU_ITEMS)[0]) => {
    handleClose();
    if (item.key !== activeRoute) {
      router.push(item.route as any); // ✅ navigation avec le chemin complet
    }
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.menuOverlay}>
        <Pressable style={styles.overlay} onPress={handleClose} />

        <Animated.View
          style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}
        >
          {/* Logo */}
          <View style={styles.menuHeader}>
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Ionicons name="heart" size={24} color="#fff" />
              </View>
              <View>
                <Text style={styles.logoTitle}>MediReminder</Text>
                <Text style={styles.logoSubtitle}>Health App</Text>
              </View>
            </View>
          </View>

          {/* Carte utilisateur */}
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>JD</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userCardName}>Jean Dupont</Text>
              <Text style={styles.userCardEmail}>jean.dupont@email.com</Text>
            </View>
          </View>
                                                                                                                                                                      bnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn                                                                                                                                                                                                                               vv
          {/* Items */}
          <View style={styles.menuList}>
            {MENU_ITEMS.map((item, index) => {
              const isActive = item.key === activeRoute; // ✅ comparaison sur la clé courte
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.menuItem, isActive && styles.menuItemActive]}
                  onPress={() => handleNavigate(item)}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={isActive ? "#fff" : "#64748b"}
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      isActive && styles.menuItemTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Déconnexion */}
          <View style={styles.logoutSection}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleClose}>
              <Ionicons name="log-out-outline" size={22} color="#64748b" />
              <Text style={styles.logoutText}>Déconnexion</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menuOverlay: { flex: 1, flexDirection: "row" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.75,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  menuHeader: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#fff",
  },
  logoContainer: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#00bfa5",
    justifyContent: "center",
    alignItems: "center",
  },
  logoTitle: { fontSize: 20, fontWeight: "bold", color: "#1e293b" },
  logoSubtitle: { fontSize: 13, color: "#94a3b8" },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0f2f1",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#00bfa5",
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarText: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  userInfo: { flex: 1 },
  userCardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  userCardEmail: { fontSize: 13, color: "#64748b" },
  menuList: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 140,
    gap: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 16,
  },
  menuItemActive: {
    backgroundColor: "#00bfa5",
    shadowColor: "#00bfa5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItemText: { fontSize: 15, fontWeight: "500", color: "#64748b" },
  menuItemTextActive: { color: "#fff", fontWeight: "600" },
  logoutSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 16,
  },
  logoutText: { fontSize: 15, fontWeight: "500", color: "#64748b" },
});
