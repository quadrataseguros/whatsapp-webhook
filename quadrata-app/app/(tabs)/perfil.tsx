import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CONTATOS, CORRETORA, waLink } from "../../constants/contato";

type Cliente = { nome: string; cpf: string; email: string; telefone: string; criado_em: string };

const MENU = [
  { label: "Dados Pessoais", emoji: "👤", desc: "Nome, CPF, contato" },
  { label: "Meus Boletos", emoji: "📄", desc: "2ª via e pagamentos", route: "/screens/boleto" },
  { label: "Notificações", emoji: "🔔", desc: "Alertas e lembretes" },
  { label: "Suporte", emoji: "🎧", desc: "Fale com a Quadrata", route: "/screens/contato" },
  { label: "Sobre o App", emoji: "ℹ️", desc: "Versão 1.0.0" },
];

export default function Perfil() {
  const [cliente, setCliente] = useState<Cliente | null>(null);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("@cliente");
      if (stored) setCliente(JSON.parse(stored));
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert("Sair", "Deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: async () => {
        await AsyncStorage.removeItem("@token");
        await AsyncStorage.removeItem("@cliente");
        router.replace("/login");
      }},
    ]);
  };

  const initials = (n: string) => n.split(" ").slice(0, 2).map(x => x[0]).join("").toUpperCase();
  const fmtCPF = (c: string) => c ? c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "";
  const anoCadastro = cliente?.criado_em ? cliente.criado_em.slice(0, 4) : "";

  return (
    <View style={s.root}>
      <SafeAreaView style={s.header} edges={["top"]}>
        <Text style={s.headerTitle}>Meu Perfil</Text>
      </SafeAreaView>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.profileCard}>
          <View style={s.avatarLarge}>
            <Text style={s.avatarText}>{cliente ? initials(cliente.nome) : "?"}</Text>
          </View>
          <Text style={s.profileName}>{cliente?.nome || "Carregando..."}</Text>
          <Text style={s.profileCPF}>CPF: {fmtCPF(cliente?.cpf || "")}</Text>
          {cliente?.email ? <Text style={s.profileEmail}>{cliente.email}</Text> : null}
          <View style={s.tagWrap}>
            {anoCadastro ? <View style={s.tag}><Text style={s.tagText}>Cliente desde {anoCadastro}</Text></View> : null}
            <View style={[s.tag, { backgroundColor: "#DCFCE7" }]}><Text style={[s.tagText, { color: "#16A34A" }]}>✓ Verificado</Text></View>
          </View>
        </View>

        <View style={s.corretorCard}>
          <Text style={s.corretorLabel}>Meu Corretor</Text>
          <View style={s.corretorRow}>
            <View style={s.corretorAvatar}><Text style={s.corretorAvatarText}>QS</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.corretorName}>{CORRETORA}</Text>
              <Text style={s.corretorTel}>📞 {CONTATOS.escritorio.display}</Text>
              <Text style={s.corretorTel}>🤖 {CONTATOS.mariana.display} · 24h</Text>
            </View>
            <TouchableOpacity style={s.chatBtn} onPress={() => Linking.openURL(waLink(CONTATOS.escritorio.whatsapp))}>
              <Text style={s.chatBtnText}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.chatBtn, s.chatBtn24h]} onPress={() => Linking.openURL(waLink(CONTATOS.mariana.whatsapp))}>
              <Text style={s.chatBtnText}>🤖</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.menuCard}>
          {MENU.map((item, i) => (
            <TouchableOpacity key={item.label} style={[s.menuItem, i < MENU.length - 1 && s.menuBorder]}
              onPress={() => item.route && router.push(item.route as any)}>
              <Text style={s.menuEmoji}>{item.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.menuLabel}>{item.label}</Text>
                <Text style={s.menuDesc}>{item.desc}</Text>
              </View>
              <Text style={s.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>
        <Text style={s.version}>Quadrata App v1.0.0 • Quadrata Seguros</Text>
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F3F6FC" },
  header: { backgroundColor: "#0D2B6E", paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: 8 },
  profileCard: { margin: 16, backgroundColor: "#0D2B6E", borderRadius: 20, padding: 24, alignItems: "center" },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "900" },
  profileName: { color: "#fff", fontSize: 20, fontWeight: "700", textAlign: "center" },
  profileCPF: { color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 4 },
  profileEmail: { color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 2 },
  tagWrap: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap", justifyContent: "center" },
  tag: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  corretorCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: "#fff", borderRadius: 14, padding: 16, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6 },
  corretorLabel: { fontSize: 11, color: "#aaa", fontWeight: "600", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 },
  corretorRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  corretorAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#0D2B6E", justifyContent: "center", alignItems: "center" },
  corretorAvatarText: { color: "#fff", fontWeight: "700" },
  corretorName: { fontWeight: "700", color: "#0D2B6E", fontSize: 14 },
  corretorTel: { color: "#666", fontSize: 12, marginTop: 2 },
  chatBtn: { backgroundColor: "#0D2B6E", borderRadius: 10, width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  chatBtn24h: { backgroundColor: "#16A34A" },
  chatBtnText: { color: "#fff", fontWeight: "700", fontSize: 17 },
  menuCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: "#fff", borderRadius: 14, overflow: "hidden", elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6 },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F6FC" },
  menuEmoji: { fontSize: 22, width: 30 },
  menuLabel: { fontSize: 14, fontWeight: "600", color: "#222" },
  menuDesc: { fontSize: 11, color: "#aaa", marginTop: 1 },
  menuArrow: { fontSize: 22, color: "#ccc" },
  logoutBtn: { marginHorizontal: 16, backgroundColor: "#FEE2E2", borderRadius: 12, padding: 14, alignItems: "center", marginBottom: 12 },
  logoutText: { color: "#DC2626", fontWeight: "700", fontSize: 15 },
  version: { textAlign: "center", color: "#ccc", fontSize: 11, marginBottom: 8 },
});
