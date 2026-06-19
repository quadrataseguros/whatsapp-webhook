import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api, ChatMessage } from "@/services/api";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/theme";

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Ola! Sou a MarIAna, assistente virtual da Quadrata Seguros.\n\nComo posso ajudar voce hoje?\n\n- Duvidas sobre seu seguro\n- Segunda via de boleto\n- Informacoes sobre sinistro\n- Falar com um atendente",
  timestamp: new Date().toISOString(),
};

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRight : styles.bubbleLeft]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>M</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
        <Text style={[styles.bubbleText, isUser && { color: Colors.white }]}>
          {message.text}
        </Text>
        <Text style={[styles.time, isUser && { color: "rgba(255,255,255,0.6)" }]}>
          {new Date(message.timestamp).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );
}

export default function ContatoScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);
  const sessionId = useRef(`cliente-${Date.now()}`);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const { reply } = await api.enviarMensagemChat(text, sessionId.current);
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", text: reply, timestamp: new Date().toISOString() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          text: "Desculpe, nao consegui conectar agora. Tente pelo WhatsApp ou ligue para nos.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: Colors.whatsapp + "15" }]}
          onPress={() => Linking.openURL("https://wa.me/5511999887766?text=Ola%20Quadrata!")}
        >
          <Ionicons name="logo-whatsapp" size={18} color={Colors.whatsapp} />
          <Text style={[styles.quickBtnText, { color: Colors.whatsapp }]}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: Colors.primary + "15" }]}
          onPress={() => Linking.openURL("tel:11999887766")}
        >
          <Ionicons name="call" size={18} color={Colors.primary} />
          <Text style={[styles.quickBtnText, { color: Colors.primary }]}>Ligar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: Colors.accent + "15" }]}
          onPress={() => Linking.openURL("mailto:pfmseguros@gmail.com")}
        >
          <Ionicons name="mail" size={18} color={Colors.accent} />
          <Text style={[styles.quickBtnText, { color: Colors.accent }]}>Email</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatBubble message={item} />}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      {sending && (
        <View style={styles.typing}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.typingText}>MarIAna digitando...</Text>
        </View>
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Digite sua mensagem..."
          placeholderTextColor={Colors.textLight}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnOff]}
          onPress={send}
          disabled={!input.trim() || sending}
        >
          <Ionicons name="send" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  quickActions: {
    flexDirection: "row",
    padding: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  quickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  quickBtnText: { fontSize: FontSize.xs, fontWeight: "600" },
  messageList: { padding: Spacing.md, paddingBottom: Spacing.sm },
  bubbleRow: { flexDirection: "row", marginBottom: Spacing.sm, maxWidth: "85%" },
  bubbleRight: { alignSelf: "flex-end" },
  bubbleLeft: { alignSelf: "flex-start" },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
    alignSelf: "flex-end",
  },
  avatarText: { color: Colors.white, fontSize: 13, fontWeight: "bold" },
  bubble: { borderRadius: BorderRadius.lg, padding: Spacing.md },
  userBubble: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: Colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  bubbleText: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 20 },
  time: { fontSize: 10, color: Colors.textLight, marginTop: 4, alignSelf: "flex-end" },
  typing: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  typingText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontStyle: "italic" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.sm,
    color: Colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnOff: { backgroundColor: Colors.textLight },
});
