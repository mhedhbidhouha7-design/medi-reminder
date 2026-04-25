import React, { useEffect, useRef } from "react";
import {
    Animated,
    BackHandler,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View,
} from "react-native";
import { useTranslation } from "react-i18next";
import {
    PendingMedicationAlert,
    confirmMedicationTaken,
    snoozeMedicationAlert,
} from "../services/medicationNotificationHandler";

interface Props {
  alert: PendingMedicationAlert;
}

export const MedicationAlertScreen: React.FC<Props> = ({ alert }) => {
  const { t } = useTranslation();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Bloque le bouton retour Android — l'utilisateur ne peut pas fuir
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true, // true = empêche le retour
    );
    return () => subscription.remove();
  }, []);

  // Vibration répétée tant que l'alerte est active
  useEffect(() => {
    if (Platform.OS === "android") {
      Vibration.vibrate([0, 500, 300, 500], true);
    }
    return () => Vibration.cancel();
  }, []);

  // Animation pulsation sur l'icône
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const handleConfirm = async () => {
    Vibration.cancel();
    await confirmMedicationTaken(
      alert.medicationId,
      alert.medicationName,
      alert.dose,
    );
  };

  const handleSnooze = () => {
    Vibration.cancel();
    snoozeMedicationAlert(5);
  };

  return (
    <View style={styles.container}>
      {/* Fond rouge qui attire l'attention */}
      <View style={styles.header}>
        <Animated.Text
          style={[styles.icon, { transform: [{ scale: pulseAnim }] }]}
        >
          💊
        </Animated.Text>
        <Text style={styles.headerTitle}>{t("medication_alert.title")}</Text>
        <Text style={styles.headerTime}>{alert.scheduledTime}</Text>
      </View>

      {/* Infos médicament */}
      <View style={styles.body}>
        <Text style={styles.label}>{t("medication_alert.medication")}</Text>
        <Text style={styles.medicationName}>{alert.medicationName}</Text>

        <Text style={styles.label}>{t("medication_alert.dose")}</Text>
        <Text style={styles.dose}>{alert.dose}</Text>

        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            {t("medication_alert.instruction")}
          </Text>
        </View>
      </View>

      {/* Boutons — confirmer obligatoire */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmButtonText}>
            {t("medication_alert.confirm")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.snoozeButton}
          onPress={handleSnooze}
          activeOpacity={0.85}
        >
          <Text style={styles.snoozeButtonText}>{t("medication_alert.snooze")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1117",
  },
  header: {
    flex: 0.38,
    backgroundColor: "#C0392B",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  icon: {
    fontSize: 72,
    marginBottom: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  headerTime: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 18,
    marginTop: 6,
  },
  body: {
    flex: 0.42,
    paddingHorizontal: 32,
    paddingTop: 36,
  },
  label: {
    color: "#888",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
    marginTop: 20,
  },
  medicationName: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },
  dose: {
    color: "#E74C3C",
    fontSize: 22,
    fontWeight: "600",
  },
  warningBox: {
    marginTop: 28,
    backgroundColor: "rgba(192,57,43,0.15)",
    borderLeftWidth: 3,
    borderLeftColor: "#C0392B",
    borderRadius: 8,
    padding: 14,
  },
  warningText: {
    color: "#E57373",
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flex: 0.2,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: "flex-end",
    gap: 12,
  },
  confirmButton: {
    backgroundColor: "#27AE60",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  snoozeButton: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  snoozeButtonText: {
    color: "#aaa",
    fontSize: 15,
  },
});
