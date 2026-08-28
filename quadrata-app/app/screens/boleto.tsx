import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BOLETOS = [
  { apolice: "APL-2024-0012", tipo: "Automóvel", venc: "15/09/2025", valor: "R$ 189,00", status: "Em aberto", emoji: "🚗" },
  { apolice: "APL-2024-0005", tipo: "Residência", venc: "20/09/2025", valor: "R$ 67,00", status: "Em aberto", emoji: "🏠" },
  { apolice: "APL-2024-0012", tipo: "Automóvel", venc: "15/08/2025", valor: "R$ 189,00", status: "Pago", emoji: "🚗" },
  { apolice: "APL-2024-0005", tipo: "Residência", venc: "20/08/2025", valor: "R$ 67,00", status: "Pago", emoji: "🏠" },
];

export default function Boleto() {
  const copiar = (linha: string) => {
    Alert.alert("Copiado!", "Linha digitável copiada para a área de transferência.");
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <View style={s.infoCard}>
        <Text style={s.infoText}>📋 Solicite aqui a 2ª via dos seus boletos. Para pagamentos vencidos há mais de 30 dias, entre em contato com nosso corretor.</Text>
      </View>

      {["Em aberto", "Pago"].map((grupo) => (
        <View key={grupo}>
          <Text style={s.sectionTitle}>{grupo === "Em aberto" ? "⏳ Em Aberto" : "✅ Pagos"}</Text>
          {BOLETOS.filter((b) => b.status === grupo).map((b, i) => (
            <View key={i} style={s.card}>
              <View style={s.cardTop}>
                <Text style={{ fontSize: 24 }}>{b.emoji}</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={s.cardTipo}>{b.tipo}</Text>
                  <Text style={s.cardApolice}>Apólice: {b.apolice}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: grupo === "Em aberto" ? "#FEF3C7" : "#DCFCE7" }]}>
                  <Text style={[s.badgeText, { color: grupo === "Em aberto" ? "#B45309" : "#16A34A" }]}>{b.status}</Text>
                </View>
              </View>
              <View style={s.rowInfo}>
                <View>
                  <Text style={s.infoLabel}>Vencimento</Text>
                  <Text style={s.infoVal}>{b.venc}</Text>
                </View>
                <View>
                  <Text style={s.infoLabel}>Valor</Text>
                  <Text style={[s.infoVal, { color: "#0D2B6E", fontWeight: "700" }]}>{b.valor}</Text>
                </View>
              </View>
              {grupo === "Em aberto" && (
                <View style={s.actions}>
                  <TouchableOpacity style={s.btnCopiar} onPress={() => copiar("")}>
                    <Text style={s.btnCopiarText}>📋 Copiar código</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.btnPix}>
                    <Text style={s.btnPixText}>💠 Pagar via Pix</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      ))}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F3F6FC" },
  scroll: { padding: 16 },
  infoCard: { backgroundColor: "#EBF0FB", borderRadius: 14, padding: 14, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: "#0D2B6E" },
  infoText: { color: "#0D2B6E", fontSize: 13, lineHeight: 18 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0D2B6E", marginBottom: 10, marginTop: 8 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6 },
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  cardTipo: { fontSize: 15, fontWeight: "700", color: "#0D2B6E" },
  cardApolice: { fontSize: 12, color: "#888", marginTop: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  rowInfo: { flexDirection: "row", gap: 30, marginBottom: 12 },
  infoLabel: { fontSize: 10, color: "#aaa", marginBottom: 2 },
  infoVal: { fontSize: 14, fontWeight: "600", color: "#333" },
  actions: { flexDirection: "row", gap: 8 },
  btnCopiar: { flex: 1, backgroundColor: "#F3F6FC", borderRadius: 10, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#E0E8F5" },
  btnCopiarText: { fontSize: 13, fontWeight: "600", color: "#0D2B6E" },
  btnPix: { flex: 1, backgroundColor: "#0D2B6E", borderRadius: 10, padding: 12, alignItems: "center" },
  btnPixText: { fontSize: 13, fontWeight: "600", color: "#fff" },
});
