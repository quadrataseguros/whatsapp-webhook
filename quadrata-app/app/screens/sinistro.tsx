import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";

const TIPOS = ["Colisão", "Furto/Roubo", "Incêndio", "Alagamento", "Terceiros", "Vidros", "Outros"];

export default function Sinistro() {
  const [tipo, setTipo] = useState("");
  const [data, setData] = useState("");
  const [local, setLocal] = useState("");
  const [desc, setDesc] = useState("");

  const submit = () => {
    if (!tipo || !data || !local || !desc) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }
    Alert.alert(
      "Sinistro Registrado",
      "Protocolo gerado com sucesso! Nossa equipe entrará em contato em até 24h.\n\nProtocolo: SIN-2024-" + Math.floor(Math.random() * 900 + 100),
      [{ text: "OK" }]
    );
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <View style={s.alertCard}>
        <Text style={s.alertTitle}>🚨 Emergência?</Text>
        <Text style={s.alertText}>Se houver risco à vida, acione o SAMU (192) ou Bombeiros (193) imediatamente.</Text>
      </View>

      <Text style={s.sectionTitle}>Tipo de sinistro</Text>
      <View style={s.chipGroup}>
        {TIPOS.map((t) => (
          <TouchableOpacity key={t} style={[s.chip, tipo === t && s.chipSel]} onPress={() => setTipo(t)}>
            <Text style={[s.chipText, tipo === t && s.chipTextSel]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Data do ocorrido</Text>
      <TextInput style={s.input} placeholder="DD/MM/AAAA" placeholderTextColor="#aaa" value={data} onChangeText={setData} keyboardType="numeric" />

      <Text style={s.label}>Local do ocorrido</Text>
      <TextInput style={s.input} placeholder="Endereço completo" placeholderTextColor="#aaa" value={local} onChangeText={setLocal} />

      <Text style={s.label}>Descrição detalhada</Text>
      <TextInput style={[s.input, s.textarea]} placeholder="Descreva o que aconteceu com o máximo de detalhes..." placeholderTextColor="#aaa" value={desc} onChangeText={setDesc} multiline numberOfLines={5} textAlignVertical="top" />

      <TouchableOpacity style={s.btn} onPress={submit}>
        <Text style={s.btnText}>📋  Registrar Sinistro</Text>
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
