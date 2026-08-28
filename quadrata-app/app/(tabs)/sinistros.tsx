import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../../constants/api";

type Sinistro = { id: number; protocolo: string; tipo: string; data_ocorrido: string; local: string; status: string };

const COR_STATUS: Record<string, string> = {
  "Em análise": "#EA580C", "Concluído": "#16A34A", "Negado": "#DC2626", "Aguardando documentos": "#B45309",
};

export default function Sinistros() {
  const [sinistros, setSinistros] = useState<Sinistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const token = await AsyncStorage.getItem("@token");
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/api/cliente/sinistros`, { headers: { Authorization: "Bearer " + token } });
      if (res.ok) setSinistros(await res.json());
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const fmtDate = (s: string) => s ? s.split("-").reverse().join("/") : "-";

  return (
    <View style={s.root}>
      <SafeAreaView style={s.header} edges={["top"]}>
        <Text style={s.headerTitle}>Sinistros</Text>
        <Text style={s.headerSub}>Histórico de acionamentos</Text>
      </SafeAreaView>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <TouchableOpacity style={s.newBtn} onPress={() => router.push("/screens/sinistro" as any)}>
          <Text style={s.newBtnText}>+ Acionar Novo Sinistro</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator color="#0D2B6E" style={{ marginTop: 30 }} />
        ) : sinistros.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>📭</Text>
            <Text style={s.emptyText}>Nenhum sinistro registrado</Text>
          </View>
        ) : sinistros.map((sin) => {
          const cor = COR_STATUS[sin.status] || "#6B7280";
          return (
            <View key={sin.id} style={s.card}>
              <View style={s.row}>
                <Text style={s.tipo}>🚨 {sin.tipo}</Text>
                <View style={[s.badge, { backgroundColor: cor + "22" }]}>
                  <Text style={[s.badgeText, { color: cor }]}>{sin.status}</Text>
                </View>
              </View>
              {sin.local ? <Text style={s.veiculo}>{sin.local}</Text> : null}
              <Text style={s.meta}>Protocolo: {sin.protocolo}  •  Data: {fmtDate(sin.data_ocorrido)}</Text>
            </View>
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
  newBtn: { backgroundColor: "#0D2B6E", borderRadius: 12, padding: 14, alignItems: "center", marginBottom: 16 },
  newBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  empty: { alignItems: "center", marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: "#aaa", fontSize: 15 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 12, elevation: 2, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  tipo: { fontSize: 15, fontWeight: "700", color: "#0D2B6E" },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  veiculo: { color: "#444", fontSize: 13, marginBottom: 4 },
  meta: { color: "#aaa", fontSize: 11 },
});
