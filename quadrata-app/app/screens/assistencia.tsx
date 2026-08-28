import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from "react-native";
import { CONTATOS, waLink, telLink } from "../../constants/contato";

const SERVICOS = [
  { label: "Guincho 24h", emoji: "🚚", desc: "Reboque em caso de pane ou acidente", cor: "#2563EB" },
  { label: "Pane Seca", emoji: "⛽", desc: "Abastecimento emergencial", cor: "#EA580C" },
  { label: "Chaveiro 24h", emoji: "🔑", desc: "Abertura de veículo e residência", cor: "#9333EA" },
  { label: "Vidraceiro", emoji: "🔲", desc: "Troca de vidros emergencial", cor: "#0891B2" },
  { label: "Táxi/Translado", emoji: "🚕", desc: "Transporte após sinistro", cor: "#16A34A" },
  { label: "Hotel", emoji: "🏨", desc: "Hospedagem em caso de sinistro", cor: "#B45309" },
  { label: "Médico 24h", emoji: "🏥", desc: "Orientação médica por telefone", cor: "#DC2626" },
  { label: "Seguro Viagem", emoji: "✈️", desc: "Assistência em viagens", cor: "#7C3AED" },
];

export default function Assistencia() {
  const acionar = (servico: string) =>
    Linking.openURL(waLink(CONTATOS.mariana.whatsapp, `Preciso acionar a assistência: ${servico}`));

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <View style={s.banner}>
        <Text style={s.bannerEmoji}>🆘</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.bannerTitle}>Assistência 24 horas</Text>
          <Text style={s.bannerSub}>Estamos com você todos os dias, a qualquer hora</Text>
        </View>
      </View>

      {/* Canal principal — MarIAna 24h */}
      <View style={s.centralCard}>
        <Text style={s.centralLabel}>{CONTATOS.mariana.label}</Text>
        <Text style={s.centralTel}>{CONTATOS.mariana.display}</Text>
        <Text style={s.centralHorario}>{CONTATOS.mariana.horario}</Text>
        <View style={s.centralBtns}>
          <TouchableOpacity style={s.btnWpp} onPress={() => Linking.openURL(waLink(CONTATOS.mariana.whatsapp, "Preciso de assistência 24h"))}>
            <Text style={s.btnWppText}>💬  WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnLigar} onPress={() => Linking.openURL(telLink(CONTATOS.mariana.tel))}>
            <Text style={s.btnLigarText}>📞  Ligar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Escritório */}
      <View style={s.escritorioCard}>
        <View style={{ flex: 1 }}>
          <Text style={s.escritorioLabel}>{CONTATOS.escritorio.label}</Text>
          <Text style={s.escritorioTel}>{CONTATOS.escritorio.display}</Text>
          <Text style={s.escritorioHorario}>{CONTATOS.escritorio.horario}</Text>
        </View>
        <TouchableOpacity style={s.escritorioBtn} onPress={() => Linking.openURL(waLink(CONTATOS.escritorio.whatsapp))}>
          <Text style={s.escritorioBtnText}>💬</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.escritorioBtn} onPress={() => Linking.openURL(telLink(CONTATOS.escritorio.tel))}>
          <Text style={s.escritorioBtnText}>📞</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.sectionTitle}>Serviços de Assistência</Text>
      <Text style={s.sectionSub}>Toque para acionar pelo WhatsApp. A cobertura varia conforme sua apólice.</Text>

      {SERVICOS.map((srv) => (
        <TouchableOpacity key={srv.label} style={s.card} activeOpacity={0.8} onPress={() => acionar(srv.label)}>
          <View style={[s.iconBox, { backgroundColor: srv.cor + "22" }]}>
            <Text style={{ fontSize: 26 }}>{srv.emoji}</Text>
          </View>
          <View style={s.cardInfo}>
            <Text style={s.cardLabel}>{srv.label}</Text>
            <Text style={s.cardDesc}>{srv.desc}</Text>
          </View>
          <View style={s.acionarBtn}>
            <Text style={s.acionarText}>Acionar</Text>
          </View>
        </TouchableOpacity>
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
  centralCard: { backgroundColor: "#16A34A", borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 12 },
  centralLabel: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  centralTel: { color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: 1, marginTop: 4 },
  centralHorario: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2, marginBottom: 14 },
  centralBtns: { flexDirection: "row", gap: 10, alignSelf: "stretch" },
  btnWpp: { flex: 1, backgroundColor: "rgba(255,255,255,0.22)", borderRadius: 12, padding: 12, alignItems: "center" },
  btnWppText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  btnLigar: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 12, alignItems: "center" },
  btnLigarText: { color: "#16A34A", fontWeight: "700", fontSize: 14 },
  escritorioCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6 },
  escritorioLabel: { fontSize: 11, color: "#aaa", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  escritorioTel: { fontSize: 17, fontWeight: "800", color: "#0D2B6E", marginTop: 2 },
  escritorioHorario: { fontSize: 11, color: "#888", marginTop: 1 },
  escritorioBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#EBF0FB", justifyContent: "center", alignItems: "center" },
  escritorioBtnText: { fontSize: 19 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0D2B6E", marginBottom: 4 },
  sectionSub: { fontSize: 12, color: "#888", marginBottom: 14, lineHeight: 17 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 10, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6 },
  iconBox: { width: 50, height: 50, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 12 },
  cardInfo: { flex: 1 },
  cardLabel: { fontSize: 14, fontWeight: "700", color: "#0D2B6E" },
  cardDesc: { fontSize: 12, color: "#888", marginTop: 2 },
  acionarBtn: { backgroundColor: "#16A34A", borderRadius: 9, paddingHorizontal: 14, paddingVertical: 8 },
  acionarText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});
