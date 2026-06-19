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
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const TIPOS: { value: string; label: string; icon: IconName; color: string }[] = [
  { value: "auto", label: "Automovel", icon: "car", color: Colors.primary },
  { value: "residencial", label: "Residencial", icon: "home", color: "#FF9800" },
  { value: "vida", label: "Vida", icon: "heart", color: "#E91E63" },
  { value: "saude", label: "Saude", icon: "medkit", color: Colors.success },
  { value: "empresarial", label: "Empresarial", icon: "business", color: "#795548" },
  { value: "outros", label: "Outros", icon: "ellipsis-horizontal", color: Colors.textSecondary },
];

export default function SolicitarCotacaoScreen() {
  const [tipo, setTipo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!tipo || !descricao.trim()) {
      Alert.alert("Atencao", "Selecione o tipo e descreva o que precisa.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        "Cotacao Solicitada!",
        "Recebemos sua solicitacao. Nosso corretor entrara em contato em breve com as melhores opcoes para voce.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    }, 1500);
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Que tipo de seguro voce precisa?</Text>
        <View style={styles.tipoGrid}>
          {TIPOS.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.tipoCard, tipo === t.value && { backgroundColor: t.color, borderColor: t.color }]}
              onPress={() => setTipo(t.value)}
            >
              <Ionicons
                name={t.icon}
                size={28}
                color={tipo === t.value ? Colors.white : t.color}
              />
              <Text
                style={[styles.tipoLabel, tipo === t.value && { color: Colors.white }]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conte-nos mais</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={descricao}
          onChangeText={setDescricao}
          placeholder={
            tipo === "auto"
              ? "Ex: Carro Honda Civic 2023, cor prata, uso particular, garagem em casa e no trabalho..."
              : tipo === "residencial"
              ? "Ex: Apartamento 80m2, 3o andar, condominio com portaria 24h..."
              : "Descreva o que voce precisa segurar e qualquer detalhe relevante..."
          }
          placeholderTextColor={Colors.textLight}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={Colors.primary} />
        <Text style={styles.infoText}>
          Apos enviar, nosso corretor analisara e enviara as melhores opcoes de seguradoras e precos para voce.
        </Text>
      </View>

      <View style={styles.submitSection}>
        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={Colors.white} />
              <Text style={styles.submitBtnText}>Solicitar Cotacao</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Cancelar</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  section: { padding: Spacing.md },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: Spacing.md,
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
    paddingVertical: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  tipoLabel: { fontSize: FontSize.xs, fontWeight: "600", color: Colors.text },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: { minHeight: 120 },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.primary + "10",
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  infoText: { flex: 1, fontSize: FontSize.sm, color: Colors.primary, lineHeight: 20 },
  submitSection: { padding: Spacing.md, gap: Spacing.sm, marginTop: Spacing.md },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  submitBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: "bold" },
  cancelBtn: { padding: Spacing.md, alignItems: "center" },
  cancelBtnText: { color: Colors.textSecondary, fontSize: FontSize.md },
});
