import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from "react-native";
import { CONTATOS, CORRETORA, waLink } from "../../constants/contato";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../../constants/api";

type Apolice = {
  id: number; tipo: string; numero: string; seguradora: string; descricao: string;
  vigencia_inicio: string; vigencia_fim: string; premio_mensal: string; franquia: string;
  coberturas: string[]; status: string;
};

const TIPO_EMOJI: Record<string, string> = {
  "Automóvel":"🚗","Residência":"🏠","Vida":"❤️","Saúde":"🏥",
  "Empresarial":"🏢","Previdência":"💰","Embarcações":"⛵","Responsabilidade Civil":"⚖️","Outro":"📋",
};
const TIPO_COR: Record<string, string> = {
  "Automóvel":"#2563EB","Residência":"#16A34A","Vida":"#DC2626","Saúde":"#0891B2",
  "Empresarial":"#9333EA","Previdência":"#B45309","Embarcações":"#0D9488","Responsabilidade Civil":"#7C3AED","Outro":"#6B7280",
};

export default function SeguroDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ap, setAp] = useState<Apolice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("@token");
      if (!token || !id) { setLoading(false); return; }
      try {
        const res = await fetch(`${API_BASE}/api/cliente/apolices/${id}`, { headers: { Authorization: "Bearer " + token } });
        if (res.ok) setAp(await res.json());
      } catch {}
      setLoading(false);
    })();
  }, [id]);

  const fmtDate = (s: string) => s ? s.split("-").reverse().join("/") : "-";

  if (loading) return <View style={s.center}><ActivityIndicator color="#0D2B6E" size="large" /></View>;
  if (!ap) return <View style={s.center}><Text style={s.notFound}>Apólice não encontrada</Text></View>;

  const cor = TIPO_COR[ap.tipo] || "#6B7280";
  const emoji = TIPO_EMOJI[ap.tipo] || "📋";

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <View style={[s.hero, { backgroundColor: cor }]}>
        <Text style={s.heroEmoji}>{emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.heroTipo}>{ap.tipo}</Text>
          {ap.descricao ? <Text style={s.heroVeiculo}>{ap.descricao}</Text> : null}
          <Text style={s.heroPlaca}>Apólice: {ap.numero}</Text>
        </View>
        <View style={s.heroBadge}><Text style={s.heroBadgeText}>{ap.status}</Text></View>
      </View>

      <View style={s.infoGrid}>
        {[
          { label: "Apólice", val: ap.numero },
          { label: "Seguradora", val: ap.seguradora || "-" },
          { label: "Início da vigência", val: fmtDate(ap.vigencia_inicio) },
          { label: "Fim da vigência", val: fmtDate(ap.vigencia_fim) },
          { label: "Prêmio mensal", val: ap.premio_mensal || "-" },
          { label: "Franquia", val: ap.franquia || "-" },
        ].map((item) => (
          <View key={item.label} style={s.infoItem}>
            <Text style={s.infoLabel}>{item.label}</Text>
            <Text style={s.infoVal}>{item.val}</Text>
          </View>
        ))}
      </View>

      {ap.coberturas?.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Coberturas</Text>
          <View style={s.card}>
            {ap.coberturas.map((cob, i) => (
              <View key={i} style={s.cobRow}>
                <Text style={{ fontSize: 16 }}>✅</Text>
                <Text style={s.cobLabel}>{cob}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Text style={s.sectionTitle}>Corretor Responsável</Text>
      <View style={s.card}>
        <Text style={s.corretorNome}>🧑‍💼 {CORRETORA}</Text>
        <TouchableOpacity style={s.corretorLinha} onPress={() => Linking.openURL(waLink(CONTATOS.escritorio.whatsapp))}>
          <Text style={s.corretorText}>📞 {CONTATOS.escritorio.display}</Text>
          <Text style={s.corretorWpp}>WhatsApp →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.corretorLinha} onPress={() => Linking.openURL(waLink(CONTATOS.mariana.whatsapp))}>
          <Text style={s.corretorText}>🤖 {CONTATOS.mariana.display} · 24h</Text>
          <Text style={s.corretorWpp}>WhatsApp →</Text>
        </TouchableOpacity>
      </View>

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
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F3F6FC" },
  notFound: { color: "#aaa", fontSize: 15 },
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
  corretorNome: { fontSize: 15, color: "#0D2B6E", fontWeight: "700", marginBottom: 8 },
  corretorLinha: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#F3F6FC" },
  corretorText: { fontSize: 13, color: "#444", fontWeight: "600" },
  corretorWpp: { fontSize: 12, color: "#16A34A", fontWeight: "700" },
  actions: { gap: 10 },
  btn: { backgroundColor: "#0D2B6E", borderRadius: 14, padding: 15, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  btnOutline: { backgroundColor: "#fff", borderWidth: 2, borderColor: "#0D2B6E" },
  btnOutlineText: { color: "#0D2B6E", fontWeight: "700", fontSize: 15 },
});
