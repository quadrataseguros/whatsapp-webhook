import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../constants/api";

export default function Login() {
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const fmt = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 11);
    if (n.length <= 3) return n;
    if (n.length <= 6) return `${n.slice(0,3)}.${n.slice(3)}`;
    if (n.length <= 9) return `${n.slice(0,3)}.${n.slice(3,6)}.${n.slice(6)}`;
    return `${n.slice(0,3)}.${n.slice(3,6)}.${n.slice(6,9)}-${n.slice(9)}`;
  };

  const handleLogin = async () => {
    if (!cpf || !senha) { Alert.alert("Atenção", "Preencha CPF e senha."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/cliente/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf, senha }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Erro", data.erro || "CPF ou senha incorretos.");
        return;
      }
      await AsyncStorage.setItem("@token", data.token);
      await AsyncStorage.setItem("@cliente", JSON.stringify(data.cliente));
      router.replace("/(tabs)/inicio");
    } catch {
      Alert.alert("Erro", "Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={s.logoArea}>
        <View style={s.logoBox}>
          <Text style={s.logoQ}>Q</Text>
        </View>
        <Text style={s.appName}>Quadrata App</Text>
        <Text style={s.corretora}>QUADRATA SEGUROS</Text>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Acesse sua conta</Text>
        <Text style={s.label}>CPF</Text>
        <TextInput style={s.input} value={cpf} onChangeText={v => setCpf(fmt(v))} placeholder="000.000.000-00" placeholderTextColor="#aaa" keyboardType="numeric" maxLength={14} />
        <Text style={s.label}>Senha</Text>
        <TextInput style={s.input} value={senha} onChangeText={setSenha} placeholder="••••••" placeholderTextColor="#aaa" secureTextEntry />
        <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>ENTRAR</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={s.forgot}><Text style={s.forgotText}>Esqueci minha senha</Text></TouchableOpacity>
      </View>

      <Text style={s.version}>v1.0.0 • Quadrata Seguros</Text>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D2B6E", justifyContent: "center", padding: 24 },
  logoArea: { alignItems: "center", marginBottom: 32 },
  logoBox: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", marginBottom: 12, elevation: 8, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 10 },
  logoQ: { fontSize: 46, fontWeight: "900", color: "#0D2B6E" },
  appName: { fontSize: 26, fontWeight: "bold", color: "#fff", letterSpacing: 1 },
  corretora: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4, letterSpacing: 2 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 24, elevation: 10, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 12 },
  cardTitle: { fontSize: 17, fontWeight: "700", color: "#0D2B6E", textAlign: "center", marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: "#F3F6FC", borderRadius: 10, padding: 14, fontSize: 15, color: "#222", borderWidth: 1, borderColor: "#E0E8F5" },
  btn: { backgroundColor: "#0D2B6E", borderRadius: 10, padding: 15, alignItems: "center", marginTop: 20 },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "bold", letterSpacing: 1 },
  forgot: { alignItems: "center", marginTop: 14 },
  forgotText: { color: "#0D2B6E", fontSize: 13 },
  version: { color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: 24, fontSize: 11 },
});
