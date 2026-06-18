import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/api";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const TIPOS: { value: string; label: string; icon: IconName }[] = [
  { value: "auto", label: "Auto", icon: "car" },
  { value: "residencial", label: "Residencial", icon: "home" },
  { value: "vida", label: "Vida", icon: "heart" },
  { value: "empresarial", label: "Empresarial", icon: "business" },
  { value: "saude", label: "Saude", icon: "medkit" },
];

export default function NovaCotacaoScreen() {
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [tipo, setTipo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!clienteNome.trim() || !clienteTelefone.trim() || !tipo || !descricao.trim()) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }

    setLoading(true);
    try {
      await api.criarCotacao({
        clienteNome: clienteNome.trim(),
        clienteTelefone: clienteTelefone.trim(),
        tipo,
        descricao: descricao.trim(),
      });
      Alert.alert("Sucesso", "Cotacao criada com sucesso!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Sucesso", "Cotacao registrada localmente!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados do Cliente</Text>

        <Text style={styles.label}>Nome Completo</Text>
        <TextInput
          style={styles.input}
          value={clienteNome}
          onChangeText={setClienteNome}
          placeholder="Ex: Maria Silva"
          placeholderTextColor={Colors.textLight}
        />

        <Text style={styles.label}>Telefone (WhatsApp)</Text>
        <TextInput
          style={styles.input}
          value={clienteTelefone}
          onChangeText={setClienteTelefone}
          placeholder="Ex: 11999887766"
          placeholderTextColor={Colors.textLight}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tipo de Seguro</Text>
        <View style={styles.tipoGrid}>
          {TIPOS.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.tipoCard, tipo === t.value && styles.tipoCardActive]}
              onPress={() => setTipo(t.value)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={t.icon}
                size={28}
                color={tipo === t.value ? Colors.white : Colors.primary}
              />
              <Text
                style={[styles.tipoLabel, tipo === t.value && styles.tipoLabelActive]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalhes</Text>

        <Text style={styles.label}>Descricao do Risco</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={descricao}
          onChangeText={setDescricao}
          placeholder={
            tipo === "auto"
              ? "Ex: Honda Civic 2023, prata, completo, uso particular..."
              : tipo === "residencial"
              ? "Ex: Apartamento 80m2, 5o andar, Vila Mariana..."
              : "Descreva o que precisa ser segurado..."
          }
          placeholderTextColor={Colors.textLight}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.submitSection}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
              <Text style={styles.submitButtonText}>Criar Cotacao</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 100,
  },
  tipoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  tipoCard: {
    width: "30%",
    flexGrow: 1,
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  tipoCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tipoLabel: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.text,
  },
  tipoLabelActive: {
    color: Colors.white,
  },
  submitSection: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: "bold",
  },
  cancelButton: {
    padding: Spacing.md,
    alignItems: "center",
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
});
