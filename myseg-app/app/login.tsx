import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert("Atenção", "Preencha email e senha.");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), senha);
      router.replace("/(tabs)/dashboard");
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Falha ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>MY</Text>
        </View>
        <Text style={styles.appName}>MYSeg</Text>
        <Text style={styles.subtitle}>Quadrata Seguros</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          placeholderTextColor={Colors.textLight}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          value={senha}
          onChangeText={setSenha}
          placeholder="Sua senha"
          placeholderTextColor={Colors.textLight}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotButton}>
          <Text style={styles.forgotText}>Esqueci minha senha</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>v1.0.0</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    padding: Spacing.lg,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  logoText: {
    fontSize: FontSize.title,
    fontWeight: "900",
    color: Colors.primary,
  },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: "bold",
    color: Colors.white,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.accentLight,
    marginTop: Spacing.xs,
  },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: "bold",
  },
  forgotButton: {
    alignItems: "center",
    marginTop: Spacing.md,
  },
  forgotText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  version: {
    color: Colors.accentLight,
    textAlign: "center",
    marginTop: Spacing.lg,
    fontSize: FontSize.xs,
  },
});
