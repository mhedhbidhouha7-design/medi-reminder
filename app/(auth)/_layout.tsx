import { Stack, usePathname } from "expo-router";
import { useEffect } from "react";

export default function AuthLayout() {
  const pathname = usePathname();

  useEffect(() => {
    console.log("AuthLayout mounted; pathname=", pathname);
  }, [pathname]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="signin" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
//layout pour toutes les pages d’authentification.
// Il centralise la pile d’écrans,
// définit l’animation et le style,
// et permet de réagir aux changements de page via useEffect.