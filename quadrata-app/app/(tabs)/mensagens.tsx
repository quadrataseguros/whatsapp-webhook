import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

type Msg = { id: number; text: string; from: "me" | "corretor"; time: string };

const INITIAL: Msg[] = [
  { id: 1, text: "Olá! Seja bem-vindo(a) ao canal de atendimento da Quadrata Seguros. Como posso ajudar?", from: "corretor", time: "09:00" },
  { id: 2, text: "Oi, tenho uma dúvida sobre meu seguro auto.", from: "me", time: "09:01" },
  { id: 3, text: "Claro! Me conta mais sobre sua dúvida. Estou aqui para ajudar 😊", from: "corretor", time: "09:02" },
];

export default function Mensagens() {
  const [msgs, setMsgs] = useState<Msg[]>(INITIAL);
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setMsgs(prev => [...prev, { id: Date.now(), text: text.trim(), from: "me", time }]);
    setText("");
    setTimeout(() => {
      setMsgs(prev => [...prev, { id: Date.now() + 1, text: "Mensagem recebida! Em breve um de nossos corretores irá responder. 📋", from: "corretor", time }]);
    }, 1000);
  };

  return (
    <View style={s.root}>
      <SafeAreaView style={s.header} edges={["top"]}>
        <View style={s.headerRow}>
          <View style={s.agentAvatar}><Text style={s.agentAvatarText}>Q</Text></View>
          <View>
            <Text style={s.agentName}>Quadrata Seguros</Text>
            <Text style={s.agentStatus}>🟢 Online agora</Text>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
        <ScrollView style={s.msgs} contentContainerStyle={{ padding: 16, gap: 10 }}>
          {msgs.map((m) => (
            <View key={m.id} style={[s.bubble, m.from === "me" ? s.bubbleMe : s.bubbleCorr]}>
              <Text style={[s.bubbleText, m.from === "me" ? s.textMe : s.textCorr]}>{m.text}</Text>
              <Text style={[s.time, m.from === "me" ? { color: "rgba(255,255,255,0.6)" } : { color: "#aaa" }]}>{m.time}</Text>
            </View>
          ))}
        </ScrollView>
        <SafeAreaView style={s.inputBar} edges={["bottom"]}>
          <TextInput
            style={s.input}
            value={text}
            onChangeText={setText}
            placeholder="Digite sua mensagem..."
            placeholderTextColor="#aaa"
            multiline
          />
          <TouchableOpacity style={s.sendBtn} onPress={send}>
            <Text style={s.sendIcon}>▶</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F3F6FC" },
  header: { backgroundColor: "#0D2B6E" },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  agentAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  agentAvatarText: { color: "#fff", fontWeight: "900", fontSize: 18 },
  agentName: { color: "#fff", fontWeight: "700", fontSize: 15 },
  agentStatus: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  msgs: { flex: 1, backgroundColor: "#EEF2FB" },
  bubble: { maxWidth: "80%", borderRadius: 14, padding: 12 },
  bubbleMe: { backgroundColor: "#0D2B6E", alignSelf: "flex-end", borderBottomRightRadius: 4 },
  bubbleCorr: { backgroundColor: "#fff", alignSelf: "flex-start", borderBottomLeftRadius: 4, elevation: 1 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  textMe: { color: "#fff" },
  textCorr: { color: "#222" },
  time: { fontSize: 10, marginTop: 4, textAlign: "right" },
  inputBar: { backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#E0E8F5", flexDirection: "row", alignItems: "center", padding: 10, gap: 10 },
  input: { flex: 1, backgroundColor: "#F3F6FC", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: "#222", maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#0D2B6E", justifyContent: "center", alignItems: "center" },
  sendIcon: { color: "#fff", fontSize: 16, marginLeft: 2 },
});
