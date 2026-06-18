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
import { api, Cotacao } from "@/services/api";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/theme";

const statusConfig: Record<string, { color: string; icon: React.ComponentProps<typeof Ionicons>["name"] }> = {
  pendente: { color: Colors.warning, icon: "time" },
  enviada: { color: Colors.info, icon: "send" },
  aceita: { color: Colors.success, icon: "checkmark-circle" },
  recusada: { color: Colors.error, icon: "close-circle" },
};

const MOCK_COTACOES: Cotacao[] = [
  {
    id: "1",
    clienteNome: "Pedro Almeida",
    clienteTelefone: "11999001122",
    tipo: "auto",
    descricao: "Honda Civic 2023 - Cobertura completa",
    valorEstimado: 3200.0,
    status: "pendente",
    criadaEm: "2024-06-18",
  },
  {
    id: "2",
    clienteNome: "Lucia Ferreira",
    clienteTelefone: "11988112233",
    tipo: "residencial",
    descricao: "Apartamento 80m2 - Vila Mariana",
    valorEstimado: 980.0,
    status: "enviada",
    criadaEm: "2024-06-17",
  },
  {
    id: "3",
    clienteNome: "Ricardo Souza",
    clienteTelefone: "11977223344",
    tipo: "vida",
    descricao: "Seguro vida individual - Capital R$ 500k",
    valorEstimado: 120.0,
    status: "aceita",
    criadaEm: "2024-06-15",
  },
  {
    id: "4",
    clienteNome: "Camila Rocha",
    clienteTelefone: "11966334455",
    tipo: "empresarial",
    descricao: "Loja de roupas - Shopping Center Norte",
    valorEstimado: 4500.0,
    status: "pendente",
    criadaEm: "2024-06-16",
  },
  {
    id: "5",
    clienteNome: "Bruno Martins",
    clienteTelefone: "11955445566",
    tipo: "auto",
    descricao: "Toyota Corolla 2024 - Cobertura basica",
    valorEstimado: 2100.0,
    status: "recusada",
    criadaEm: "2024-06-10",
  },
];

function CotacaoCard({ item }: { item: Cotacao }) {
  const config = statusConfig[item.status] || statusConfig.pendente;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Text style={styles.clienteNome}>{item.clienteNome}</Text>
          <Text style={styles.descricao}>{item.descricao}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: config.color + "20" }]}>
          <Ionicons name={config.icon} size={12} color={config.color} />
          <Text style={[styles.statusText, { color: config.color }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.cardInfo}>
          <Ionicons name="pricetag" size={14} color={Colors.textSecondary} />
          <Text style={styles.tipoText}>
            {item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}
          </Text>
        </View>
        <Text style={styles.valor}>
          R$ {item.valorEstimado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          <Text style={styles.valorSuffix}>/ano</Text>
        </Text>
      </View>

      <Text style={styles.dataText}>
        Criada em {new Date(item.criadaEm).toLocaleDateString("pt-BR")}
      </Text>
    </TouchableOpacity>
  );
}

export default function CotacoesScreen() {
  const [cotacoes, setCotacoes] = useState<Cotacao[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const result = await api.getCotacoes();
      setCotacoes(result);
    } catch {
      setCotacoes(MOCK_COTACOES);
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

  const pendentes = cotacoes.filter((c) => c.status === "pendente").length;

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{cotacoes.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.warning }]}>{pendentes}</Text>
          <Text style={styles.summaryLabel}>Pendentes</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.success }]}>
            {cotacoes.filter((c) => c.status === "aceita").length}
          </Text>
          <Text style={styles.summaryLabel}>Aceitas</Text>
        </View>
      </View>

      <FlatList
        data={cotacoes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CotacaoCard item={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calculator-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>Nenhuma cotacao ainda</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/nova-cotacao")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  summary: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  summaryValue: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
    color: Colors.text,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  list: {
    padding: Spacing.md,
    paddingTop: 0,
    paddingBottom: 80,
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
  cardLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  clienteNome: {
    fontSize: FontSize.md,
    fontWeight: "bold",
    color: Colors.text,
  },
  descricao: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
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
  cardInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tipoText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  valor: {
    fontSize: FontSize.md,
    fontWeight: "bold",
    color: Colors.primary,
  },
  valorSuffix: {
    fontSize: FontSize.xs,
    fontWeight: "normal",
    color: Colors.textSecondary,
  },
  dataText: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    marginTop: Spacing.sm,
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    bottom: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
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
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    color: Colors.textLight,
    fontSize: FontSize.md,
    marginTop: Spacing.md,
  },
});
