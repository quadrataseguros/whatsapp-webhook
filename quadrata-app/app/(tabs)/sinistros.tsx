import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const SINISTROS = [
  { id: "SIN-2024-001", tipo: "Colisão", veiculo: "Toyota Corolla 2022", data: "10/03/2024", status: "Em análise", cor: "#EA580C" },
  { id: "SIN-2023-004", tipo: "Furto de acessório", veiculo: "Toyota Corolla 2022", data: "22/11/2023", status: "Concluído", cor: "#16A34A" },
];

export default function Sinistros() {
  return (
    <View style={s.root}>
      <SafeAreaView style={s.header} edges={["top"]}>
        <Text style={s.headerTitle}>Sinistros</Text>
        <Text style={s.headerSub}>Histórico de acionamentos</Text>
      </SafeAreaView>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={s.newBtn} onPress={() => router.push("/screens/sinistro" as any)}>
          <Text style={s.newBtnText}>+ Acionar Novo Sinistro</Text>
        </TouchableOpacity>

        {SINISTROS.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>📭</Text>
            <Text style={s.emptyText}>Nenhum sinistro registrado</Text>
          </View>
        ) : (
          SINISTROS.map((sin) => (
            <View key={sin.id} style={s.card}>
              <View style={s.row}>
                <Text style={s.tipo}>🚨 {sin.tipo}</Text>
                <View style={[s.badge, { backgroundColor: sin.cor + "22" }]}>
                  <Text style={[s.badgeText, { color: sin.cor }]}>{sin.status}</Text>
                </View>
              </View>
              <Text style={s.veiculo}>{sin.veiculo}</Text>
              <Text style={s.meta}>Protocolo: {sin.id}  •  Data: {sin.data}</Text>
            </View>
          ))
        )}
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
