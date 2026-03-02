/*
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
*/

// app/_layout.tsx

import { Slot } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { ref, set } from "firebase/database";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { auth, db } from "../firebaseConfig"; // ← adjust path if needed (../firebase or ./firebase)

export default function RootLayout() {
  const [status, setStatus] = useState("Checking Firebase connection...");
  const [userInfo, setUserInfo] = useState("Auth: checking...");

  useEffect(() => {
    // 1. Check if auth initializes
    if (!auth) {
      setStatus("ERROR: auth did not initialize");
      return;
    }

    // 2. Listen to auth state (quick connectivity check)
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserInfo(`Logged in — UID: ${user.uid.slice(0, 8)}...`);
      } else {
        setUserInfo("Not logged in (normal — no one signed in yet)");
      }
    });

    // 3. Try a tiny write to prove DB connection (will fail on permission → that's OK)
    const testDb = async () => {
      try {
        const testRef = ref(db, "connection-test/expo");
        await set(testRef, {
          message: "Expo → Firebase connected!",
          checkedAt: new Date().toISOString(),
        });
        setStatus("Firebase Realtime DB → Write succeeded (rules allow it?)");
      } catch (err) {
        setStatus(
          `DB connection error (expected if rules locked):\n${err.message}`,
        );
      }
    };

    testDb();

    return () => unsubscribeAuth();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Connectivity Check</Text>
      <Text style={styles.status}>{status}</Text>
      <Text style={styles.user}>{userInfo}</Text>
      <Text style={styles.note}>
        If you see a permission-denied error → connection works, but rules block
        write (normal & good)
      </Text>

      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  status: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 10,
    color: "#0066cc",
  },
  user: { fontSize: 16, marginVertical: 8, fontWeight: "500" },
  note: { fontSize: 14, color: "#666", textAlign: "center", marginTop: 20 },
});
