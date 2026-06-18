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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api, ChatMessage } from "@/services/api";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/theme";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Ola! Sou a MarIAna, assistente virtual da Quadrata Seguros. Como posso te ajudar hoje?\n\nVoce pode me perguntar sobre:\n- Cotacoes de seguros\n- Status de apolices\n- Informacoes sobre coberturas\n- Sinistros e procedimentos",
  timestamp: new Date().toISOString(),
};

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.bubbleContainer, isUser ? styles.bubbleRight : styles.bubbleLeft]}>
      {!isUser && (
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="sparkles" size={16} color={Colors.white} />
          </View>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>
          {message.text}
        </Text>
        <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
          {new Date(message.timestamp).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const sessionId = useRef(`corretor-${Date.now()}`);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setSending(true);

    try {
      const { reply } = await api.enviarMensagemChat(text, sessionId.current);
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: reply,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        text: "Desculpe, estou com dificuldade de conexao. Tente novamente em alguns instantes.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
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
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatBubble message={item} />}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={
          <View style={styles.chatHeader}>
            <View style={styles.chatHeaderIcon}>
              <Ionicons name="sparkles" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.chatHeaderText}>
              Chat com MarIAna - IA da Quadrata
            </Text>
          </View>
        }
      />

      {sending && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.typingText}>MarIAna esta digitando...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Digite sua mensagem..."
          placeholderTextColor={Colors.textLight}
          multiline
          maxLength={1000}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
        >
          <Ionicons name="send" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  chatHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  chatHeaderText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  messagesList: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  bubbleContainer: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
    maxWidth: "85%",
  },
  bubbleRight: {
    alignSelf: "flex-end",
  },
  bubbleLeft: {
    alignSelf: "flex-start",
  },
  avatarContainer: {
    marginRight: Spacing.sm,
    justifyContent: "flex-end",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  bubble: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    maxWidth: "100%",
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubbleText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  userBubbleText: {
    color: Colors.white,
  },
  timestamp: {
    fontSize: 10,
    color: Colors.textLight,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  userTimestamp: {
    color: "rgba(255,255,255,0.7)",
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  typingText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  inputContainer: {
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
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
});
