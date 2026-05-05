import { Colors } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { get, ref } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { auth, db } from "../firebaseConfig";

export default function SplashScreen() {
  const { theme } = useAppTheme();
  const themeColors = Colors[theme];
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // Logo animations
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;
  const logoY = useRef(new Animated.Value(0)).current;

  // Text animations
  const fadeTitle = useRef(new Animated.Value(0)).current;
  const fadeSubtitle = useRef(new Animated.Value(0)).current;
  const slideTitleY = useRef(new Animated.Value(30)).current;

  // Accent animations
  const pillOpacity = useRef(new Animated.Value(0)).current;
  const appointmentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance and pulse animation
    Animated.sequence([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoPulse, {
            toValue: 1.08,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(logoPulse, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start();

    // Subtle floating animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoY, {
          toValue: -10,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoY, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Text cascade animations
    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(fadeTitle, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideTitleY, {
          toValue: 0,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(fadeSubtitle, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(pillOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(appointmentOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Check auth state after animation completes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("SplashScreen: Auth state changed, user:", user?.uid);

      // Stop any existing timeout to avoid conflicting redirects
      if ((global as any).authRedirectTimeout) {
        clearTimeout((global as any).authRedirectTimeout);
      }

      (global as any).authRedirectTimeout = setTimeout(async () => {
        if (user) {
          try {
            const snapshot = await get(ref(db, `users/${user.uid}`));
            if (snapshot.exists()) {
              const userData = snapshot.val();
              if (userData.active === false || userData.activate === false) {
                console.log("SplashScreen: User is disabled, redirecting to /disabled");
                router.replace("/disabled");
                return;
              }
            }
            console.log("SplashScreen: Redirecting to /home");
            router.replace("/home");
          } catch (error) {
            console.error("SplashScreen: Error checking status:", error);
            router.replace("/home");
          }
        } else {
          console.log("SplashScreen: Redirecting to /signin");
          router.replace("/signin");
        }
      }, 3500);
    });

    return () => {
      unsubscribe();
      if ((global as any).authRedirectTimeout) {
        clearTimeout((global as any).authRedirectTimeout);
      }
    };
  }, [router]);

  return (
    <LinearGradient
      colors={[themeColors.background, themeColors.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Decorative gradient circle background */}
      <View style={styles.backgroundDecor}>
        <LinearGradient
          colors={["rgba(14, 165, 233, 0.08)", "rgba(6, 182, 212, 0.04)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientCircle}
        />
      </View>

      {/* Main logo section */}
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            transform: [
              { scale: Animated.multiply(logoScale, logoPulse) },
              { translateY: logoY },
            ],
          },
        ]}
      >
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Title section */}
      <Animated.View
        style={[
          styles.titleSection,
          {
            opacity: fadeTitle,
            transform: [{ translateY: slideTitleY }],
          },
        ]}
      >
        <Text style={styles.title}>MediReminder</Text>
        <View style={styles.titleUnderline} />
      </Animated.View>

      {/* Subtitle */}
      <Animated.Text style={[styles.subtitle, { opacity: fadeSubtitle, color: themeColors.text }]}>
        Your health, always on time
      </Animated.Text>

      {/* Feature badges */}
      <View style={styles.featureBadges}>
        <Animated.View style={[styles.badge, { opacity: pillOpacity }]}>
          <MaterialCommunityIcons name="pill" size={18} color="#06B6D4" />
          <Text style={styles.badgeText}>Medication</Text>
        </Animated.View>

        <Animated.View style={[styles.badge, { opacity: appointmentOpacity }]}>
          <MaterialCommunityIcons
            name="calendar-check"
            size={18}
            color={themeColors.tint}
          />
          <Text style={styles.badgeText}>Appointments</Text>
        </Animated.View>
      </View>

      {/* Bottom accent line */}
      <View style={styles.accentLine} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  backgroundDecor: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  gradientCircle: {
    width: "100%",
    height: "100%",
  },
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    zIndex: 10,
  },
  logo: {
    width: 140,
    height: 140,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 16,
    zIndex: 10,
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: "#06B6D4",
    borderRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: "#475569",
    fontWeight: "500",
    marginBottom: 32,
    zIndex: 10,
  },
  featureBadges: {
    flexDirection: "row",
    gap: 16,
    marginTop: 24,
    zIndex: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0F2FE",
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0369A1",
  },
  accentLine: {
    position: "absolute",
    bottom: 40,
    width: "30%",
    height: 3,
    backgroundColor: "#0EA5E9",
    borderRadius: 1.5,
    opacity: 0.3,
  },
});
