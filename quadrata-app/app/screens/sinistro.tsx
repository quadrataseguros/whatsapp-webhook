import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../../constants/api";

const TIPOS = ["Colisão", "Furto/Roubo", "Incêndio", "Alagamento", "Terceiros", "Vidros", "Outros"];

type Apolice = { id: number; tipo: string; numero: string };

export default function Sinistro() {
  const [tipo, setTipo] = useState("");
  const [data, setData] = useState("");
  const [local, setLocal] = useState("");
  const [desc, setDesc] = useState("");
  const [apolices, setApolices] = useState<Apolice[]>([]);
  const [apoliceId, setApoliceId] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("@token");
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/api/cliente/apolices`, { headers: { Authorization: "Bearer " + token } });
        if (res.ok) {
          const list = await res.json();
          setApolices(list);
          if (list.length === 1) setApoliceId(list[0].id);
        }
      } catch {}
    })();
  }, []);

  const toISO = (br: string) => {
    const p = br.replace(/\D/g, "");
    if (p.length !== 8) return "";
    return `${p.slice(4)}-${p.slice(2,4)}-${p.slice(0,2)}`;
  };

  const fmtData = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 8);
    if (n.length <= 2) return n;
    if (n.length <= 4) return `${n.slice(0,2)}/${n.slice(2)}`;
    return `${n.slice(0,2)}/${n.slice(2,4)}/${n.slice(4)}`;
  };

  const submit = async () => {
    if (!tipo || !data || !local || !desc) { Alert.alert("Atenção", "Preencha todos os campos."); return; }
    const token = await AsyncStorage.getItem("@token");
    if (!token) { Alert.alert("Erro", "Sessão expirada. Faça login novamente."); return; }
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/cliente/sinistro`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ apolice_id: apoliceId, tipo, data_ocorrido: toISO(data), local, descricao: desc }),
      });
      const json = await res.json();
      if (!res.ok) { Alert.alert("Erro", json.erro || "Não foi possível registrar."); return; }
      Alert.alert("Sinistro Registrado", `Protocolo: ${json.protocolo}\n\nNossa equipe entrará em contato em até 24h.`,
        [{ text: "OK", onPress: () => router.back() }]);
    } catch {
      Alert.alert("Erro", "Não foi possível conectar ao servidor.");
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <View style={s.alertCard}>
        <Text style={s.alertTitle}>🚨 Emergência?</Text>
        <Text style={s.alertText}>Se houver risco à vida, acione o SAMU (192) ou Bombeiros (193) imediatamente.</Text>
      </View>

      {apolices.length > 1 && (
        <>
          <Text style={s.sectionTitle}>Apólice envolvida</Text>
          <View style={s.chipGroup}>
            {apolices.map((a) => (
              <TouchableOpacity key={a.id} style={[s.chip, apoliceId === a.id && s.chipSel]} onPress={() => setApoliceId(a.id)}>
                <Text style={[s.chipText, apoliceId === a.id && s.chipTextSel]}>{a.tipo} — {a.numero}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={s.sectionTitle}>Tipo de sinistro</Text>
      <View style={s.chipGroup}>
        {TIPOS.map((t) => (
          <TouchableOpacity key={t} style={[s.chip, tipo === t && s.chipSel]} onPress={() => setTipo(t)}>
            <Text style={[s.chipText, tipo === t && s.chipTextSel]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Data do ocorrido</Text>
      <TextInput style={s.input} placeholder="DD/MM/AAAA" placeholderTextColor="#aaa" value={data} onChangeText={v => setData(fmtData(v))} keyboardType="numeric" maxLength={10} />

      <Text style={s.label}>Local do ocorrido</Text>
      <TextInput style={s.input} placeholder="Endereço completo" placeholderTextColor="#aaa" value={local} onChangeText={setLocal} />

      <Text style={s.label}>Descrição detalhada</Text>
      <TextInput style={[s.input, s.textarea]} placeholder="Descreva o que aconteceu com o máximo de detalhes..." placeholderTextColor="#aaa" value={desc} onChangeText={setDesc} multiline numberOfLines={5} textAlignVertical="top" />

      <TouchableOpacity style={[s.btn, sending && { opacity: 0.7 }]} onPress={submit} disabled={sending}>
        {sending ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>📋  Registrar Sinistro</Text>}
      </TouchableOpacity>
      <Text style={s.info}>Após o registro, você receberá um protocolo e nossa equipe entrará em contato.</Text>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F3F6FC" },
  scroll: { padding: 16 },
  alertCard: { backgroundColor: "#FEF2F2", borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: "#DC2626", marginBottom: 20 },
  alertTitle: { fontSize: 15, fontWeight: "700", color: "#DC2626", marginBottom: 4 },
  alertText: { fontSize: 13, color: "#B91C1C", lineHeight: 18 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0D2B6E", marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6 },
  chipGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1.5, borderColor: "#E0E8F5" },
  chipSel: { borderColor: "#DC2626", backgroundColor: "#FEF2F2" },
  chipText: { fontSize: 13, color: "#555", fontWeight: "600" },
  chipTextSel: { color: "#DC2626" },
  input: { backgroundColor: "#fff", borderRadius: 12, padding: 14, fontSize: 14, color: "#222", borderWidth: 1, borderColor: "#E0E8F5", marginBottom: 14 },
  textarea: { height: 120 },
  btn: { backgroundColor: "#DC2626", borderRadius: 14, padding: 16, alignItems: "center", marginTop: 4 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  info: { color: "#aaa", fontSize: 12, textAlign: "center", marginTop: 12, lineHeight: 18 },
});
