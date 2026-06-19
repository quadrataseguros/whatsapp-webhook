import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/theme";

interface Sinistro {
  id: string;
  tipo: string;
  descricao: string;
  data: string;
  status: "aberto" | "em_analise" | "aprovado" | "finalizado" | "negado";
  protocolo: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentProps<typeof Ionicons>["name"] }> = {
  aberto: { label: "Aberto", color: Colors.info, icon: "radio-button-on" },
  em_analise: { label: "Em Analise", color: Colors.warning, icon: "time" },
  aprovado: { label: "Aprovado", color: Colors.success, icon: "checkmark-circle" },
  finalizado: { label: "Finalizado", color: Colors.textSecondary, icon: "checkmark-done" },
  negado: { label: "Negado", color: Colors.error, icon: "close-circle" },
};

const MOCK_SINISTROS: Sinistro[] = [
  {
    id: "1",
    tipo: "Auto",
    descricao: "Colisao traseira no estacionamento do shopping",
    data: "2024-06-10",
    status: "em_analise",
    protocolo: "SIN-2024-0042",
  },
  {
    id: "2",
    tipo: "Residencial",
    descricao: "Danos por infiltracao no teto da sala",
    data: "2024-05-22",
    status: "aprovado",
    protocolo: "SIN-2024-0038",
  },
  {
    id: "3",
    tipo: "Auto",
    descricao: "Furto de estepe no estacionamento",
    data: "2024-03-15",
    status: "finalizado",
    protocolo: "SIN-2024-0021",
  },
];

function SinistroCard({ item }: { item: Sinistro }) {
  const config = statusConfig[item.status];

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.protocolo}>{item.protocolo}</Text>
          <Text style={styles.tipo}>{item.tipo}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: config.color + "15" }]}>
          <Ionicons name={config.icon} size={14} color={config.color} />
          <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
        </View>
      </View>
      <Text style={styles.descricao}>{item.descricao}</Text>
      <View style={styles.cardFooter}>
        <Ionicons name="calendar-outline" size={13} color={Colors.textLight} />
        <Text style={styles.data}>
          {new Date(item.data).toLocaleDateString("pt-BR")}
        </Text>
      </View>

      {item.status === "em_analise" && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "50%" }]} />
          </View>
          <Text style={styles.progressText}>Em analise pela seguradora</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function SinistrosScreen() {
  const [sinistros] = useState(MOCK_SINISTROS);

  return (
    <View style={styles.container}>
      <FlatList
        data={sinistros}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SinistroCard item={item} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerInfo}>
            <Ionicons name="information-circle" size={18} color={Colors.primary} />
            <Text style={styles.headerInfoText}>
              Acompanhe o andamento dos seus sinistros
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={56} color={Colors.success} />
            <Text style={styles.emptyTitle}>Nenhum sinistro</Text>
            <Text style={styles.emptyText}>Voce nao possui sinistros registrados</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/novo-sinistro")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.md, paddingBottom: 80 },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary + "10",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  headerInfoText: { flex: 1, fontSize: FontSize.sm, color: Colors.primary },
  card: {
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  protocolo: { fontSize: FontSize.md, fontWeight: "bold", color: Colors.text },
  tipo: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusText: { fontSize: FontSize.xs, fontWeight: "600" },
  descricao: {
    fontSize: FontSize.sm,
    color: Colors.text,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.sm,
  },
  data: { fontSize: FontSize.xs, color: Colors.textLight },
  progressContainer: { marginTop: Spacing.sm },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.warning,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    bottom: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.error,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  empty: {
    alignItems: "center",
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "600", color: Colors.text, marginTop: Spacing.md },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
});
