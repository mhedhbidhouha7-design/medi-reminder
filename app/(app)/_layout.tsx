// app/(app)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { Tabs } from "expo-router";

export default function ProtectedLayout() {
  console.log("Rendering ProtectedLayout (tabs)");
  const { colors } = useTheme();

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
