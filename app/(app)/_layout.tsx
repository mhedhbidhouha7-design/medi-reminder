// app/(app)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { Tabs, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { auth } from "../../firebaseConfig";

export default function ProtectedLayout() {
  console.log("Rendering ProtectedLayout (tabs)");
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    console.log("Setting up auth state listener in ProtectedLayout");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log(
        "Auth state changed in ProtectedLayout:",
        user ? "user logged in" : "user logged out",
      );
      if (!user) {
        // User logged out, navigate back to signin
        console.log("Navigating to signin from ProtectedLayout");
        router.replace("/signin");
      }
    });

    return unsubscribe;
  }, [router]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text + "80",
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 4,
        },
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Medications */}
      <Tabs.Screen
        name="medications"
        options={{
          title: "Médicaments",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="medical-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
