import { useAlert } from "@/components/ThemedAlert";
import {
    confirmMedicationTaken,
    PendingMedicationAlert,
} from "@/services/medicationNotificationHandler";
import * as Vibration from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const { width, height } = Dimensions.get("window");

interface FullScreenMedicationOverlayProps {
  visible: boolean;
  medicationAlert: PendingMedicationAlert | null;
}

/**
 * Full-screen modal that appears when it's time to take medication.
 * - Blocks all app interaction until medication is confirmed as taken
 * - Displays clear medication information
 * - Includes sound and haptic feedback
 * - Shows urgent full-screen notification
 */
export const FullScreenMedicationOverlay: React.FC<
  FullScreenMedicationOverlayProps
> = ({ visible, medicationAlert }) => {
  const { showError, showSuccess, showAlert } = useAlert();
  const [pulseAnim] = useState(new Animated.Value(1));

  // Pulse animation for the medication info box
  useEffect(() => {
    if (visible && medicationAlert) {
      // Trigger haptic feedback
      try {
        Vibration.notificationAsync(Vibration.NotificationFeedbackType.Warning);
      } catch {
        console.log("Haptic feedback not available");
      }

      // Start pulsing animation
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
    }
  }, [visible, medicationAlert, pulseAnim]);

  if (!visible || !medicationAlert) {
    return null;
  }

  const handleConfirmMedication = async () => {
    try {
      await confirmMedicationTaken(
        medicationAlert.medicationId,
        medicationAlert.medicationName,
        medicationAlert.dose,
        0, // Default schedule index
      );

      // Show success feedback
      showSuccess(
        "✅ Succès",
        `${medicationAlert.medicationName} marqué comme pris.`
      );
    } catch (error) {
      console.error("Error confirming medication:", error);
      showError("Erreur", "Erreur lors de la confirmation du médicament.");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      hardwareAccelerated={true}
      onRequestClose={() => {
        // Prevent back button from closing the modal
        showAlert(
          "⚠️ Requis",
          "Vous devez confirmer que vous avez pris votre médicament pour continuer.",
          undefined,
          "warning"
        );
      }}
    >
      <View style={styles.container}>
        {/* En-tête avec animation */}
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.iconContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Text style={styles.icon}>💊</Text>
          </Animated.View>
          <Text style={styles.headerTitle}>C'EST L'HEURE DU MÉDICAMENT !</Text>
          <Text style={styles.headerTime}>
            {new Date(medicationAlert.timestamp).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        {/* Carte d'information du médicament */}
        <View style={styles.body}>
          <Animated.View
            style={[styles.infoCard, { transform: [{ scale: pulseAnim }] }]}
          >
            <View style={styles.infoRow}>
              <Text style={styles.label}>Médicament</Text>
              <Text style={styles.medicationName}>
                {medicationAlert.medicationName}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>Dose</Text>
              <Text style={styles.dose}>{medicationAlert.dose}</Text>
            </View>
          </Animated.View>

          <View style={styles.warningBox}>
            <View style={styles.warningIconContainer}>
              <Text style={styles.warningIcon}>⚠️</Text>
            </View>
            <Text style={styles.warningText}>
              Veuillez prendre votre médicament maintenant pour maintenir
              l'efficacité de votre traitement.
            </Text>
          </View>
        </View>

        {/* Bouton de confirmation unique */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmMedication}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmButtonText}>
              ✓ J'AI PRIS MON MÉDICAMENT
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#1971C2",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingBottom: 50,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: "#1971C2",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  icon: {
    fontSize: 56,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  headerTime: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 20,
    fontWeight: "600",
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 20,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 24,
  },
  infoRow: {
    paddingVertical: 8,
  },
  label: {
    color: "#868E96",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  medicationName: {
    color: "#212529",
    fontSize: 26,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#E9ECEF",
    marginVertical: 16,
  },
  dose: {
    color: "#1971C2",
    fontSize: 24,
    fontWeight: "700",
  },
  warningBox: {
    backgroundColor: "#FFF9DB",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#FFE066",
  },
  warningIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  warningIcon: {
    fontSize: 24,
  },
  warningText: {
    flex: 1,
    color: "#495057",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 30,
    paddingTop: 12,
  },
  confirmButton: {
    backgroundColor: "#27AE60",
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#27AE60",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default FullScreenMedicationOverlay;
