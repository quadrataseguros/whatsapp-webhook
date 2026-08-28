import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Linking } from "react-native";
import { useState } from "react";
import { CONTATOS, waLink, telLink } from "../../constants/contato";

const ASSUNTOS = ["Dúvidas sobre apólice", "Renovação de seguro", "Alteração de dados", "Reclamação", "Outros"];

export default function Contato() {
  const [tel, setTel] = useState("");
  const [assunto, setAssunto] = useState("");
  const [msg, setMsg] = useState("");

  const enviarWhatsApp = () => {
    if (!assunto || !msg) { Alert.alert("Atenção", "Escolha o assunto e escreva sua mensagem."); return; }
    const texto = `*${assunto}*\n\n${msg}${tel ? `\n\nMeu contato: ${tel}` : ""}`;
    Linking.openURL(waLink(CONTATOS.escritorio.whatsapp, texto));
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      {/* Canais diretos */}
      <Text style={s.sectionTitle}>Fale direto com a gente</Text>

      <View style={s.canalCard}>
        <View style={s.canalTop}>
          <Text style={s.canalEmoji}>🏢</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.canalLabel}>{CONTATOS.escritorio.label}</Text>
            <Text style={s.canalTel}>{CONTATOS.escritorio.display}</Text>
            <Text style={s.canalHorario}>{CONTATOS.escritorio.horario}</Text>
          </View>
        </View>
        <View style={s.canalBtns}>
          <TouchableOpacity style={s.btnWpp} onPress={() => Linking.openURL(waLink(CONTATOS.escritorio.whatsapp))}>
            <Text style={s.btnWppText}>💬 WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnLigar} onPress={() => Linking.openURL(telLink(CONTATOS.escritorio.tel))}>
            <Text style={s.btnLigarText}>📞 Ligar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[s.canalCard, s.canal24h]}>
        <View style={s.canalTop}>
          <Text style={s.canalEmoji}>🤖</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.canalLabel}>{CONTATOS.mariana.label}</Text>
            <Text style={s.canalTel}>{CONTATOS.mariana.display}</Text>
            <Text style={s.canalHorario}>{CONTATOS.mariana.horario}</Text>
          </View>
        </View>
        <View style={s.canalBtns}>
          <TouchableOpacity style={s.btnWpp} onPress={() => Linking.openURL(waLink(CONTATOS.mariana.whatsapp))}>
            <Text style={s.btnWppText}>💬 WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnLigar} onPress={() => Linking.openURL(telLink(CONTATOS.mariana.tel))}>
            <Text style={s.btnLigarText}>📞 Ligar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Formulário */}
      <Text style={s.sectionTitle}>Ou envie sua mensagem</Text>
      <Text style={s.label}>Seu telefone (opcional)</Text>
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

      <TouchableOpacity style={s.btn} onPress={enviarWhatsApp}>
        <Text style={s.btnText}>💬  Enviar pelo WhatsApp</Text>
      </TouchableOpacity>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F3F6FC" },
  scroll: { padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0D2B6E", marginBottom: 12, marginTop: 4 },
  canalCard: { backgroundColor: "#0D2B6E", borderRadius: 16, padding: 16, marginBottom: 12 },
  canal24h: { backgroundColor: "#16A34A" },
  canalTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  canalEmoji: { fontSize: 30 },
  canalLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600" },
  canalTel: { color: "#fff", fontSize: 19, fontWeight: "800", letterSpacing: 0.5 },
  canalHorario: { color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 1 },
  canalBtns: { flexDirection: "row", gap: 8 },
  btnWpp: { flex: 1, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, padding: 11, alignItems: "center" },
  btnWppText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  btnLigar: { flex: 1, backgroundColor: "#fff", borderRadius: 10, padding: 11, alignItems: "center" },
  btnLigarText: { color: "#0D2B6E", fontWeight: "700", fontSize: 13 },
  label: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6 },
  input: { backgroundColor: "#fff", borderRadius: 12, padding: 14, fontSize: 14, color: "#222", borderWidth: 1, borderColor: "#E0E8F5", marginBottom: 14 },
  textarea: { height: 120 },
  chipGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  chip: { backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1.5, borderColor: "#E0E8F5" },
  chipSel: { borderColor: "#0D2B6E", backgroundColor: "#EBF0FB" },
  chipText: { fontSize: 12, color: "#555", fontWeight: "600" },
  chipTextSel: { color: "#0D2B6E" },
  btn: { backgroundColor: "#16A34A", borderRadius: 14, padding: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
