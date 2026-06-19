import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/theme";

const MOCK = {
  id: "1",
  tipo: "Auto",
  seguradora: "Porto Seguro",
  numero: "APL-2024-001",
  descricao: "Honda Civic 2023 - Prata",
  vigenciaInicio: "2024-01-15",
  vigenciaFim: "2025-01-15",
  status: "ativo",
  premio: "R$ 2.800,00",
  parcela: "R$ 233,33",
  franquia: "R$ 3.500,00",
  coberturas: [
    "Colisao, incendio e roubo",
    "Danos a terceiros - R$ 100.000",
    "Danos morais - R$ 30.000",
    "Vidros, farois e retrovisores",
    "Carro reserva - 15 dias",
    "Guincho - 400km",
  ],
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function SeguroDetailScreen() {
  const { id } = useLocalSearchParams();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="car" size={36} color={Colors.primary} />
        </View>
        <Text style={styles.headerTipo}>{MOCK.tipo}</Text>
        <Text style={styles.headerDesc}>{MOCK.descricao}</Text>
        <View style={styles.activeBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.activeText}>Ativo</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados do Seguro</Text>
        <View style={styles.card}>
          <InfoRow label="Numero" value={MOCK.numero} />
          <InfoRow label="Seguradora" value={MOCK.seguradora} />
          <InfoRow label="Inicio" value={new Date(MOCK.vigenciaInicio).toLocaleDateString("pt-BR")} />
          <InfoRow label="Vencimento" value={new Date(MOCK.vigenciaFim).toLocaleDateString("pt-BR")} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Valores</Text>
        <View style={styles.valuesRow}>
          <View style={[styles.valueCard, { borderTopColor: Colors.primary }]}>
            <Text style={styles.valueLabel}>Premio Anual</Text>
            <Text style={styles.valueAmount}>{MOCK.premio}</Text>
          </View>
          <View style={[styles.valueCard, { borderTopColor: Colors.accent }]}>
            <Text style={styles.valueLabel}>Parcela</Text>
            <Text style={styles.valueAmount}>{MOCK.parcela}</Text>
          </View>
          <View style={[styles.valueCard, { borderTopColor: Colors.error }]}>
            <Text style={styles.valueLabel}>Franquia</Text>
            <Text style={styles.valueAmount}>{MOCK.franquia}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Coberturas</Text>
        <View style={styles.card}>
          {MOCK.coberturas.map((cob, i) => (
            <View key={i} style={styles.coberturaRow}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.coberturaText}>{cob}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push("/novo-sinistro")}
        >
          <Ionicons name="alert-circle" size={20} color={Colors.error} />
          <Text style={[styles.actionBtnText, { color: Colors.error }]}>Acionar Sinistro</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => Linking.openURL("https://wa.me/5511999887766?text=Ola,%20tenho%20duvida%20sobre%20meu%20seguro%20" + MOCK.numero)}
        >
          <Ionicons name="logo-whatsapp" size={20} color={Colors.whatsapp} />
          <Text style={[styles.actionBtnText, { color: Colors.whatsapp }]}>Falar sobre este seguro</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, { borderColor: Colors.primary }]}>
          <Ionicons name="download" size={20} color={Colors.primary} />
          <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Baixar Apolice (PDF)</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary + "12",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  headerTipo: { fontSize: FontSize.xl, fontWeight: "bold", color: Colors.text },
  headerDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.success + "15",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
    gap: 6,
  },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  activeText: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.success },
  section: { padding: Spacing.md },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
  },
  infoLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  infoValue: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.text },
  valuesRow: { flexDirection: "row", gap: Spacing.sm },
  valueCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderTopWidth: 3,
    alignItems: "center",
  },
  valueLabel: { fontSize: 10, color: Colors.textSecondary, textTransform: "uppercase" },
  valueAmount: { fontSize: FontSize.md, fontWeight: "bold", color: Colors.text, marginTop: 4 },
  coberturaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
  },
  coberturaText: { fontSize: FontSize.sm, color: Colors.text, flex: 1 },
  actions: { padding: Spacing.md, gap: Spacing.sm },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  actionBtnText: { fontSize: FontSize.md, fontWeight: "600" },
});
