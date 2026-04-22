import { Colors } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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

// ── Types ────────────────────────────────────────────────────────────
export type AlertType = "success" | "error" | "warning" | "info" | "confirm";

export interface AlertButton {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

interface AlertConfig {
  type: AlertType;
  title: string;
  message: string;
  buttons?: AlertButton[];
}

interface AlertContextType {
  showAlert: (
    title: string,
    message: string,
    buttons?: AlertButton[],
    type?: AlertType,
  ) => void;
  showSuccess: (title: string, message: string, onDismiss?: () => void) => void;
  showError: (title: string, message: string) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    cancelText?: string,
  ) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

// ── Icon & color config per type ─────────────────────────────────────
const alertConfig: Record<
  AlertType,
  {
    icon: keyof typeof Ionicons.glyphMap;
    lightAccent: string;
    darkAccent: string;
  }
> = {
  success: {
    icon: "checkmark-circle",
    lightAccent: "#10b981",
    darkAccent: "#34d399",
  },
  error: {
    icon: "alert-circle",
    lightAccent: "#ef4444",
    darkAccent: "#f87171",
  },
  warning: {
    icon: "warning",
    lightAccent: "#f59e0b",
    darkAccent: "#fbbf24",
  },
  info: {
    icon: "information-circle",
    lightAccent: "#3b82f6",
    darkAccent: "#60a5fa",
  },
  confirm: {
    icon: "help-circle",
    lightAccent: "#8b5cf6",
    darkAccent: "#a78bfa",
  },
};

// ── Alert Modal Component ────────────────────────────────────────────
function ThemedAlertModal({
  visible,
  config,
  onDismiss,
}: {
  visible: boolean;
  config: AlertConfig | null;
  onDismiss: () => void;
}) {
  const { theme, isDark } = useAppTheme();
  const themeColors = Colors[theme];
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible, scaleAnim, fadeAnim]);

  if (!config) return null;

  const typeConfig = alertConfig[config.type];
  const accentColor = isDark ? typeConfig.darkAccent : typeConfig.lightAccent;
  const buttons = config.buttons || [{ text: "OK", style: "default" as const }];

  const handlePress = (button: AlertButton) => {
    // Animate out then execute
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
      button.onPress?.();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => handlePress(buttons[0])}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={styles.overlayPress} onPress={() => {
          // Only auto-dismiss if there's a single OK/cancel button
          if (buttons.length === 1) handlePress(buttons[0]);
        }}>
          <Animated.View
            style={[
              styles.alertContainer,
              {
                backgroundColor: themeColors.card,
                transform: [{ scale: scaleAnim }],
                shadowColor: accentColor,
              },
            ]}
          >
            {/* Accent strip at top */}
            <View style={[styles.accentStrip, { backgroundColor: accentColor }]} />

            {/* Icon */}
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: accentColor + "18" },
              ]}
            >
              <Ionicons name={typeConfig.icon} size={36} color={accentColor} />
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: themeColors.text }]}>
              {config.title}
            </Text>

            {/* Message */}
            <Text style={[styles.message, { color: themeColors.icon }]}>
              {config.message}
            </Text>

            {/* Buttons */}
            <View
              style={[
                styles.buttonRow,
                buttons.length === 1 && styles.buttonRowSingle,
              ]}
            >
              {buttons.map((button, index) => {
                const isDestructive = button.style === "destructive";
                const isCancel = button.style === "cancel";
                const isPrimary =
                  !isCancel && !isDestructive && index === buttons.length - 1;

                let btnBg = "transparent";
                let btnTextColor = themeColors.text;
                let btnBorder = themeColors.tabIconDefault;

                if (isPrimary) {
                  btnBg = accentColor;
                  btnTextColor = "#fff";
                  btnBorder = accentColor;
                } else if (isDestructive) {
                  btnBg = "#ef444420";
                  btnTextColor = "#ef4444";
                  btnBorder = "#ef444440";
                } else if (isCancel) {
                  btnBg = isDark ? themeColors.background : themeColors.card;
                  btnTextColor = themeColors.icon;
                  btnBorder = themeColors.tabIconDefault;
                }

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      {
                        backgroundColor: btnBg,
                        borderColor: btnBorder,
                        flex: buttons.length > 1 ? 1 : undefined,
                        minWidth: buttons.length === 1 ? 140 : undefined,
                      },
                    ]}
                    onPress={() => handlePress(button)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        {
                          color: btnTextColor,
                          fontWeight: isPrimary || isDestructive ? "700" : "600",
                        },
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

// ── Provider ─────────────────────────────────────────────────────────
export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig | null>(null);

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      buttons?: AlertButton[],
      type: AlertType = "info",
    ) => {
      setConfig({ type, title, message, buttons });
      setVisible(true);
    },
    [],
  );

  const showSuccess = useCallback(
    (title: string, message: string, onDismiss?: () => void) => {
      setConfig({
        type: "success",
        title,
        message,
        buttons: [{ text: "OK", onPress: onDismiss }],
      });
      setVisible(true);
    },
    [],
  );

  const showError = useCallback((title: string, message: string) => {
    setConfig({
      type: "error",
      title,
      message,
      buttons: [{ text: "OK" }],
    });
    setVisible(true);
  }, []);

  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      confirmText = "Confirmer",
      cancelText = "Annuler",
    ) => {
      setConfig({
        type: "confirm",
        title,
        message,
        buttons: [
          { text: cancelText, style: "cancel" },
          { text: confirmText, style: "default", onPress: onConfirm },
        ],
      });
      setVisible(true);
    },
    [],
  );

  return (
    <AlertContext.Provider
      value={{ showAlert, showSuccess, showError, showConfirm }}
    >
      {children}
      <ThemedAlertModal
        visible={visible}
        config={config}
        onDismiss={() => setVisible(false)}
      />
    </AlertContext.Provider>
  );
};

// ── Hook ─────────────────────────────────────────────────────────────
export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};

// ── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayPress: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  alertContainer: {
    width: width * 0.85,
    maxWidth: 380,
    borderRadius: 24,
    paddingTop: 0,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: "center",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  accentStrip: {
    width: "100%",
    height: 4,
    marginBottom: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  buttonRowSingle: {
    justifyContent: "center",
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  buttonText: {
    fontSize: 15,
  },
});
