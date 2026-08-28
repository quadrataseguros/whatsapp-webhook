import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

type ActionItem = {
  label: string;
  emoji: string;
  color: string;
  route?: string;
  external?: string;
};

const ACTIONS: ActionItem[] = [
  { label: "Meus Seguros", emoji: "📋", color: "#2563EB", route: "/(tabs)/seguros" },
  { label: "Assistência 24h", emoji: "🆘", color: "#16A34A", route: "/screens/assistencia" },
  { label: "Acionar Sinistro", emoji: "🚨", color: "#DC2626", route: "/screens/sinistro" },
  { label: "Fale Conosco", emoji: "💬", color: "#9333EA", route: "/screens/contato" },
  { label: "2ª Via Boleto", emoji: "📄", color: "#EA580C", route: "/screens/boleto" },
  { label: "Solicitar Cotação", emoji: "📝", color: "#0891B2", route: "/screens/cotacao" },
  { label: "WhatsApp", emoji: "📱", color: "#15803D", external: "https://wa.me/5500000000000" },
  { label: "Indique e Ganhe", emoji: "🎁", color: "#B45309" },
];

export default function Inicio() {
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0D2B6E" />
      <SafeAreaView style={s.safeTop} edges={["top"]}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.welcome}>Bem-vindo(a) 👋</Text>
            <Text style={s.name}>Segurado Quadrata</Text>
          </View>
          <View style={s.avatar}>
            <Text style={s.avatarText}>SQ</Text>
          </View>
        </View>

        {/* Aviso / Banner */}
        <View style={s.banner}>
          <Text style={s.bannerTitle}>✅ Seus seguros estão em dia</Text>
          <Text style={s.bannerSub}>Próximo vencimento: 15/09/2025</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Acesso Rápido */}
        <Text style={s.sectionTitle}>Acesso Rápido</Text>
        <View style={s.grid}>
          {ACTIONS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={s.cell}
              activeOpacity={0.75}
              onPress={() => {
                if (item.route) router.push(item.route as any);
              }}
            >
              <View style={[s.iconCircle, { backgroundColor: item.color }]}>
                <Text style={s.iconEmoji}>{item.emoji}</Text>
              </View>
              <Text style={s.cellLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Ultimas Apolices */}
        <Text style={s.sectionTitle}>Meus Seguros</Text>
        {[
          { tipo: "Automóvel", apolice: "APL-2024-0012", status: "Vigente", venc: "12/2025", cor: "#2563EB", emoji: "🚗" },
          { tipo: "Residência", apolice: "APL-2024-0005", status: "Vigente", venc: "08/2025", cor: "#16A34A", emoji: "🏠" },
        ].map((seg) => (
          <TouchableOpacity
            key={seg.apolice}
            style={s.card}
            activeOpacity={0.8}
            onPress={() => router.push("/screens/seguro-detalhe" as any)}
          >
            <View style={[s.cardIcon, { backgroundColor: seg.cor + "22" }]}>
              <Text style={{ fontSize: 26 }}>{seg.emoji}</Text>
            </View>
            <View style={s.cardInfo}>
              <Text style={s.cardTipo}>{seg.tipo}</Text>
              <Text style={s.cardApolice}>Apólice: {seg.apolice}</Text>
              <Text style={s.cardVenc}>Validade: {seg.venc}</Text>
            </View>
            <View style={[s.badge, { backgroundColor: "#DCFCE7" }]}>
              <Text style={[s.badgeText, { color: "#16A34A" }]}>{seg.status}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D2B6E" },
  safeTop: { backgroundColor: "#0D2B6E" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  welcome: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  name: { color: "#fff", fontSize: 18, fontWeight: "700" },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  banner: { marginHorizontal: 20, marginBottom: 4, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 14, padding: 14 },
  bannerTitle: { color: "#fff", fontWeight: "700", fontSize: 14 },
  bannerSub: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
  scroll: { backgroundColor: "#F3F6FC", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 16, minHeight: "100%" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0D2B6E", marginBottom: 12, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  cell: { width: "22%", alignItems: "center" },
  iconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center", marginBottom: 6, elevation: 4, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6 },
  iconEmoji: { fontSize: 26 },
  cellLabel: { fontSize: 10, color: "#333", textAlign: "center", fontWeight: "600", lineHeight: 13 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 10, elevation: 3, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6 },
  cardIcon: { width: 52, height: 52, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTipo: { fontSize: 15, fontWeight: "700", color: "#0D2B6E" },
  cardApolice: { fontSize: 12, color: "#666", marginTop: 2 },
  cardVenc: { fontSize: 12, color: "#888", marginTop: 1 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "700" },
});
