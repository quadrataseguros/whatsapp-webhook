import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";

const SEGURO = {
  tipo: "Automóvel",
  emoji: "🚗",
  cor: "#2563EB",
  apolice: "APL-2024-0012",
  status: "Vigente",
  veiculo: "Toyota Corolla 2.0 XEI 2022",
  placa: "ABC-1D34",
  chassi: "9BWZZZ377VT004251",
  inicio: "12/12/2024",
  fim: "12/12/2025",
  premio: "R$ 189,00/mês",
  franquia: "R$ 2.300,00",
  coberturas: [
    { label: "Colisão (casco)", incl: true },
    { label: "Incêndio e explosão", incl: true },
    { label: "Roubo e furto", incl: true },
    { label: "Danos a terceiros (RCF)", incl: true },
    { label: "Vidros", incl: true },
    { label: "Carro reserva (30 dias)", incl: true },
    { label: "Seguro de acidentes pessoais", incl: false },
    { label: "Fenômenos naturais", incl: false },
  ],
  seguradora: "Porto Seguro",
  corretor: "Quadrata Seguros – (11) 9999-9999",
};

export default function SeguroDetalhe() {
  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={[s.hero, { backgroundColor: SEGURO.cor }]}>
        <Text style={s.heroEmoji}>{SEGURO.emoji}</Text>
        <View>
          <Text style={s.heroTipo}>{SEGURO.tipo}</Text>
          <Text style={s.heroVeiculo}>{SEGURO.veiculo}</Text>
          <Text style={s.heroPlaca}>Placa: {SEGURO.placa}</Text>
        </View>
        <View style={s.heroBadge}><Text style={s.heroBadgeText}>{SEGURO.status}</Text></View>
      </View>

      {/* Info grid */}
      <View style={s.infoGrid}>
        {[
          { label: "Apólice", val: SEGURO.apolice },
          { label: "Vigência", val: `${SEGURO.inicio} – ${SEGURO.fim}` },
          { label: "Prêmio", val: SEGURO.premio },
          { label: "Franquia", val: SEGURO.franquia },
          { label: "Seguradora", val: SEGURO.seguradora },
          { label: "Chassi", val: SEGURO.chassi },
        ].map((item) => (
          <View key={item.label} style={s.infoItem}>
            <Text style={s.infoLabel}>{item.label}</Text>
            <Text style={s.infoVal}>{item.val}</Text>
          </View>
        ))}
      </View>

      {/* Coberturas */}
      <Text style={s.sectionTitle}>Coberturas</Text>
      <View style={s.card}>
        {SEGURO.coberturas.map((cob) => (
          <View key={cob.label} style={s.cobRow}>
            <Text style={{ fontSize: 16 }}>{cob.incl ? "✅" : "❌"}</Text>
            <Text style={[s.cobLabel, !cob.incl && s.cobLabelOff]}>{cob.label}</Text>
          </View>
        ))}
      </View>

      {/* Corretor */}
      <Text style={s.sectionTitle}>Corretor Responsável</Text>
      <View style={s.card}>
        <Text style={s.corretorText}>🧑‍💼 {SEGURO.corretor}</Text>
      </View>

      {/* Actions */}
      <View style={s.actions}>
        <TouchableOpacity style={s.btn} onPress={() => router.push("/screens/sinistro" as any)}>
          <Text style={s.btnText}>🚨 Acionar Sinistro</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.btnOutline]} onPress={() => router.push("/screens/boleto" as any)}>
          <Text style={s.btnOutlineText}>📄 2ª Via Boleto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, { backgroundColor: "#16A34A" }]} onPress={() => router.push("/screens/assistencia" as any)}>
          <Text style={s.btnText}>🆘 Assistência 24h</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F3F6FC" },
  scroll: { padding: 16 },
  hero: { borderRadius: 18, padding: 18, flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16, position: "relative" },
  heroEmoji: { fontSize: 40 },
  heroTipo: { color: "#fff", fontWeight: "800", fontSize: 18 },
  heroVeiculo: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 2 },
  heroPlaca: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 1 },
  heroBadge: { position: "absolute", top: 14, right: 14, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  heroBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  infoGrid: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 14, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, flexDirection: "row", flexWrap: "wrap", gap: 14 },
  infoItem: { width: "45%" },
  infoLabel: { fontSize: 10, color: "#aaa", marginBottom: 2 },
  infoVal: { fontSize: 13, fontWeight: "700", color: "#222" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0D2B6E", marginBottom: 10 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 14, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6 },
  cobRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: "#F3F6FC" },
  cobLabel: { fontSize: 13, color: "#333", fontWeight: "500" },
  cobLabelOff: { color: "#bbb", textDecorationLine: "line-through" },
  corretorText: { fontSize: 14, color: "#0D2B6E", fontWeight: "600" },
  actions: { gap: 10 },
  btn: { backgroundColor: "#0D2B6E", borderRadius: 14, padding: 15, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  btnOutline: { backgroundColor: "#fff", borderWidth: 2, borderColor: "#0D2B6E" },
  btnOutlineText: { color: "#0D2B6E", fontWeight: "700", fontSize: 15 },
});
