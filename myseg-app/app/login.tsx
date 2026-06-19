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
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const formatCpf = (value: string) => {
    const nums = value.replace(/\D/g, "").slice(0, 11);
    if (nums.length <= 3) return nums;
    if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
    if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
    return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`;
  };

  const handleLogin = async () => {
    if (!cpf.trim() || !senha.trim()) {
      Alert.alert("Atencao", "Preencha CPF e senha.");
      return;
    }
    setLoading(true);
    try {
      await login(cpf.replace(/\D/g, ""), senha);
      router.replace("/(tabs)/inicio");
    } catch (err: any) {
      Alert.alert("Erro", err.message || "CPF ou senha invalidos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.topSection}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoQ}>Q</Text>
        </View>
        <Text style={styles.appName}>Quadrata App</Text>
        <Text style={styles.subtitle}>Seu seguro na palma da mao</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>Acesse sua conta</Text>

        <Text style={styles.label}>CPF</Text>
        <TextInput
          style={styles.input}
          value={cpf}
          onChangeText={(v) => setCpf(formatCpf(v))}
          placeholder="000.000.000-00"
          placeholderTextColor={Colors.textLight}
          keyboardType="numeric"
          maxLength={14}
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

      <Text style={styles.footer}>Quadrata Seguros</Text>
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
  topSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logoQ: {
    fontSize: 44,
    fontWeight: "900",
    color: Colors.primary,
  },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: "bold",
    color: Colors.white,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: "rgba(255,255,255,0.8)",
    marginTop: Spacing.xs,
  },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  formTitle: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
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
    backgroundColor: Colors.primary,
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
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
  },
  footer: {
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginTop: Spacing.xl,
    fontSize: FontSize.xs,
  },
});
