import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import { auth } from "../firebaseConfig";

export default function SplashScreen() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const fadeTitle = useRef(new Animated.Value(0)).current;
  const fadeSubtitle = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(logoScale, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 7000,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
      ]),
    ).start();

    Animated.sequence([
      Animated.delay(500),
      Animated.timing(fadeTitle, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeSubtitle, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      }),
    ]).start();

    // Check auth state after animation completes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, go to home
        setTimeout(() => router.replace("/home"), 3000);
      } else {
        // No user, go to signin
        setTimeout(() => router.replace("/signin"), 3000);
      }
    });

    return unsubscribe;
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <LinearGradient colors={["#0F172A", "#0ea5a4"]} style={styles.container}>
      <Animated.View
        style={{
          transform: [{ scale: logoScale }, { rotate: rotateInterpolate }],
        }}
      >
        <Ionicons name="medkit-outline" size={80} color="#fff" />
      </Animated.View>
      <Animated.Text style={[styles.title, { opacity: fadeTitle }]}>
        MediReminder
      </Animated.Text>
      <Animated.Text style={[styles.subtitle, { opacity: fadeSubtitle }]}>
        Your health, always on time.
      </Animated.Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 36, fontWeight: "bold", color: "#fff", marginTop: 20 },
  subtitle: { fontSize: 16, color: "#d1d5db", marginTop: 6 },
});
