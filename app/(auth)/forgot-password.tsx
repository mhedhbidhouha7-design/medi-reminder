import { Link } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { auth } from "../../firebaseConfig";

export default function ForgotPassword() {
  console.log("Rendering ForgotPassword screen");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
      Alert.alert(
        "Email sent",
        "Check your inbox for password reset instructions.",
      );
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View
        style={{
          flex: 1,
          padding: 24,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 20, textAlign: "center", marginBottom: 24 }}>
          Password reset email sent!
        </Text>
        <Text style={{ textAlign: "center", marginBottom: 32 }}>
          Please check your inbox (and spam folder).
        </Text>
        <Link href="/signin" style={{ color: "#0066cc", fontSize: 16 }}>
          Back to login
        </Link>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 16 }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 8 }}>
        Reset Password
      </Text>

      <Text style={{ marginBottom: 16, color: "#555" }}>
        Enter your email and we ll send you instructions to reset your password.
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      <Button
        title={loading ? "Sending..." : "Send Reset Link"}
        onPress={handleReset}
        disabled={loading}
      />

      <Link
        href="/signin"
        style={{ color: "#0066cc", textAlign: "center", marginTop: 24 }}
      >
        Back to login
      </Link>
    </View>
  );
}
