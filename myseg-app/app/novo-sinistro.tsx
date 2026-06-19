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

const SEGUROS = [
  { id: "1", label: "Auto - Honda Civic 2023", icon: "car" as IconName },
  { id: "2", label: "Residencial - Apt 302", icon: "home" as IconName },
  { id: "3", label: "Vida - Individual", icon: "heart" as IconName },
];

export default function NovoSinistroScreen() {
  const [seguroId, setSeguroId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!seguroId || !descricao.trim() || !data.trim()) {
      Alert.alert("Atencao", "Preencha todos os campos.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        "Sinistro Registrado",
        "Seu sinistro foi aberto com sucesso. Protocolo: SIN-2024-0043\n\nEntraremos em contato em breve.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    }, 1500);
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.warningBanner}>
        <Ionicons name="warning" size={22} color={Colors.accent} />
        <Text style={styles.warningText}>
          Em caso de emergencia, ligue para a assistencia 24h: 0800 777 7777
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Qual seguro deseja acionar?</Text>
        {SEGUROS.map((seg) => (
          <TouchableOpacity
            key={seg.id}
            style={[styles.seguroOption, seguroId === seg.id && styles.seguroOptionActive]}
            onPress={() => setSeguroId(seg.id)}
          >
            <Ionicons
              name={seg.icon}
              size={22}
              color={seguroId === seg.id ? Colors.white : Colors.primary}
            />
            <Text
              style={[styles.seguroLabel, seguroId === seg.id && styles.seguroLabelActive]}
            >
              {seg.label}
            </Text>
            {seguroId === seg.id && (
              <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalhes do Sinistro</Text>

        <Text style={styles.label}>Data do Ocorrido</Text>
        <TextInput
          style={styles.input}
          value={data}
          onChangeText={setData}
          placeholder="Ex: 15/06/2024"
          placeholderTextColor={Colors.textLight}
          keyboardType="numeric"
        />

        <Text style={styles.label}>O que aconteceu?</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={descricao}
          onChangeText={setDescricao}
          placeholder="Descreva o que aconteceu com o maximo de detalhes..."
          placeholderTextColor={Colors.textLight}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.photoBtn}>
          <Ionicons name="camera" size={22} color={Colors.primary} />
          <Text style={styles.photoBtnText}>Adicionar Fotos</Text>
        </TouchableOpacity>
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
              <Ionicons name="alert-circle" size={22} color={Colors.white} />
              <Text style={styles.submitBtnText}>Abrir Sinistro</Text>
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
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accent + "15",
    padding: Spacing.md,
    margin: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  warningText: { flex: 1, fontSize: FontSize.sm, color: Colors.text, lineHeight: 20 },
  section: { paddingHorizontal: Spacing.md, marginTop: Spacing.md },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  seguroOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  seguroOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  seguroLabel: { flex: 1, fontSize: FontSize.md, fontWeight: "500", color: Colors.text },
  seguroLabelActive: { color: Colors.white },
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
  textArea: { minHeight: 120 },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    gap: Spacing.sm,
  },
  photoBtnText: { fontSize: FontSize.md, fontWeight: "600", color: Colors.primary },
  submitSection: { padding: Spacing.md, gap: Spacing.sm, marginTop: Spacing.md },
  submitBtn: {
    backgroundColor: Colors.error,
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
