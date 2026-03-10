import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef } from "react";
import {
  Alert,
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../../firebaseConfig";

// Floating Tab Bar Component
function FloatingTabBar({ state, descriptors, navigation }: any) {
  const translateX = useRef(new Animated.Value(0)).current;
  const tabWidth = 80;
  const spacing = 16;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: state.index * (tabWidth + spacing),
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index]);

  // Tab configuration with proper index mapping
  const getTabConfig = (index: number) => {
    const configs = [
      {
        icon: "home" as const,
        iconOutline: "home-outline" as const,
        label: "Accueil",
        color: "#00bfa5",
      }, // index 0 = home
      {
        icon: "sparkles" as const,
        iconOutline: "sparkles-outline" as const,
        label: "IA",
        color: "#ec4899",
      }, // index 1 = ia (disabled)
      {
        icon: "person" as const,
        iconOutline: "person-outline" as const,
        label: "Profil",
        color: "#f59e0b",
      }, // index 2 = profile
    ];
    return configs[index];
  };

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {/* Animated active indicator */}
        <Animated.View
          style={[
            styles.indicator,
            {
              transform: [{ translateX }],
              backgroundColor: getTabConfig(state.index).color,
            },
          ]}
        />

        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const config = getTabConfig(index);

          const onPress = () => {
            // Prevent navigation to IA tab (not implemented yet)
            if (route.name === "ia") {
              Alert.alert(
                "Bientôt disponible",
                "Cette fonctionnalité sera bientôt disponible",
              );
              return;
            }
            if (!isFocused) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isFocused ? config.icon : config.iconOutline}
                size={24}
                color={isFocused ? "#fff" : "#64748b"}
              />
              {isFocused && (
                <Animated.Text style={styles.tabLabel}>
                  {config.label}
                </Animated.Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function ProtectedLayout() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/signin");
      }
    });
    return unsubscribe;
  }, [router]);

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Home - index 0 */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Accueil",
        }}
      />
      {/* Profile - index 2 */}
      <Tabs.Screen
        name="profile/index.tsx"
        options={{
          title: "Profil",
        }}
      />

      {/* IA Assistant - index 1 (disabled) */}
      <Tabs.Screen
        name="medications/index"
        options={{
          title: "IA",
          href: null, // Prevents direct navigation
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 32,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    alignItems: "center",
  },
  indicator: {
    position: "absolute",
    width: 80,
    height: 48,
    borderRadius: 24,
    left: 16,
    top: 12,
  },
  tabButton: {
    width: 80,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
});
