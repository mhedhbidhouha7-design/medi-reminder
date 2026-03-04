import { Redirect, Slot, usePathname } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { auth } from "../firebaseConfig";

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  if (initializing) {
    console.log("RootLayout: initializing auth state...");
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  console.log(
    "RootLayout: user=",
    user,
    "pathname=",
    pathname,
    "initializing=",
    initializing,
  );

  // Redirect logic with minimal branching so that a slot can render
  // in most cases.  Logs help track why we redirected.
  if (!user) {
    const authPaths = ["/signin", "/signup", "/forgot-password"];
    if (!authPaths.includes(pathname)) {
      console.log("RootLayout: no user, redirecting to /signin");
      return <Redirect href="/signin" />;
    }
  } else {
    if (pathname === "/") {
      console.log("RootLayout: user exists and on root, redirecting to /home");
      return <Redirect href="/home" />;
    }
  }
  return <Slot />;
}
