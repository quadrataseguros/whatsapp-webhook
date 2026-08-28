import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import * as Clipboard from "expo-clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../../constants/api";

type Boleto = {
  id: number; vencimento: string; valor: string; status: string;
  linha_digitavel: string; pix_copia_cola: string; tipo: string; numero: string;
};

const TIPO_EMOJI: Record<string, string> = {
  "Automóvel":"🚗","Residência":"🏠","Vida":"❤️","Saúde":"🏥","Empresarial":"🏢","Outro":"📋",
};

export default function BoletoScreen() {
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("@token");
      if (!token) { setLoading(false); return; }
      try {
        const res = await fetch(`${API_BASE}/api/cliente/boletos`, { headers: { Authorization: "Bearer " + token } });
        if (res.ok) setBoletos(await res.json());
      } catch {}
      setLoading(false);
    })();
  }, []);

  const copiar = async (texto: string, label: string) => {
    if (!texto) { Alert.alert("Indisponível", `${label} ainda não foi cadastrado para este boleto.`); return; }
    await Clipboard.setStringAsync(texto);
    Alert.alert("Copiado!", `${label} copiado para a área de transferência.`);
  };

  const fmtDate = (s: string) => s ? s.split("-").reverse().join("/") : "-";
  const abertos = boletos.filter(b => b.status !== "Pago");
  const pagos = boletos.filter(b => b.status === "Pago");

  const renderBoleto = (b: Boleto) => (
    <View key={b.id} style={s.card}>
      <View style={s.cardTop}>
        <Text style={{ fontSize: 24 }}>{TIPO_EMOJI[b.tipo] || "📋"}</Text>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.cardTipo}>{b.tipo}</Text>
          <Text style={s.cardApolice}>Apólice: {b.numero}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: b.status === "Pago" ? "#DCFCE7" : b.status === "Vencido" ? "#FEE2E2" : "#FEF3C7" }]}>
          <Text style={[s.badgeText, { color: b.status === "Pago" ? "#16A34A" : b.status === "Vencido" ? "#DC2626" : "#B45309" }]}>{b.status}</Text>
        </View>
      </View>
      <View style={s.rowInfo}>
        <View><Text style={s.infoLabel}>Vencimento</Text><Text style={s.infoVal}>{fmtDate(b.vencimento)}</Text></View>
        <View><Text style={s.infoLabel}>Valor</Text><Text style={[s.infoVal, { color: "#0D2B6E", fontWeight: "700" }]}>{b.valor}</Text></View>
      </View>
      {b.status !== "Pago" && (
        <View style={s.actions}>
          <TouchableOpacity style={s.btnCopiar} onPress={() => copiar(b.linha_digitavel, "Código de barras")}>
            <Text style={s.btnCopiarText}>📋 Copiar código</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnPix} onPress={() => copiar(b.pix_copia_cola, "PIX")}>
            <Text style={s.btnPixText}>💠 Pagar via Pix</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <View style={s.infoCard}>
        <Text style={s.infoText}>📋 Seus boletos aparecem aqui assim que emitidos. Para dúvidas, fale com nosso corretor.</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#0D2B6E" style={{ marginTop: 40 }} />
      ) : boletos.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>📄</Text>
          <Text style={s.emptyText}>Nenhum boleto disponível</Text>
        </View>
      ) : (
        <>
          {abertos.length > 0 && <><Text style={s.sectionTitle}>⏳ Em Aberto</Text>{abertos.map(renderBoleto)}</>}
          {pagos.length > 0 && <><Text style={s.sectionTitle}>✅ Pagos</Text>{pagos.map(renderBoleto)}</>}
        </>
      )}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F3F6FC" },
  scroll: { padding: 16 },
  infoCard: { backgroundColor: "#EBF0FB", borderRadius: 14, padding: 14, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: "#0D2B6E" },
  infoText: { color: "#0D2B6E", fontSize: 13, lineHeight: 18 },
  empty: { alignItems: "center", marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: "#aaa", fontSize: 15 },
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
