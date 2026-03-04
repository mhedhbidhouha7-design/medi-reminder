import { Link, router } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { auth } from "../../firebaseConfig";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      // Optional: set display name
      await updateProfile(userCredential.user, { displayName: name.trim() });

      router.replace("/home");
    } catch (error: any) {
      Alert.alert("Signup failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 16 }}>
      <Text style={{ fontSize: 32, fontWeight: "bold", marginBottom: 8 }}>
        Create Account
      </Text>

      <TextInput
        placeholder="Full name"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

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
        title={loading ? "Creating..." : "Sign Up"}
        onPress={handleSignup}
        disabled={loading}
      />

      <Link
        href="/signin"
        style={{ color: "#0066cc", textAlign: "center", marginTop: 16 }}
      >
        Already have an account? Sign in
      </Link>
    </View>
  );
}
