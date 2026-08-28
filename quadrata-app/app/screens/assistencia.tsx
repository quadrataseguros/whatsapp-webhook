import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from "react-native";

const SERVICOS = [
  { label: "Guincho 24h", emoji: "🚚", desc: "Reboque em caso de pane ou acidente", tel: "0800-000-0001", cor: "#2563EB" },
  { label: "Pane Seca", emoji: "⛽", desc: "Abastecimento emergencial gratuito", tel: "0800-000-0002", cor: "#EA580C" },
  { label: "Chaveiro 24h", emoji: "🔑", desc: "Abertura de veículo e residência", tel: "0800-000-0003", cor: "#9333EA" },
  { label: "Vidraceiro", emoji: "🔲", desc: "Troca de vidros emergencial", tel: "0800-000-0004", cor: "#0891B2" },
  { label: "Táxi/Translado", emoji: "🚕", desc: "Transporte após sinistro", tel: "0800-000-0005", cor: "#16A34A" },
  { label: "Hotel", emoji: "🏨", desc: "Hospedagem em caso de sinistro total", tel: "0800-000-0006", cor: "#B45309" },
  { label: "Médico 24h", emoji: "🏥", desc: "Orientação médica por telefone", tel: "0800-000-0007", cor: "#DC2626" },
  { label: "Seguro Viagem", emoji: "✈️", desc: "Assistência em viagens nacionais/internacionais", tel: "0800-000-0008", cor: "#7C3AED" },
];

export default function Assistencia() {
  const call = (tel: string) => Linking.openURL(`tel:${tel.replace(/\D/g, "")}`);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <View style={s.banner}>
        <Text style={s.bannerEmoji}>🆘</Text>
        <View>
          <Text style={s.bannerTitle}>Assistência 24 horas</Text>
          <Text style={s.bannerSub}>Disponível todos os dias, o ano inteiro</Text>
        </View>
      </View>

      <View style={s.centralCard}>
        <Text style={s.centralLabel}>Central de Atendimento</Text>
        <Text style={s.centralTel}>0800-722-0000</Text>
        <TouchableOpacity style={s.centralBtn} onPress={() => call("08007220000")}>
          <Text style={s.centralBtnText}>📞  Ligar Agora</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.sectionTitle}>Serviços Disponíveis</Text>
      {SERVICOS.map((srv) => (
        <View key={srv.label} style={s.card}>
          <View style={[s.iconBox, { backgroundColor: srv.cor + "22" }]}>
            <Text style={{ fontSize: 26 }}>{srv.emoji}</Text>
          </View>
          <View style={s.cardInfo}>
            <Text style={s.cardLabel}>{srv.label}</Text>
            <Text style={s.cardDesc}>{srv.desc}</Text>
          </View>
          <TouchableOpacity style={s.callBtn} onPress={() => call(srv.tel)}>
            <Text style={s.callBtnText}>📞</Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F3F6FC" },
  scroll: { padding: 16 },
  banner: { backgroundColor: "#0D2B6E", borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 },
  bannerEmoji: { fontSize: 36 },
  bannerTitle: { color: "#fff", fontWeight: "800", fontSize: 16 },
  bannerSub: { color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 },
  centralCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 20, elevation: 3, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8 },
  centralLabel: { color: "#aaa", fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  centralTel: { color: "#0D2B6E", fontSize: 28, fontWeight: "900", letterSpacing: 2, marginBottom: 14 },
  centralBtn: { backgroundColor: "#0D2B6E", borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 },
  centralBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0D2B6E", marginBottom: 12 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 10, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6 },
  iconBox: { width: 50, height: 50, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 12 },
  cardInfo: { flex: 1 },
  cardLabel: { fontSize: 14, fontWeight: "700", color: "#0D2B6E" },
  cardDesc: { fontSize: 12, color: "#888", marginTop: 2 },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#EBF0FB", justifyContent: "center", alignItems: "center" },
  callBtnText: { fontSize: 20 },
});
