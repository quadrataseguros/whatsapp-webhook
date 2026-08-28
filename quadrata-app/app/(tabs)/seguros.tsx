import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../../constants/api";

type Apolice = {
  id: number; tipo: string; numero: string; seguradora: string; descricao: string;
  vigencia_inicio: string; vigencia_fim: string; premio_mensal: string; status: string;
};

const TIPO_EMOJI: Record<string, string> = {
  "Automóvel":"🚗","Residência":"🏠","Vida":"❤️","Saúde":"🏥",
  "Empresarial":"🏢","Previdência":"💰","Embarcações":"⛵","Responsabilidade Civil":"⚖️","Outro":"📋",
};
const TIPO_COR: Record<string, string> = {
  "Automóvel":"#2563EB","Residência":"#16A34A","Vida":"#DC2626","Saúde":"#0891B2",
  "Empresarial":"#9333EA","Previdência":"#B45309","Embarcações":"#0D9488","Responsabilidade Civil":"#7C3AED","Outro":"#6B7280",
};

export default function Seguros() {
  const [apolices, setApolices] = useState<Apolice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const token = await AsyncStorage.getItem("@token");
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/api/cliente/apolices`, { headers: { Authorization: "Bearer " + token } });
      if (res.ok) setApolices(await res.json());
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const fmtDate = (s: string) => s ? s.split("-").reverse().join("/") : "-";
  const ativas = apolices.filter(a => a.status === "Vigente").length;

  return (
    <View style={s.root}>
      <SafeAreaView style={s.header} edges={["top"]}>
        <Text style={s.headerTitle}>Meus Seguros</Text>
        <Text style={s.headerSub}>{ativas} apólice(s) vigente(s)</Text>
      </SafeAreaView>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        {loading ? (
          <ActivityIndicator color="#0D2B6E" style={{ marginTop: 40 }} />
        ) : apolices.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>📋</Text>
            <Text style={s.emptyText}>Nenhuma apólice cadastrada</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => router.push("/screens/cotacao" as any)}>
              <Text style={s.emptyBtnText}>Solicitar Cotação</Text>
            </TouchableOpacity>
          </View>
        ) : apolices.map((seg) => {
          const cor = TIPO_COR[seg.tipo] || "#6B7280";
          const emoji = TIPO_EMOJI[seg.tipo] || "📋";
          return (
            <TouchableOpacity key={seg.id} style={s.card} activeOpacity={0.8}
              onPress={() => router.push({ pathname: "/screens/seguro-detalhe", params: { id: seg.id } } as any)}>
              <View style={s.cardTop}>
                <View style={[s.iconBox, { backgroundColor: cor + "22" }]}>
                  <Text style={{ fontSize: 30 }}>{emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.tipo}>{seg.tipo}</Text>
                  <Text style={s.sub}>{seg.descricao || seg.seguradora}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: seg.status === "Vigente" ? "#DCFCE7" : "#FEE2E2" }]}>
                  <Text style={[s.badgeText, { color: seg.status === "Vigente" ? "#16A34A" : "#DC2626" }]}>{seg.status}</Text>
                </View>
              </View>
              <View style={s.divider} />
              <View style={s.cardBottom}>
                <View><Text style={s.infoLabel}>Apólice</Text><Text style={s.infoVal}>{seg.numero}</Text></View>
                <View><Text style={s.infoLabel}>Vencimento</Text><Text style={s.infoVal}>{fmtDate(seg.vigencia_fim)}</Text></View>
                <View><Text style={s.infoLabel}>Prêmio</Text><Text style={[s.infoVal, { color: "#0D2B6E" }]}>{seg.premio_mensal || "-"}</Text></View>
              </View>
              <Text style={s.detalhes}>Ver detalhes →</Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F3F6FC" },
  header: { backgroundColor: "#0D2B6E", paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: 8 },
  headerSub: { color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 2 },
  scroll: { padding: 16 },
  empty: { alignItems: "center", marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: "#aaa", fontSize: 15, marginBottom: 16 },
  emptyBtn: { backgroundColor: "#0D2B6E", borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: "#fff", fontWeight: "700" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 14, elevation: 3, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  iconBox: { width: 54, height: 54, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  tipo: { fontSize: 17, fontWeight: "700", color: "#0D2B6E" },
  sub: { fontSize: 12, color: "#666", marginTop: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#F0F4FB", marginBottom: 12 },
  cardBottom: { flexDirection: "row", justifyContent: "space-between" },
  infoLabel: { fontSize: 10, color: "#aaa", marginBottom: 2 },
  infoVal: { fontSize: 13, fontWeight: "600", color: "#333" },
  detalhes: { color: "#0D2B6E", fontSize: 12, fontWeight: "700", marginTop: 12, textAlign: "right" },
});
