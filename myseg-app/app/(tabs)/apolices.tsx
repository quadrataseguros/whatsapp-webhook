import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { api, Apolice } from "@/services/api";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/theme";

const statusColors: Record<string, string> = {
  ativa: Colors.success,
  vencida: Colors.error,
  cancelada: Colors.textLight,
  pendente: Colors.warning,
};

const tipoIcons: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  auto: "car",
  vida: "heart",
  residencial: "home",
  empresarial: "business",
  saude: "medkit",
};

const tipoLabels: Record<string, string> = {
  auto: "Auto",
  vida: "Vida",
  residencial: "Residencial",
  empresarial: "Empresarial",
  saude: "Saude",
};

const MOCK_APOLICES: Apolice[] = [
  {
    id: "1",
    numero: "APL-2024-001",
    clienteNome: "Maria Silva",
    clienteTelefone: "11999887766",
    tipo: "auto",
    seguradora: "Porto Seguro",
    premio: 2800.0,
    vigenciaInicio: "2024-01-15",
    vigenciaFim: "2025-01-15",
    status: "ativa",
    comissao: 560.0,
  },
  {
    id: "2",
    numero: "APL-2024-002",
    clienteNome: "Joao Santos",
    clienteTelefone: "11988776655",
    tipo: "residencial",
    seguradora: "SulAmerica",
    premio: 1200.0,
    vigenciaInicio: "2024-03-01",
    vigenciaFim: "2025-03-01",
    status: "ativa",
    comissao: 240.0,
  },
  {
    id: "3",
    numero: "APL-2024-003",
    clienteNome: "Ana Costa",
    clienteTelefone: "11977665544",
    tipo: "vida",
    seguradora: "Bradesco Seguros",
    premio: 450.0,
    vigenciaInicio: "2024-02-10",
    vigenciaFim: "2025-02-10",
    status: "ativa",
    comissao: 135.0,
  },
  {
    id: "4",
    numero: "APL-2023-045",
    clienteNome: "Carlos Oliveira",
    clienteTelefone: "11966554433",
    tipo: "auto",
    seguradora: "Tokio Marine",
    premio: 3200.0,
    vigenciaInicio: "2023-06-20",
    vigenciaFim: "2024-06-20",
    status: "vencida",
    comissao: 640.0,
  },
  {
    id: "5",
    numero: "APL-2024-010",
    clienteNome: "Fernanda Lima",
    clienteTelefone: "11955443322",
    tipo: "empresarial",
    seguradora: "Allianz",
    premio: 8500.0,
    vigenciaInicio: "2024-04-01",
    vigenciaFim: "2025-04-01",
    status: "ativa",
    comissao: 1700.0,
  },
  {
    id: "6",
    numero: "APL-2024-015",
    clienteNome: "Roberto Mendes",
    clienteTelefone: "11944332211",
    tipo: "saude",
    seguradora: "Amil",
    premio: 1800.0,
    vigenciaInicio: "2024-05-15",
    vigenciaFim: "2025-05-15",
    status: "pendente",
    comissao: 360.0,
  },
];

function PolicyCard({ item }: { item: Apolice }) {
  const statusColor = statusColors[item.status] || Colors.textSecondary;
  const icon = tipoIcons[item.tipo] || "shield";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/apolice/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTipo}>
          <View style={[styles.tipoIcon, { backgroundColor: Colors.primary + "15" }]}>
            <Ionicons name={icon} size={20} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.cardNumero}>{item.numero}</Text>
            <Text style={styles.cardTipoText}>
              {tipoLabels[item.tipo]} - {item.seguradora}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardInfo}>
          <Ionicons name="person" size={14} color={Colors.textSecondary} />
          <Text style={styles.cardInfoText}>{item.clienteNome}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Ionicons name="calendar" size={14} color={Colors.textSecondary} />
          <Text style={styles.cardInfoText}>
            {new Date(item.vigenciaFim).toLocaleDateString("pt-BR")}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cardPremio}>
          R$ {item.premio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
      </View>
    </TouchableOpacity>
  );
}

export default function ApolicesScreen() {
  const [apolices, setApolices] = useState<Apolice[]>([]);
  const [filtro, setFiltro] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const result = await api.getApolices();
      setApolices(result);
    } catch {
      setApolices(MOCK_APOLICES);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredApolices = apolices.filter((a) => {
    const matchesText =
      !filtro ||
      a.clienteNome.toLowerCase().includes(filtro.toLowerCase()) ||
      a.numero.toLowerCase().includes(filtro.toLowerCase()) ||
      a.seguradora.toLowerCase().includes(filtro.toLowerCase());
    const matchesStatus = !statusFiltro || a.status === statusFiltro;
    return matchesText && matchesStatus;
  });

  const statusFilters = ["ativa", "vencida", "pendente", "cancelada"];

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={Colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por cliente, numero ou seguradora..."
          placeholderTextColor={Colors.textLight}
          value={filtro}
          onChangeText={setFiltro}
        />
        {filtro ? (
          <TouchableOpacity onPress={() => setFiltro("")}>
            <Ionicons name="close-circle" size={20} color={Colors.textLight} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterChip, !statusFiltro && styles.filterChipActive]}
          onPress={() => setStatusFiltro(null)}
        >
          <Text style={[styles.filterText, !statusFiltro && styles.filterTextActive]}>
            Todas
          </Text>
        </TouchableOpacity>
        {statusFilters.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, statusFiltro === s && styles.filterChipActive]}
            onPress={() => setStatusFiltro(statusFiltro === s ? null : s)}
          >
            <Text style={[styles.filterText, statusFiltro === s && styles.filterTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}s
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredApolices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PolicyCard item={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="shield-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>Nenhuma apolice encontrada</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  filterTextActive: {
    color: Colors.white,
  },
  list: {
    padding: Spacing.md,
    paddingTop: 0,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTipo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  tipoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cardNumero: {
    fontSize: FontSize.sm,
    fontWeight: "bold",
    color: Colors.text,
  },
  cardTipoText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
  },
  cardBody: {
    flexDirection: "row",
    marginTop: Spacing.sm,
    gap: Spacing.lg,
  },
  cardInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardInfoText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cardPremio: {
    fontSize: FontSize.md,
    fontWeight: "bold",
    color: Colors.primary,
  },
  empty: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    color: Colors.textLight,
    fontSize: FontSize.md,
    marginTop: Spacing.md,
  },
});
