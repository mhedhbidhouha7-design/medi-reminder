import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { Tabs, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { auth } from "../../firebaseConfig";

// Configure notification handler for LOCAL notifications only
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Floating Tab Bar Component
function FloatingTabBar({ state, descriptors, navigation }: any) {
  const translateX = useRef(new Animated.Value(0)).current;
  const tabWidth = 80;
  const spacing = 16;

  // DEBUG: Log all route names so we can see what Expo Router generates
  console.log(
    "TAB ROUTES:",
    state.routes.map((r: any) => r.name),
  );

  // Whitelist approach: only show tabs whose route names match known tabs
  const visibleRoutes = state.routes.filter((route: any) => {
    const name = route.name.toLowerCase();
    return (
      name.includes("home") || name.includes("ia") || name.includes("profile")
    );
  });

  const getVisualIndex = (routeKey: string) => {
    return visibleRoutes.findIndex((r: any) => r.key === routeKey);
  };

  const currentRoute = state.routes[state.index];
  const visualActiveIndex = getVisualIndex(currentRoute.key);

  useEffect(() => {
    if (visualActiveIndex !== -1) {
      Animated.spring(translateX, {
        toValue: visualActiveIndex * (tabWidth + spacing),
        useNativeDriver: true,
        friction: 8,
        tension: 50,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visualActiveIndex]);

  // Tab configuration derived from route name
  const getTabConfig = (routeName: string) => {
    const route = routeName.toLowerCase();

    if (route.includes("home")) {
      return {
        icon: "home" as const,
        iconOutline: "home-outline" as const,
        label: "Accueil",
        color: "#00bfa5",
      };
    }
    if (route.includes("ia")) {
      return {
        icon: "sparkles" as const,
        iconOutline: "sparkles-outline" as const,
        label: "IA",
        color: "#ec4899",
      };
    }
    if (route.includes("profile")) {
      return {
        icon: "person" as const,
        iconOutline: "person-outline" as const,
        label: "Profil",
        color: "#f59e0b",
      };
    }

    // Default fallback
    return {
      icon: "ellipse" as const,
      iconOutline: "ellipse-outline" as const,
      label: "Tab",
      color: "#64748b",
    };
  };

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {/* Animated active indicator */}
        {visualActiveIndex !== -1 && (
          <Animated.View
            style={[
              styles.indicator,
              {
                transform: [{ translateX }],
                backgroundColor: getTabConfig(currentRoute.name).color,
              },
            ]}
          />
        )}

        {visibleRoutes.map((route: any) => {
          const isFocused = currentRoute.key === route.key;
          const config = getTabConfig(route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate({ name: route.name, merge: true });
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

  // Setup LOCAL notifications only (works in Expo Go)
  useEffect(() => {
    async function setupNotifications() {
      try {
        // Request notification permissions
        const { status } = await Notifications.requestPermissionsAsync();

        if (status !== "granted") {
          console.log("Notification permission denied");
          return;
        }

        console.log("Notification permission granted for local notifications");

        // Setup Android notification channel (local notifications only)
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
          });
          console.log("Android notification channel created");
        }

        // NOTE: We do NOT call getExpoPushTokenAsync() here
        // because that requires remote notifications which are
        // not supported in Expo Go SDK 53+

      } catch (error) {
        console.log("Notification setup error:", error);
      }
    }

    setupNotifications();
  }, []);

  // Auth state listener
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
      <Tabs.Screen
        name="home"
        options={{
          title: "Accueil",
        }}
      />

      {/* 
        Windows/Expo sometimes normalizes this to 'ia' even if the folder is 'IA' 
        We use 'IA' (or whatever matches your filesystem exactly) and it works
        We don't append /index because we want Expo to match the route directly 
      */}
      <Tabs.Screen
        name="IA"
        options={{
          title: "IA",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
        }}
      />

      {/* Hidden Screens - no tab bar button */}
      <Tabs.Screen
        name="medications"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="rdv"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="proche"
        options={{
          tabBarButton: () => null,
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