import {
  listenToAppointments,
  toggleAppointmentDone,
} from "@/controllers/appointmentController";
import {
  listenToMedications,
  toggleMedicationDose,
} from "@/controllers/medicationController";
import { auth } from "@/firebaseConfig";
import { Appointment, Medication } from "@/models/interfaces";
import { cancelAllNotifications, scheduleMedicationReminders, scheduleAppointmentReminders, testNotifications } from "@/services/notificationService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRouter } from "expo-router";
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
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const hasScheduledNotifs = useRef(false);

  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [adherenceRate, setAdherenceRate] = useState(0);
  const [stats, setStats] = useState({
    totalToday: 0,
    takenToday: 0,
    missedToday: 0,
    remainingToday: 0,
    nextMedTime: "",
  });

  const menuItems = [
    {
      icon: "grid-outline",
      label: "Tableau de bord",
      route: "index",
      active: true,
    },
    {
      icon: "medical-outline",
      label: "Médicaments",
      route: "medications",
      active: false,
    },
    {
      icon: "calendar-outline",
      label: "Rendez-vous",
      route: "rdv",
      active: false,
    },
    {
      icon: "sparkles-outline",
      label: "Analyse IA",
      route: "IA",
      active: false,
    },
    {
      icon: "person-outline",
      label: "Profil",
      route: "profile",
      active: false,
    },
  ];

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const unsubscribe = listenToMedications(userId, async (fetchedMeds) => {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const activeMeds = fetchedMeds.filter((med) => {
        if (!med.startDate || !med.endDate) return true;
        return todayStr >= med.startDate && todayStr <= med.endDate;
      });
      setMedications(activeMeds);
      calculateStats(activeMeds);
      setLoading(false);

      // Only schedule notifications on FIRST load (app startup)
      // addMedication already handles scheduling for newly added meds
      if (!hasScheduledNotifs.current) {
        hasScheduledNotifs.current = true;
        await cancelAllNotifications();
        for (const med of activeMeds) {
          try {
            await scheduleMedicationReminders(med);
          } catch (e) {
            console.log('Error scheduling med notification:', e);
          }
        }
        console.log(`[INIT] Scheduled notifications for ${activeMeds.length} medications`);
      }
    });

    const unsubAppt = listenToAppointments(userId, async (fetched) => {
      setAppointments(fetched);

      // Appointment reminders are also only scheduled on first load
      if (hasScheduledNotifs.current) {
        for (const appt of fetched) {
          if (!appt.done) {
            try {
              await scheduleAppointmentReminders(appt);
            } catch (e) {
              console.log('Error scheduling appt notification:', e);
            }
          }
        }
      }
    });

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
    ]).start();

    return () => {
      unsubscribe();
      unsubAppt();
    };
  }, [userId]);

  const calculateStats = (activeMeds: Medication[]) => {
    let totalExpected = 0;
    let totalTaken = 0;
    let totalMissed = 0;
    let remainingToday = 0;
    let nextTime = "";

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

    activeMeds.forEach((med) => {
      if (!med.startDate || !med.endDate) return;
      const start = new Date(med.startDate);
      const today = new Date(todayStr);
      let currentLoopDate = new Date(start.getTime());

      while (currentLoopDate <= today) {
        const loopDateStr = currentLoopDate.toISOString().split("T")[0];
        const isToday = loopDateStr === todayStr;
        const logs = med.takenLogs?.[loopDateStr] || {};

        med.schedules.forEach((schedule, idx) => {
          const isTaken = !!logs[idx];
          const scheduleTimeMinutes = parseTimeToMinutes(schedule.time);

          if (loopDateStr < todayStr) {
            totalExpected++;
            if (isTaken) totalTaken++;
            else totalMissed++;
          } else if (isToday) {
            totalExpected++;
            if (isTaken) {
              totalTaken++;
            } else if (currentTimeMinutes > scheduleTimeMinutes) {
              totalMissed++;
            } else {
              remainingToday++;
              if (
                !nextTime ||
                scheduleTimeMinutes < parseTimeToMinutes(nextTime)
              ) {
                nextTime = schedule.time;
              }
            }
          }
        });
        currentLoopDate.setDate(currentLoopDate.getDate() + 1);
      }
    });

    const rate =
      totalExpected > 0 ? Math.round((totalTaken / totalExpected) * 100) : 0;
    setAdherenceRate(rate);
    setStats({
      totalToday: totalExpected,
      takenToday: totalTaken,
      missedToday: totalMissed,
      remainingToday,
      nextMedTime: nextTime,
    });
    Animated.timing(progressAnim, {
      toValue: rate,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  };

  const parseTimeToMinutes = (timeStr: string) => {
    const match = timeStr.match(/(\d{1,2})[:h](\d{0,2})/);
    if (!match) return 9999;
    return parseInt(match[1]) * 60 + parseInt(match[2] || "0");
  };

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

  const getAdherenceColor = (rate: number) => {
    if (rate >= 80) return "#00bfa5";
    if (rate >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const toggleMedication = async (medId: string, scheduleIndex: number) => {
    if (!userId) return;
    const med = medications.find((m) => m.id === medId);
    if (!med) return;
    const todayStr = new Date().toISOString().split("T")[0];
    try {
      await toggleMedicationDose(userId, med, scheduleIndex, todayStr);
    } catch (error) {
      console.error("Error toggling medication:", error);
    }
  };

  const handleLogout = () => toggleMenu();

  // ── Calculs RDV avec date ET heure ──────────────────────────────────
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // RDV du jour (date = aujourd'hui) non cochés, triés par heure
  const todayRdv = appointments
    .filter((a) => !a.done && a.date === todayStr)
    .sort((a, b) => {
      const tA = new Date(`${a.date}T${a.time}`).getTime();
      const tB = new Date(`${b.date}T${b.time}`).getTime();
      return tA - tB;
    });

  // Compte RDV du jour non cochés (pour dashboard)
  const todayRdvCount = todayRdv.length;

  // Prochain RDV = le plus proche non coché avec date+heure >= maintenant
  const next =
    appointments
      .filter((a) => !a.done && new Date(`${a.date}T${a.time}`) >= now)
      .sort((a, b) => {
        const tA = new Date(`${a.date}T${a.time}`).getTime();
        const tB = new Date(`${b.date}T${b.time}`).getTime();
        return tA - tB;
      })[0] ?? null;

  // RDV du jour passés (même jour mais heure dépassée) — pour alerte
  const missedTodayRdv = appointments.filter(
    (a) =>
      !a.done && a.date === todayStr && new Date(`${a.date}T${a.time}`) < now,
  );

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
          <Ionicons name="menu-outline" size={28} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.greetingText}>Bonjour,</Text>
          <Text style={styles.userName}>Jean Dupont</Text>
          <Text style={styles.currentDateDisplay}>
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
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
          {/* ── 1. Adhérence ── */}
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
                  {stats.takenToday} prises,{" "}
                  {stats.missedToday > 0
                    ? `${stats.missedToday} manquées, `
                    : ""}
                  {stats.remainingToday} à venir sur {stats.totalToday}{" "}
                  aujourd&apos;hui.
                  {adherenceRate >= 80
                    ? "\nExcellent travail !"
                    : "\nN'oubliez pas vos soins !"}
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* ── 2. Dashboard ── */}
          <View style={styles.dashboardSection}>
            <Text style={styles.sectionTitleLarge}>Tableau de bord</Text>
            <View style={styles.dashboardGrid}>
              {/* Card Médicaments */}
              <TouchableOpacity
                style={styles.dashboardCard}
                onPress={() => router.push("/medications")}
              >
                <View
                  style={[
                    styles.dashboardIconContainer,
                    { backgroundColor: "#e0f2f1" },
                  ]}
                >
                  <Ionicons name="medical" size={24} color="#00bfa5" />
                </View>
                <Text style={styles.dashboardValue}>{stats.totalToday}</Text>
                <Text style={styles.dashboardLabel}>
                  Doses totales{"\n"}depuis le début
                </Text>
                <Text style={styles.dashboardSubtext}>
                  {stats.nextMedTime
                    ? `Prochain: ${stats.nextMedTime}`
                    : "Terminé !"}
                </Text>
              </TouchableOpacity>

              {/* Card RDV — nombre RDV du jour restants non cochés */}
              <TouchableOpacity
                style={styles.dashboardCard}
                onPress={() => router.push("/rdv")}
              >
                <View
                  style={[
                    styles.dashboardIconContainer,
                    { backgroundColor: "#ede9fe" },
                  ]}
                >
                  <Ionicons name="calendar" size={24} color="#8b5cf6" />
                </View>
                <Text style={styles.dashboardValue}>{todayRdvCount}</Text>
                <Text style={styles.dashboardLabel}>
                  Rendez-vous d&apos;{"\n"}aujourd&apos;hui
                </Text>
                <Text style={[styles.dashboardSubtext, { color: "#8b5cf6" }]}>
                  {next
                    ? next.date === todayStr
                      ? `Prochain : ${next.time}`
                      : `Prochain : ${new Date(next.date + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
                    : "Aucun à venir"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── 3. Médicaments du jour ── */}
          <View style={styles.medicationsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitleLarge}>Médicaments du jour</Text>
              <TouchableOpacity onPress={() => router.push("/medications")}>
                <Text style={styles.seeAllText}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.medicationsList}>
              {medications.map((med) =>
                med.schedules.map((schedule, idx) => {
                  const nowLocal = new Date();
                  const todayStrLocal = nowLocal.toISOString().split("T")[0];
                  const currentTimeMinutes =
                    nowLocal.getHours() * 60 + nowLocal.getMinutes();
                  const scheduleTimeMinutes = parseTimeToMinutes(schedule.time);
                  const logs = med.takenLogs?.[todayStrLocal] || {};
                  const isTaken = !!logs[idx];
                  const isMissed =
                    !isTaken && currentTimeMinutes > scheduleTimeMinutes;

                  return (
                    <View
                      key={`${med.id}-${idx}`}
                      style={[
                        styles.medicationCard,
                        isTaken && styles.medicationCardTaken,
                        isMissed && styles.medicationCardMissed,
                      ]}
                    >
                      <View style={styles.medicationIconContainer}>
                        <Ionicons
                          name="medical-outline"
                          size={24}
                          color={
                            isTaken
                              ? "#94a3b8"
                              : isMissed
                                ? "#ef4444"
                                : "#00bfa5"
                          }
                        />
                      </View>
                      <View style={styles.medicationInfo}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Text
                            style={[
                              styles.medicationName,
                              isTaken && styles.medicationNameTaken,
                              isMissed && { color: "#ef4444" },
                            ]}
                          >
                            {med.name}
                          </Text>
                          {isMissed && (
                            <View style={styles.missedBadge}>
                              <Text style={styles.missedBadgeText}>Manqué</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.medicationDosage}>
                          {schedule.dose}
                        </Text>
                        {med.startDate && med.endDate && (
                          <Text style={styles.medicationDateRange}>
                            {med.startDate}
                          </Text>
                        )}
                        <View style={styles.medicationTimeContainer}>
                          <Ionicons
                            name="time-outline"
                            size={12}
                            color={isMissed ? "#ef4444" : "#64748b"}
                          />
                          <Text
                            style={[
                              styles.medicationTime,
                              isMissed && { color: "#ef4444" },
                            ]}
                          >
                            {schedule.time}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.checkButton,
                          isTaken && styles.checkButtonTaken,
                          isMissed && { backgroundColor: "#fee2e2" },
                        ]}
                        onPress={() => toggleMedication(med.id, idx)}
                      >
                        <Ionicons
                          name={
                            isTaken ? "checkmark-circle" : "ellipse-outline"
                          }
                          size={28}
                          color={
                            isTaken
                              ? "#00bfa5"
                              : isMissed
                                ? "#ef4444"
                                : "#cbd5e1"
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  );
                }),
              )}
            </View>
            <View
              style={[
                styles.nextMedAlert,
                stats.missedToday > 0 && { backgroundColor: "#fee2e2" },
              ]}
            >
              <Ionicons
                name={
                  stats.missedToday > 0 ? "alert-circle" : "information-circle"
                }
                size={16}
                color={stats.missedToday > 0 ? "#ef4444" : "#00bfa5"}
              />
              <Text
                style={[
                  styles.nextMedText,
                  stats.missedToday > 0 && { color: "#ef4444" },
                ]}
              >
                {stats.missedToday > 0
                  ? `Attention : ${stats.missedToday} doses manquées !`
                  : stats.remainingToday > 0
                    ? `${stats.remainingToday} doses restantes pour aujourd'hui`
                    : "Toutes les doses sont prises !"}
              </Text>
            </View>
          </View>

          {/* ── 3b. RDV du jour ── toujours affiché ── */}
          <View style={styles.medicationsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitleLarge}>RDV du jour</Text>
              <TouchableOpacity onPress={() => router.push("/rdv")}>
                <Text style={[styles.seeAllText, { color: "#8b5cf6" }]}>
                  Voir tout
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.medicationsList}>
              {todayRdv.length > 0 ? (
                todayRdv.map((appt) => {
                  const apptTime = new Date(`${appt.date}T${appt.time}`);
                  const isPast = apptTime < now;
                  return (
                    <View
                      key={appt.id}
                      style={[
                        styles.medicationCard,
                        { borderLeftColor: isPast ? "#f59e0b" : "#8b5cf6" },
                        isPast && { backgroundColor: "#fffbeb" },
                      ]}
                    >
                      <View
                        style={[
                          styles.medicationIconContainer,
                          { backgroundColor: isPast ? "#fef3c7" : "#ede9fe" },
                        ]}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={24}
                          color={isPast ? "#f59e0b" : "#8b5cf6"}
                        />
                      </View>
                      <View style={styles.medicationInfo}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Text style={styles.medicationName}>
                            {appt.title}
                          </Text>
                          {isPast && (
                            <View
                              style={[
                                styles.missedBadge,
                                { backgroundColor: "#f59e0b" },
                              ]}
                            >
                              <Text style={styles.missedBadgeText}>
                                En attente
                              </Text>
                            </View>
                          )}
                        </View>
                        {!!appt.doctor && (
                          <Text style={styles.medicationDosage}>
                            {appt.doctor}
                          </Text>
                        )}
                        {!!appt.location && (
                          <Text
                            style={styles.medicationDateRange}
                            numberOfLines={1}
                          >
                            {appt.location}
                          </Text>
                        )}
                        <View style={styles.medicationTimeContainer}>
                          <Ionicons
                            name="time-outline"
                            size={12}
                            color={isPast ? "#f59e0b" : "#64748b"}
                          />
                          <Text
                            style={[
                              styles.medicationTime,
                              isPast && { color: "#f59e0b" },
                            ]}
                          >
                            {appt.time}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.checkButton,
                          isPast && { backgroundColor: "#fef3c7" },
                        ]}
                        onPress={async () => {
                          if (!userId) return;
                          await toggleAppointmentDone(userId, appt);
                        }}
                      >
                        <Ionicons
                          name="ellipse-outline"
                          size={28}
                          color={isPast ? "#f59e0b" : "#8b5cf6"}
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })
              ) : (
                /* État vide — violet comme les médicaments sont en vert */
                <View style={styles.rdvEmptyAlert}>
                  <Ionicons name="checkmark-circle" size={16} color="#8b5cf6" />
                  <Text style={styles.rdvEmptyText}>
                    Tous les RDV du jour sont terminés !
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Test Notifications Button (dev only) ── */}
          <TouchableOpacity
            style={{
              backgroundColor: "#ec4899",
              paddingVertical: 14,
              paddingHorizontal: 24,
              borderRadius: 16,
              alignItems: "center",
              marginTop: 16,
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
            onPress={async () => {
              await testNotifications();
              alert("3 notifications programmées !\n\n⏰ dans 5s\n⚠️ dans 10s\n💊 dans 15s (avec son)");
            }}
          >
            <Ionicons name="notifications" size={20} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
              Tester les notifications
            </Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>

      {/* ── Menu Sidebar ── */}
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
            <View style={styles.userCard}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>JD</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userCardName}>Jean Dupont</Text>
                <Text style={styles.userCardEmail}>jean.dupont@email.com</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.languageSelector}>
              <Ionicons name="globe-outline" size={20} color="#64748b" />
              <Text style={styles.languageText}>FR Français</Text>
              <Ionicons name="chevron-down" size={16} color="#94a3b8" />
            </TouchableOpacity>
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
                    if (item.route) {
                      const path =
                        item.route === "index" ? "/home" : `/${item.route}`;
                      router.push(path as any);
                    }
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
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { flexGrow: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#f8fafc",
  },
  headerCenter: { flex: 1, marginLeft: 16 },
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
  greetingText: { fontSize: 14, color: "#64748b", marginBottom: 2 },
  userName: { fontSize: 20, fontWeight: "bold", color: "#1e293b" },
  currentDateDisplay: {
    fontSize: 14,
    color: "#64748b",
    textTransform: "capitalize",
    fontWeight: "500",
    marginTop: 4,
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
  adherenceGradient: { padding: 24 },
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
  adherenceTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  adherenceContent: { alignItems: "center" },
  percentageContainer: { alignItems: "center", marginBottom: 16 },
  percentageText: { fontSize: 48, fontWeight: "bold", color: "#fff" },
  adherenceLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  progressBarContainer: { width: "100%", marginBottom: 16 },
  progressBarBackground: {
    height: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 6 },
  adherenceMessage: {
    fontSize: 14,
    color: "rgba(255,255,255,0.95)",
    textAlign: "center",
    lineHeight: 20,
  },
  dashboardSection: { marginBottom: 24 },
  sectionTitleLarge: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
  },
  dashboardGrid: { flexDirection: "row", gap: 12 },
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
  dashboardSubtext: { fontSize: 12, color: "#00bfa5", fontWeight: "600" },
  medicationsSection: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seeAllText: { fontSize: 14, color: "#00bfa5", fontWeight: "600" },
  medicationsList: { gap: 12 },
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
  medicationCardTaken: { borderLeftColor: "#cbd5e1", opacity: 0.7 },
  medicationCardMissed: {
    borderLeftColor: "#ef4444",
    backgroundColor: "#fff5f5",
  },
  missedBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  missedBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
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
  medicationInfo: { flex: 1 },
  medicationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  medicationNameTaken: { color: "#94a3b8", textDecorationLine: "line-through" },
  medicationDosage: { fontSize: 13, color: "#64748b", marginBottom: 2 },
  medicationDateRange: { fontSize: 11, color: "#94a3b8", marginBottom: 6 },
  medicationTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  medicationTime: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  checkButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  checkButtonTaken: { backgroundColor: "#e0f2f1" },
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
  nextMedText: { fontSize: 13, color: "#00bfa5", fontWeight: "500" },
  rdvEmptyAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ede9fe",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  rdvEmptyText: { fontSize: 13, color: "#8b5cf6", fontWeight: "500" },
  appointmentSection: { marginBottom: 24 },
  appointmentCardLarge: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  appointmentGradientLarge: { padding: 20, alignItems: "center" },
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
  appointmentDateText: { fontSize: 14, color: "rgba(255,255,255,0.9)" },
  modalOverlay: { flex: 1, flexDirection: "row" },
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
  menuList: { marginTop: 20, paddingHorizontal: 16, gap: 8 },
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
