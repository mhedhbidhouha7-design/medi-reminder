import { Slot, usePathname, useRouter } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { auth } from "../firebaseConfig";

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (initializing) return;

    const authPaths = ["/signin", "/signup", "/forgot-password"];

    if (!user && !authPaths.includes(pathname)) {
      console.log("No user → replace to /signin");
      router.replace("/signin");
    }

    if (user && pathname === "/") {
      console.log("User exists → replace to /home");
      router.replace("/home");
    }
  }, [user, pathname, initializing]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}
