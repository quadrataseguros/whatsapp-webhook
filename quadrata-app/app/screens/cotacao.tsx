import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { useState } from "react";

const TIPOS = [
  { label: "Automóvel", emoji: "🚗" },
  { label: "Notebook", emoji: "💻" },
  { label: "Câmera Fotográfica", emoji: "📷" },
  { label: "Saúde", emoji: "🏥" },
  { label: "Vida", emoji: "❤️" },
  { label: "Previdência", emoji: "💰" },
  { label: "Responsabilidade Civil", emoji: "⚖️" },
  { label: "Embarcações", emoji: "⛵" },
  { label: "Residência", emoji: "🏠" },
  { label: "Outros", emoji: "📋" },
];

export default function Cotacao() {
  const [selected, setSelected] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [tel, setTel] = useState("");
  const [obs, setObs] = useState("");

  const submit = () => {
    if (!selected || !nome || !tel) {
      Alert.alert("Atenção", "Preencha o tipo de seguro, nome e telefone.");
      return;
    }
    Alert.alert("Cotação enviada!", "Em breve nosso corretor entrará em contato. 😊", [{ text: "OK" }]);
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <Text style={s.sectionTitle}>Qual seguro você precisa?</Text>
      <View style={s.grid}>
        {TIPOS.map((t) => (
          <TouchableOpacity
            key={t.label}
            style={[s.chip, selected === t.label && s.chipSelected]}
            onPress={() => setSelected(t.label)}
            activeOpacity={0.75}
          >
            <Text style={s.chipEmoji}>{t.emoji}</Text>
            <Text style={[s.chipLabel, selected === t.label && s.chipLabelSelected]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.sectionTitle}>Seus dados de contato</Text>
      <TextInput style={s.input} placeholder="Nome completo" placeholderTextColor="#aaa" value={nome} onChangeText={setNome} />
      <TextInput style={s.input} placeholder="Telefone / WhatsApp" placeholderTextColor="#aaa" value={tel} onChangeText={setTel} keyboardType="phone-pad" />
      <TextInput style={[s.input, s.textarea]} placeholder="Informações adicionais (opcional)" placeholderTextColor="#aaa" value={obs} onChangeText={setObs} multiline numberOfLines={4} textAlignVertical="top" />

      <TouchableOpacity style={s.btn} onPress={submit} activeOpacity={0.85}>
        <Text style={s.btnText}>📨  Solicitar Cotação</Text>
      </TouchableOpacity>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F3F6FC" },
  scroll: { padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0D2B6E", marginBottom: 12, marginTop: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 2, borderColor: "#E0E8F5", elevation: 1 },
  chipSelected: { borderColor: "#0D2B6E", backgroundColor: "#EBF0FB" },
  chipEmoji: { fontSize: 18 },
  chipLabel: { fontSize: 13, color: "#444", fontWeight: "600" },
  chipLabelSelected: { color: "#0D2B6E" },
  input: { backgroundColor: "#fff", borderRadius: 12, padding: 14, fontSize: 14, color: "#222", borderWidth: 1, borderColor: "#E0E8F5", marginBottom: 12 },
  textarea: { height: 100 },
  btn: { backgroundColor: "#0D2B6E", borderRadius: 14, padding: 16, alignItems: "center", marginTop: 4 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
