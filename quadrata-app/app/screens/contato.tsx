import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";

const ASSUNTOS = ["Dúvidas sobre apólice", "Renovação de seguro", "Alteração de dados", "Reclamação", "Outros"];

export default function Contato() {
  const [tel, setTel] = useState("");
  const [assunto, setAssunto] = useState("");
  const [msg, setMsg] = useState("");

  const send = () => {
    if (!tel || !assunto || !msg) { Alert.alert("Atenção", "Preencha todos os campos."); return; }
    Alert.alert("Mensagem enviada!", "Nossa equipe responderá em breve. ✅");
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      {/* Info card */}
      <View style={s.infoCard}>
        <View style={s.infoRow}><Text style={s.infoEmoji}>📞</Text><View><Text style={s.infoLabel}>Telefone</Text><Text style={s.infoVal}>(11) 9999-9999</Text></View></View>
        <View style={s.infoRow}><Text style={s.infoEmoji}>📧</Text><View><Text style={s.infoLabel}>E-mail</Text><Text style={s.infoVal}>atendimento@quadrataseguros.com.br</Text></View></View>
        <View style={s.infoRow}><Text style={s.infoEmoji}>🕐</Text><View><Text style={s.infoLabel}>Horário</Text><Text style={s.infoVal}>Seg–Sex, 8h–18h</Text></View></View>
      </View>

      <Text style={s.sectionTitle}>Enviar mensagem</Text>
      <Text style={s.label}>Seu telefone/WhatsApp</Text>
      <TextInput style={s.input} placeholder="(11) 00000-0000" placeholderTextColor="#aaa" value={tel} onChangeText={setTel} keyboardType="phone-pad" />

      <Text style={s.label}>Assunto</Text>
      <View style={s.chipGroup}>
        {ASSUNTOS.map((a) => (
          <TouchableOpacity key={a} style={[s.chip, assunto === a && s.chipSel]} onPress={() => setAssunto(a)}>
            <Text style={[s.chipText, assunto === a && s.chipTextSel]}>{a}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Mensagem</Text>
      <TextInput style={[s.input, s.textarea]} placeholder="Descreva sua dúvida ou solicitação..." placeholderTextColor="#aaa" value={msg} onChangeText={setMsg} multiline numberOfLines={5} textAlignVertical="top" />

      <TouchableOpacity style={s.btn} onPress={send}>
        <Text style={s.btnText}>📨  Enviar Mensagem</Text>
      </TouchableOpacity>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F3F6FC" },
  scroll: { padding: 16 },
  infoCard: { backgroundColor: "#0D2B6E", borderRadius: 16, padding: 18, marginBottom: 20, gap: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoEmoji: { fontSize: 22, width: 30 },
  infoLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11 },
  infoVal: { color: "#fff", fontWeight: "600", fontSize: 13 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0D2B6E", marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6 },
  input: { backgroundColor: "#fff", borderRadius: 12, padding: 14, fontSize: 14, color: "#222", borderWidth: 1, borderColor: "#E0E8F5", marginBottom: 14 },
  textarea: { height: 120 },
  chipGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  chip: { backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1.5, borderColor: "#E0E8F5" },
  chipSel: { borderColor: "#0D2B6E", backgroundColor: "#EBF0FB" },
  chipText: { fontSize: 12, color: "#555", fontWeight: "600" },
  chipTextSel: { color: "#0D2B6E" },
  btn: { backgroundColor: "#0D2B6E", borderRadius: 14, padding: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
