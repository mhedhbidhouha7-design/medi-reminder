import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function Home() {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-width)).current;

  // Sample data
  const adherenceRate = 80;

  const [medications, setMedications] = useState([
    {
      id: 1,
      name: "Doliprane",
      dosage: "1000mg",
      time: "08:00",
      taken: true,
      type: "pill",
    },
    {
      id: 2,
      name: "Amoxicilline",
      dosage: "500mg",
      time: "12:00",
      taken: false,
      type: "capsule",
    },
    {
      id: 3,
      name: "Vitamine D",
      dosage: "2000 UI",
      time: "20:00",
      taken: false,
      type: "drop",
    },
  ]);

  const nextAppointment = {
    doctor: "Dr. Ahmed Ben Salah",
    specialty: "Cardiologie appointment",
    date: "March 15",
    time: "10:30 AM",
    color: "#8b5cf6",
  };

  const menuItems = [
    {
      icon: "grid-outline",
      label: "Tableau de bord",
      route: "index",
      active: true,
    },
    { icon: "medical-outline", label: "Médicaments", route: "medications" },
    { icon: "calendar-outline", label: "Rendez-vous", route: "appointments" },
    { icon: "sparkles-outline", label: "Analyse IA", route: "ai-assistant" },
    {
      icon: "document-text-outline",
      label: "Résumé de santé",
      route: "health-summary",
    },
    { icon: "people-outline", label: "Proches", route: "family" },
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: adherenceRate,
        duration: 1500,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const toggleMenu = () => {
    if (menuVisible) {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    } else {
      setMenuVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const getIconName = (type: string) => {
    switch (type) {
      case "pill":
        return "tablet-portrait-outline";
      case "capsule":
        return "ellipse-outline";
      case "drop":
        return "water-outline";
      default:
        return "medical-outline";
    }
  };

  const getAdherenceColor = (rate: number) => {
    if (rate >= 80) return "#00bfa5";
    if (rate >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const toggleMedication = (id: number) => {
    setMedications((prev) =>
      prev.map((med) => (med.id === id ? { ...med, taken: !med.taken } : med)),
    );
  };

  const handleLogout = () => {
    toggleMenu();
    // Add logout logic here
  };

  return (
    <View style={styles.container}>
      {/* Header with Menu Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
          <Ionicons name="menu-outline" size={28} color="#1e293b" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.greetingText}>Bonjour,</Text>
          <Text style={styles.userName}>Jean Dupont</Text>
        </View>

        <TouchableOpacity style={styles.notificationButton}>
          <View style={styles.notificationBadge} />
          <Ionicons name="notifications-outline" size={24} color="#1e293b" />
        </TouchableOpacity>
      </View>

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
          {/* 1. Treatment Adherence Card */}
          <View style={styles.adherenceCard}>
            <LinearGradient
              colors={["#00bfa5", "#009688"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.adherenceGradient}
            >
              <View style={styles.adherenceHeader}>
                <View style={styles.adherenceIconContainer}>
                  <Ionicons name="stats-chart" size={28} color="#00bfa5" />
                </View>
                <Text style={styles.adherenceTitle}>
                  Adhérence au traitement
                </Text>
              </View>

              <View style={styles.adherenceContent}>
                <View style={styles.percentageContainer}>
                  <Text style={styles.percentageText}>{adherenceRate}%</Text>
                  <Text style={styles.adherenceLabel}>Cette semaine</Text>
                </View>

                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground}>
                    <Animated.View
                      style={[
                        styles.progressBarFill,
                        {
                          width: progressAnim.interpolate({
                            inputRange: [0, 100],
                            outputRange: ["0%", "100%"],
                          }),
                          backgroundColor: getAdherenceColor(adherenceRate),
                        },
                      ]}
                    />
                  </View>
                </View>

                <Text style={styles.adherenceMessage}>
                  You took 80% of your medications today. Excellent travail !
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* 2. Dashboard Section */}
          <View style={styles.dashboardSection}>
            <Text style={styles.sectionTitleLarge}>Tableau de bord</Text>
            <View style={styles.dashboardGrid}>
              {/* Medications Overview Card */}
              <TouchableOpacity style={styles.dashboardCard}>
                <View
                  style={[
                    styles.dashboardIconContainer,
                    { backgroundColor: "#e0f2f1" },
                  ]}
                >
                  <Ionicons name="medical" size={24} color="#00bfa5" />
                </View>
                <Text style={styles.dashboardValue}>3</Text>
                <Text style={styles.dashboardLabel}>
                  Médicaments{"\n"}aujourd&apos;hui
                </Text>
                <Text style={styles.dashboardSubtext}>Prochain: 12:00</Text>
              </TouchableOpacity>

              {/* Appointments Overview Card */}
              <TouchableOpacity style={styles.dashboardCard}>
                <View
                  style={[
                    styles.dashboardIconContainer,
                    { backgroundColor: "#ede9fe" },
                  ]}
                >
                  <Ionicons name="calendar" size={24} color="#8b5cf6" />
                </View>
                <Text style={styles.dashboardValue}>1</Text>
                <Text style={styles.dashboardLabel}>
                  Rendez-vous{"\n"}à venir
                </Text>
                <Text style={styles.dashboardSubtext}>
                  Aujourd&apos;hui 14:30
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. Today's Medications Section */}
          <View style={styles.medicationsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitleLarge}>Médicaments du jour</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>Voir tout</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.medicationsList}>
              {medications.map((med) => (
                <View
                  key={med.id}
                  style={[
                    styles.medicationCard,
                    med.taken && styles.medicationCardTaken,
                  ]}
                >
                  <View style={styles.medicationIconContainer}>
                    <Ionicons
                      name={getIconName(med.type) as any}
                      size={24}
                      color={med.taken ? "#94a3b8" : "#00bfa5"}
                    />
                  </View>
                  <View style={styles.medicationInfo}>
                    <Text
                      style={[
                        styles.medicationName,
                        med.taken && styles.medicationNameTaken,
                      ]}
                    >
                      {med.name}
                    </Text>
                    <Text style={styles.medicationDosage}>{med.dosage}</Text>
                    <View style={styles.medicationTimeContainer}>
                      <Ionicons name="time-outline" size={12} color="#64748b" />
                      <Text style={styles.medicationTime}>{med.time}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.checkButton,
                      med.taken && styles.checkButtonTaken,
                    ]}
                    onPress={() => toggleMedication(med.id)}
                  >
                    <Ionicons
                      name={med.taken ? "checkmark-circle" : "ellipse-outline"}
                      size={28}
                      color={med.taken ? "#00bfa5" : "#cbd5e1"}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.nextMedAlert}>
              <Ionicons name="information-circle" size={16} color="#00bfa5" />
              <Text style={styles.nextMedText}>Next medication in 2 hours</Text>
            </View>
          </View>

          {/* 4. Upcoming Appointments Section */}
          <View style={styles.appointmentSection}>
            <Text style={styles.sectionTitleLarge}>Prochain rendez-vous</Text>

            <TouchableOpacity style={styles.appointmentCardLarge}>
              <LinearGradient
                colors={[nextAppointment.color, nextAppointment.color + "DD"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.appointmentGradientLarge}
              >
                <View style={styles.appointmentIconContainerLarge}>
                  <Ionicons name="calendar" size={32} color="#fff" />
                </View>
                <Text style={styles.appointmentDoctor}>
                  {nextAppointment.doctor}
                </Text>
                <Text style={styles.appointmentSpecialty}>
                  {nextAppointment.specialty}
                </Text>

                <View style={styles.appointmentDateContainer}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color="rgba(255,255,255,0.9)"
                  />
                  <Text style={styles.appointmentDateText}>
                    {nextAppointment.date} - {nextAppointment.time}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Bottom Spacing for Tab Bar */}
          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>

      {/* MediCare Style Menu Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={menuVisible}
        onRequestClose={toggleMenu}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.overlay} onPress={toggleMenu} />
          <Animated.View
            style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}
          >
            {/* App Logo Header */}
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

            {/* User Info Card */}
            <View style={styles.userCard}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>JD</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userCardName}>Jean Dupont</Text>
                <Text style={styles.userCardEmail}>jean.dupont@email.com</Text>
              </View>
            </View>

            {/* Language Selector */}
            <TouchableOpacity style={styles.languageSelector}>
              <Ionicons name="globe-outline" size={20} color="#64748b" />
              <Text style={styles.languageText}>FR Français</Text>
              <Ionicons name="chevron-down" size={16} color="#94a3b8" />
            </TouchableOpacity>

            {/* Menu Items */}
            <View style={styles.menuList}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.menuItem,
                    item.active && styles.menuItemActive,
                  ]}
                  onPress={() => {
                    toggleMenu();
                    // navigation.navigate(item.route);
                  }}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={item.active ? "#fff" : "#64748b"}
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      item.active && styles.menuItemTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Logout */}
            <View style={styles.logoutSection}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={22} color="#64748b" />
                <Text style={styles.logoutText}>Déconnexion</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Modern Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#f8fafc",
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  greetingText: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },

  // 1. Treatment Adherence Card
  adherenceCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#00bfa5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  adherenceGradient: {
    padding: 24,
  },
  adherenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  adherenceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  adherenceTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  adherenceContent: {
    alignItems: "center",
  },
  percentageContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  percentageText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
  },
  adherenceLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  progressBarContainer: {
    width: "100%",
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 6,
  },
  adherenceMessage: {
    fontSize: 14,
    color: "rgba(255,255,255,0.95)",
    textAlign: "center",
    lineHeight: 20,
  },

  // 2. Dashboard Section
  dashboardSection: {
    marginBottom: 24,
  },
  sectionTitleLarge: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
  },
  dashboardGrid: {
    flexDirection: "row",
    gap: 12,
  },
  dashboardCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dashboardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  dashboardValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  dashboardLabel: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
    marginBottom: 8,
  },
  dashboardSubtext: {
    fontSize: 12,
    color: "#00bfa5",
    fontWeight: "600",
  },

  // 3. Today's Medications Section
  medicationsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: "#00bfa5",
    fontWeight: "600",
  },
  medicationsList: {
    gap: 12,
  },
  medicationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#00bfa5",
  },
  medicationCardTaken: {
    borderLeftColor: "#cbd5e1",
    opacity: 0.7,
  },
  medicationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  medicationNameTaken: {
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },
  medicationDosage: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 6,
  },
  medicationTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  medicationTime: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  checkButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  checkButtonTaken: {
    backgroundColor: "#e0f2f1",
  },
  nextMedAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0f2f1",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  nextMedText: {
    fontSize: 13,
    color: "#00bfa5",
    fontWeight: "500",
  },

  // 4. Upcoming Appointments Section
  appointmentSection: {
    marginBottom: 24,
  },
  appointmentCardLarge: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  appointmentGradientLarge: {
    padding: 20,
    alignItems: "center",
  },
  appointmentIconContainerLarge: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  appointmentDoctor: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  appointmentSpecialty: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 12,
  },
  appointmentDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  appointmentDateText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },

  // MediCare Style Menu
  modalOverlay: {
    flex: 1,
    flexDirection: "row",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
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
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#00bfa5",
    justifyContent: "center",
    alignItems: "center",
  },
  logoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  logoSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
  },
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
  userAvatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  userInfo: {
    flex: 1,
  },
  userCardName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  userCardEmail: {
    fontSize: 13,
    color: "#64748b",
  },
  languageSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    gap: 8,
  },
  languageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#1e293b",
    textAlign: "center",
  },
  menuList: {
    marginTop: 20,
    paddingHorizontal: 16,
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
  menuItemText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#64748b",
  },
  menuItemTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
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
  logoutText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#64748b",
  },
});
