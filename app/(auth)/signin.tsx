import { Link, router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { auth } from "../../firebaseConfig";

export default function Login() {
  console.log("Rendering Signin screen");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // navigate using the public path without group parentheses
      router.replace("/home"); // Redirect to home after successful login
    } catch (error: any) {
      Alert.alert("Login failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 16 }}>
      <Text style={{ fontSize: 32, fontWeight: "bold", marginBottom: 8 }}>
        Welcome back
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      <Button
        title={loading ? "Signing in..." : "Sign In"}
        onPress={handleLogin}
        disabled={loading}
      />

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 16,
        }}
      >
        <Link href="/signup" style={{ color: "#0066cc" }}>
          Create account
        </Link>

        <Link href="/forgot-password" style={{ color: "#0066cc" }}>
          Forgot password?
        </Link>
      </View>
    </View>
  );
}
