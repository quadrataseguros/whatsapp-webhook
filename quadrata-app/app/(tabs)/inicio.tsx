import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../../constants/api";

type Apolice = { id: number; tipo: string; numero: string; status: string; vigencia_fim: string; descricao: string };
type Cliente = { nome: string; cpf: string };

const ACTIONS = [
  { label: "Meus Seguros",    emoji: "📋", color: "#2563EB", route: "/(tabs)/seguros" },
  { label: "Assistência 24h", emoji: "🆘", color: "#16A34A", route: "/screens/assistencia" },
  { label: "Acionar Sinistro",emoji: "🚨", color: "#DC2626", route: "/screens/sinistro" },
  { label: "Fale Conosco",    emoji: "💬", color: "#9333EA", route: "/screens/contato" },
  { label: "2ª Via Boleto",   emoji: "📄", color: "#EA580C", route: "/screens/boleto" },
  { label: "Solicitar Cotação",emoji:"📝", color: "#0891B2", route: "/screens/cotacao" },
  { label: "WhatsApp",        emoji: "📱", color: "#15803D" },
  { label: "Indique e Ganhe", emoji: "🎁", color: "#B45309" },
];

const TIPO_EMOJI: Record<string, string> = {
  "Automóvel":"🚗","Residência":"🏠","Vida":"❤️","Saúde":"🏥",
  "Empresarial":"🏢","Previdência":"💰","Embarcações":"⛵","Responsabilidade Civil":"⚖️","Outro":"📋",
};
const TIPO_COR: Record<string, string> = {
  "Automóvel":"#2563EB","Residência":"#16A34A","Vida":"#DC2626","Saúde":"#0891B2",
  "Empresarial":"#9333EA","Previdência":"#B45309","Embarcações":"#0D9488","Responsabilidade Civil":"#7C3AED","Outro":"#6B7280",
};

export default function Inicio() {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [apolices, setApolices] = useState<Apolice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("@cliente");
      const token = await AsyncStorage.getItem("@token");
      if (stored) setCliente(JSON.parse(stored));
      if (token) {
        try {
          const res = await fetch(`${API_BASE}/api/cliente/apolices`, {
            headers: { Authorization: "Bearer " + token },
          });
          if (res.ok) setApolices(await res.json());
        } catch {}
      }
      setLoading(false);
    })();
  }, []);

  const initials = (nome: string) => nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
  const primeiroNome = (nome: string) => nome.split(" ")[0];
  const fmtDate = (s: string) => s ? s.split("-").reverse().join("/") : "-";

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0D2B6E" />
      <SafeAreaView style={s.safeTop} edges={["top"]}>
        <View style={s.header}>
          <View>
            <Text style={s.welcome}>Bem-vindo(a) 👋</Text>
            <Text style={s.name}>{cliente ? primeiroNome(cliente.nome) : "Segurado"}</Text>
          </View>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{cliente ? initials(cliente.nome) : "?"}</Text>
          </View>
        </View>

        {apolices.length > 0 ? (
          <View style={s.banner}>
            <Text style={s.bannerTitle}>✅ {apolices.filter(a => a.status === "Vigente").length} seguro(s) vigente(s)</Text>
            <Text style={s.bannerSub}>
              Próximo vencimento: {fmtDate(apolices.slice().sort((a, b) => a.vigencia_fim.localeCompare(b.vigencia_fim))[0]?.vigencia_fim)}
            </Text>
          </View>
        ) : (
          <View style={s.banner}>
            <Text style={s.bannerTitle}>📋 Nenhum seguro cadastrado</Text>
            <Text style={s.bannerSub}>Solicite uma cotação agora mesmo</Text>
          </View>
        )}
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionTitle}>Acesso Rápido</Text>
        <View style={s.grid}>
          {ACTIONS.map((item) => (
            <TouchableOpacity key={item.label} style={s.cell} activeOpacity={0.75}
              onPress={() => { if (item.route) router.push(item.route as any); }}>
              <View style={[s.iconCircle, { backgroundColor: item.color }]}>
                <Text style={s.iconEmoji}>{item.emoji}</Text>
              </View>
              <Text style={s.cellLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionTitle}>Meus Seguros</Text>
        {loading ? (
          <ActivityIndicator color="#0D2B6E" style={{ margin: 24 }} />
        ) : apolices.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyText}>📋 Nenhuma apólice cadastrada</Text>
            <TouchableOpacity onPress={() => router.push("/screens/cotacao" as any)}>
              <Text style={s.emptyLink}>Solicitar cotação →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          apolices.slice(0, 3).map((seg) => {
            const cor = TIPO_COR[seg.tipo] || "#6B7280";
            const emoji = TIPO_EMOJI[seg.tipo] || "📋";
            return (
              <TouchableOpacity key={seg.id} style={s.card} activeOpacity={0.8}
                onPress={() => router.push({ pathname: "/screens/seguro-detalhe", params: { id: seg.id } } as any)}>
                <View style={[s.cardIcon, { backgroundColor: cor + "22" }]}>
                  <Text style={{ fontSize: 26 }}>{emoji}</Text>
                </View>
                <View style={s.cardInfo}>
                  <Text style={s.cardTipo}>{seg.tipo}</Text>
                  <Text style={s.cardApolice}>{seg.descricao || seg.numero}</Text>
                  <Text style={s.cardVenc}>Válido até: {fmtDate(seg.vigencia_fim)}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: seg.status === "Vigente" ? "#DCFCE7" : "#FEE2E2" }]}>
                  <Text style={[s.badgeText, { color: seg.status === "Vigente" ? "#16A34A" : "#DC2626" }]}>{seg.status}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
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
  scroll: { backgroundColor: "#F3F6FC", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 16, minHeight: "100%" as any },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0D2B6E", marginBottom: 12, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  cell: { width: "22%", alignItems: "center" },
  iconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center", marginBottom: 6, elevation: 4, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6 },
  iconEmoji: { fontSize: 26 },
  cellLabel: { fontSize: 10, color: "#333", textAlign: "center", fontWeight: "600", lineHeight: 13 },
  emptyCard: { backgroundColor: "#fff", borderRadius: 14, padding: 24, alignItems: "center", marginBottom: 10, elevation: 2 },
  emptyText: { color: "#999", fontSize: 14, marginBottom: 8 },
  emptyLink: { color: "#0D2B6E", fontWeight: "700", fontSize: 13 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 10, elevation: 3, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6 },
  cardIcon: { width: 52, height: 52, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTipo: { fontSize: 15, fontWeight: "700", color: "#0D2B6E" },
  cardApolice: { fontSize: 12, color: "#666", marginTop: 2 },
  cardVenc: { fontSize: 12, color: "#888", marginTop: 1 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "700" },
});
