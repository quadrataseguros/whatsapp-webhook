import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/theme";

interface Seguro {
  id: string;
  tipo: string;
  seguradora: string;
  numero: string;
  vigenciaFim: string;
  status: "ativo" | "vencido" | "pendente";
  descricao: string;
}

const tipoIcons: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  auto: "car",
  vida: "heart",
  residencial: "home",
  empresarial: "business",
  saude: "medkit",
};

const tipoColors: Record<string, string> = {
  auto: Colors.primary,
  vida: "#E91E63",
  residencial: "#FF9800",
  empresarial: "#795548",
  saude: Colors.success,
};

const statusConfig: Record<string, { label: string; color: string }> = {
  ativo: { label: "Ativo", color: Colors.success },
  vencido: { label: "Vencido", color: Colors.error },
  pendente: { label: "Pendente", color: Colors.warning },
};

const MOCK_SEGUROS: Seguro[] = [
  {
    id: "1",
    tipo: "auto",
    seguradora: "Porto Seguro",
    numero: "APL-2024-001",
    vigenciaFim: "2025-01-15",
    status: "ativo",
    descricao: "Honda Civic 2023 - Prata",
  },
  {
    id: "2",
    tipo: "residencial",
    seguradora: "SulAmerica",
    numero: "APL-2024-002",
    vigenciaFim: "2025-03-01",
    status: "ativo",
    descricao: "Apt 302 - Rua das Flores, 150",
  },
  {
    id: "3",
    tipo: "vida",
    seguradora: "Bradesco Seguros",
    numero: "APL-2024-003",
    vigenciaFim: "2025-02-10",
    status: "ativo",
    descricao: "Seguro Vida Individual - R$ 500.000",
  },
  {
    id: "4",
    tipo: "auto",
    seguradora: "Tokio Marine",
    numero: "APL-2023-045",
    vigenciaFim: "2024-06-20",
    status: "vencido",
    descricao: "Fiat Argo 2022 - Branco",
  },
];

function SeguroCard({ item }: { item: Seguro }) {
  const icon = tipoIcons[item.tipo] || "shield";
  const color = tipoColors[item.tipo] || Colors.primary;
  const status = statusConfig[item.status];
  const diasRestantes = Math.ceil(
    (new Date(item.vigenciaFim).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/seguro/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.cardIcon, { backgroundColor: color + "15" }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTipo}>
            {item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: status.color + "18" }]}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <Text style={styles.cardDesc}>{item.descricao}</Text>
        <Text style={styles.cardSeg}>{item.seguradora}</Text>
        <View style={styles.cardFooter}>
          <Ionicons name="calendar-outline" size={13} color={Colors.textLight} />
          <Text style={styles.cardVigencia}>
            {item.status === "ativo" && diasRestantes <= 30
              ? `Vence em ${diasRestantes} dias`
              : `Vigencia ate ${new Date(item.vigenciaFim).toLocaleDateString("pt-BR")}`}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
    </TouchableOpacity>
  );
}

export default function SegurosScreen() {
  const [seguros, setSeguros] = useState<Seguro[]>(MOCK_SEGUROS);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  };

  const ativos = seguros.filter((s) => s.status === "ativo").length;

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <View style={[styles.summaryCard, { backgroundColor: Colors.primary + "10" }]}>
          <Text style={[styles.summaryValue, { color: Colors.primary }]}>{ativos}</Text>
          <Text style={styles.summaryLabel}>Ativos</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: Colors.error + "10" }]}>
          <Text style={[styles.summaryValue, { color: Colors.error }]}>
            {seguros.filter((s) => s.status === "vencido").length}
          </Text>
          <Text style={styles.summaryLabel}>Vencidos</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: Colors.accent + "10" }]}>
          <Text style={[styles.summaryValue, { color: Colors.accent }]}>{seguros.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
      </View>

      <FlatList
        data={seguros}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SeguroCard item={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="shield-outline" size={56} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>Nenhum seguro encontrado</Text>
            <Text style={styles.emptyText}>Seus seguros aparecerao aqui</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  summary: {
    flexDirection: "row",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
  },
  summaryValue: { fontSize: FontSize.xl, fontWeight: "bold" },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeft: { marginRight: Spacing.sm },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: { flex: 1 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTipo: { fontSize: FontSize.md, fontWeight: "bold", color: Colors.text },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "700" },
  cardDesc: { fontSize: FontSize.sm, color: Colors.text, marginTop: 4 },
  cardSeg: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.xs,
  },
  cardVigencia: { fontSize: FontSize.xs, color: Colors.textLight },
  empty: {
    alignItems: "center",
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.text, marginTop: Spacing.md },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
});
