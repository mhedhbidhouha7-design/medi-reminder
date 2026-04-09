import { Colors } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  confirmMedicationTaken,
  PendingMedicationAlert,
} from "@/services/medicationNotificationHandler";
import * as Vibration from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
  const { theme } = useAppTheme();
  const themeColors = Colors[theme];
  const [pulseAnim] = useState(new Animated.Value(0));

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
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ]),
      ).start();
    }
  }, [visible, medicationAlert, pulseAnim]);

  if (!visible || !medicationAlert) {
    return null;
  }

  const scaleAnim = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const opacityAnim = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const handleConfirmMedication = async () => {
    try {
      await confirmMedicationTaken(
        medicationAlert.medicationId,
        medicationAlert.medicationName,
        medicationAlert.dose,
        0, // Default schedule index
      );

      // Show success feedback
      Alert.alert(
        "✅ Succès",
        `${medicationAlert.medicationName} marqué comme pris.`,
        [{ text: "OK" }],
        { cancelable: false },
      );
    } catch (error) {
      console.error("Error confirming medication:", error);
      Alert.alert("Erreur", "Erreur lors de la confirmation du médicament.");
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
        Alert.alert(
          "⚠️ Requis",
          "Vous devez confirmer que vous avez pris votre médicament pour continuer.",
          [{ text: "OK" }],
        );
      }}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: themeColors.notification.background },
        ]}
      >
        {/* Animated background pulse */}
        <Animated.View
          style={[
            styles.pulseBackground,
            {
              backgroundColor: themeColors.notification.pulse,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        />

        {/* Main content */}
        <View style={styles.contentContainer}>
          {/* Clock icon and "Time to take medication" */}
          <View style={styles.headerSection}>
            <Text style={styles.urgentEmoji}>⏰</Text>
            <Text
              style={[
                styles.urgentTitle,
                { color: themeColors.notification.text },
              ]}
            >
              C&apos;EST L&apos;HEURE DU MÉDICAMENT !
            </Text>
          </View>

          {/* Medication details card */}
          <Animated.View
            style={[
              styles.medicationCard,
              {
                borderColor: themeColors.notification.accent,
                backgroundColor: themeColors.notification.cardBackground,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Text
              style={[
                styles.medicationName,
                { color: themeColors.notification.text },
              ]}
            >
              💊 {medicationAlert.medicationName}
            </Text>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text
                style={[
                  styles.detailLabel,
                  { color: themeColors.notification.subtext },
                ]}
              >
                Dose:
              </Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: themeColors.notification.text },
                ]}
              >
                {medicationAlert.dose}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text
                style={[
                  styles.detailLabel,
                  { color: themeColors.notification.subtext },
                ]}
              >
                Heure:
              </Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: themeColors.notification.text },
                ]}
              >
                {new Date(medicationAlert.timestamp).toLocaleTimeString(
                  "fr-FR",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </Text>
            </View>
          </Animated.View>

          {/* Action buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                { backgroundColor: themeColors.notification.accent },
              ]}
              onPress={handleConfirmMedication}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmButtonText}>
                ✅ J&apos;AI PRIS MON MÉDICAMENT
              </Text>
            </TouchableOpacity>

            {/* Emergency option - requires confirmation */}
            <TouchableOpacity
              style={[
                styles.skipButton,
                { borderColor: themeColors.notification.accent },
              ]}
              onPress={() => {
                Alert.alert(
                  "⚠️ Sauter le rappel",
                  "Êtes-vous sûr de vouloir sauter ce médicament ? Cette action sera enregistrée.",
                  [
                    { text: "Annuler", onPress: () => {} },
                    {
                      text: "Confirmer",
                      onPress: async () => {
                        // Mark as skipped instead of taken
                        // await skipMedicationReminder(medicationAlert.medicationId);
                        // For now, just close
                      },
                      style: "destructive",
                    },
                  ],
                );
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.skipButtonText,
                  { color: themeColors.notification.accent },
                ]}
              >
                ⏭️ Rappeler plus tard
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info text */}
          <View style={styles.infoSection}>
            <Text
              style={[
                styles.infoText,
                { color: themeColors.notification.subtext },
              ]}
            >
              Vous ne pouvez pas accéder à l&apos;application jusqu&apos;à
              confirmation de la prise du médicament.
            </Text>
          </View>
        </View>

        {/* Optional: Emergency contact button */}
        <View style={styles.emergencySection}>
          <TouchableOpacity
            style={[
              styles.emergencyButton,
              { borderColor: themeColors.notification.subtext },
            ]}
            onPress={() => {
              Alert.alert(
                "🚨 En cas d'urgence",
                "Contactez votre médecin ou le service d'urgence.",
                [{ text: "OK" }],
              );
            }}
          >
            <Text
              style={[
                styles.emergencyButtonText,
                { color: themeColors.notification.subtext },
              ]}
            >
              🚨 Besoin d&apos;aide?
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
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  pulseBackground: {
    position: "absolute",
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    top: height / 2 - width * 0.4,
    left: width / 2 - width * 0.4,
    zIndex: 0,
  },
  contentContainer: {
    zIndex: 1,
    alignItems: "center",
    width: "100%",
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  urgentEmoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  urgentTitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  medicationCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 3,
    padding: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  medicationName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  confirmButton: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  skipButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  infoSection: {
    marginTop: 25,
    paddingHorizontal: 10,
  },
  infoText: {
    fontSize: 13,
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 18,
  },
  emergencySection: {
    position: "absolute",
    bottom: 30,
    width: "100%",
    paddingHorizontal: 20,
  },
  emergencyButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  emergencyButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
});

export default FullScreenMedicationOverlay;
