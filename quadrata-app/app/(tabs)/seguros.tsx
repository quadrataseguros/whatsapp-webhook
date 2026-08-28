import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const SEGUROS = [
  { tipo: "Automóvel", apolice: "APL-2024-0012", veiculo: "Toyota Corolla 2022", venc: "12/12/2025", premio: "R$ 189,00/mês", status: "Vigente", cor: "#2563EB", emoji: "🚗" },
  { tipo: "Residência", apolice: "APL-2024-0005", veiculo: "Rua das Flores, 100", venc: "08/08/2025", premio: "R$ 67,00/mês", status: "Vigente", cor: "#16A34A", emoji: "🏠" },
  { tipo: "Vida", apolice: "APL-2023-0088", veiculo: "Capital Segurado: R$ 200.000", venc: "05/05/2026", premio: "R$ 45,00/mês", status: "Vigente", cor: "#9333EA", emoji: "❤️" },
];

export default function Seguros() {
  return (
    <View style={s.root}>
      <SafeAreaView style={s.header} edges={["top"]}>
        <Text style={s.headerTitle}>Meus Seguros</Text>
        <Text style={s.headerSub}>{SEGUROS.length} apólices ativas</Text>
      </SafeAreaView>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {SEGUROS.map((seg) => (
          <TouchableOpacity
            key={seg.apolice}
            style={s.card}
            activeOpacity={0.8}
            onPress={() => router.push("/screens/seguro-detalhe" as any)}
          >
            <View style={s.cardTop}>
              <View style={[s.iconBox, { backgroundColor: seg.cor + "22" }]}>
                <Text style={{ fontSize: 30 }}>{seg.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.tipo}>{seg.tipo}</Text>
                <Text style={s.sub}>{seg.veiculo}</Text>
              </View>
              <View style={s.badge}>
                <Text style={s.badgeText}>{seg.status}</Text>
              </View>
            </View>
            <View style={s.divider} />
            <View style={s.cardBottom}>
              <View>
                <Text style={s.infoLabel}>Apólice</Text>
                <Text style={s.infoVal}>{seg.apolice}</Text>
              </View>
              <View>
                <Text style={s.infoLabel}>Vencimento</Text>
                <Text style={s.infoVal}>{seg.venc}</Text>
              </View>
              <View>
                <Text style={s.infoLabel}>Prêmio</Text>
                <Text style={[s.infoVal, { color: "#0D2B6E" }]}>{seg.premio}</Text>
              </View>
            </View>
            <Text style={s.detalhes}>Ver detalhes →</Text>
          </TouchableOpacity>
        ))}
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
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 14, elevation: 3, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  iconBox: { width: 54, height: 54, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  tipo: { fontSize: 17, fontWeight: "700", color: "#0D2B6E" },
  sub: { fontSize: 12, color: "#666", marginTop: 2 },
  badge: { backgroundColor: "#DCFCE7", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: "#16A34A", fontSize: 11, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#F0F4FB", marginBottom: 12 },
  cardBottom: { flexDirection: "row", justifyContent: "space-between" },
  infoLabel: { fontSize: 10, color: "#aaa", marginBottom: 2 },
  infoVal: { fontSize: 13, fontWeight: "600", color: "#333" },
  detalhes: { color: "#0D2B6E", fontSize: 12, fontWeight: "700", marginTop: 12, textAlign: "right" },
});
