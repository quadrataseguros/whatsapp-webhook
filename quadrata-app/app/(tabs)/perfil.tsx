import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const MENU = [
  { label: "Dados Pessoais", emoji: "👤", desc: "Nome, CPF, contato" },
  { label: "Documentos", emoji: "📁", desc: "CNH, RG e outros" },
  { label: "Notificações", emoji: "🔔", desc: "Alertas e lembretes" },
  { label: "Alterar Senha", emoji: "🔐", desc: "Segurança da conta" },
  { label: "Suporte", emoji: "🎧", desc: "Fale com a Quadrata" },
  { label: "Sobre o App", emoji: "ℹ️", desc: "Versão 1.0.0" },
];

export default function Perfil() {
  const handleLogout = () => {
    Alert.alert("Sair", "Deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => router.replace("/login") },
    ]);
  };

  return (
    <View style={s.root}>
      <SafeAreaView style={s.header} edges={["top"]}>
        <Text style={s.headerTitle}>Meu Perfil</Text>
      </SafeAreaView>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={s.profileCard}>
          <View style={s.avatarLarge}>
            <Text style={s.avatarText}>SQ</Text>
          </View>
          <Text style={s.profileName}>Segurado Quadrata</Text>
          <Text style={s.profileCPF}>CPF: 123.456.789-00</Text>
          <Text style={s.profileEmail}>segurado@email.com</Text>
          <View style={s.tagWrap}>
            <View style={s.tag}><Text style={s.tagText}>Cliente desde 2022</Text></View>
            <View style={[s.tag, { backgroundColor: "#DCFCE7" }]}><Text style={[s.tagText, { color: "#16A34A" }]}>✓ Verificado</Text></View>
          </View>
        </View>

        {/* Corretor */}
        <View style={s.corretorCard}>
          <Text style={s.corretorLabel}>Meu Corretor</Text>
          <View style={s.corretorRow}>
            <View style={s.corretorAvatar}><Text style={s.corretorAvatarText}>QS</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.corretorName}>Quadrata Seguros</Text>
              <Text style={s.corretorTel}>📞 (11) 9999-9999</Text>
            </View>
            <TouchableOpacity style={s.chatBtn}>
              <Text style={s.chatBtnText}>Contato</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu */}
        <View style={s.menuCard}>
          {MENU.map((item, i) => (
            <TouchableOpacity key={item.label} style={[s.menuItem, i < MENU.length - 1 && s.menuBorder]}>
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
  profileName: { color: "#fff", fontSize: 20, fontWeight: "700" },
  profileCPF: { color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 4 },
  profileEmail: { color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 2 },
  tagWrap: { flexDirection: "row", gap: 8, marginTop: 12 },
  tag: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  corretorCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: "#fff", borderRadius: 14, padding: 16, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6 },
  corretorLabel: { fontSize: 11, color: "#aaa", fontWeight: "600", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 },
  corretorRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  corretorAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#0D2B6E", justifyContent: "center", alignItems: "center" },
  corretorAvatarText: { color: "#fff", fontWeight: "700" },
  corretorName: { fontWeight: "700", color: "#0D2B6E", fontSize: 14 },
  corretorTel: { color: "#666", fontSize: 12, marginTop: 2 },
  chatBtn: { backgroundColor: "#0D2B6E", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  chatBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
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
