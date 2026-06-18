import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { api, DashboardData, Atividade } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/theme";

const tipoIcons: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  nova_apolice: "shield-checkmark",
  sinistro: "warning",
  cotacao: "calculator",
  pagamento: "cash",
  vencimento: "time",
};

const tipoColors: Record<string, string> = {
  nova_apolice: Colors.success,
  sinistro: Colors.error,
  cotacao: Colors.info,
  pagamento: Colors.accent,
  vencimento: Colors.warning,
};

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function AtividadeItem({ item }: { item: Atividade }) {
  const icon = tipoIcons[item.tipo] || "ellipse";
  const color = tipoColors[item.tipo] || Colors.textSecondary;
  return (
    <View style={styles.atividadeItem}>
      <View style={[styles.atividadeIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.atividadeContent}>
        <Text style={styles.atividadeDesc}>{item.descricao}</Text>
        <Text style={styles.atividadeCliente}>{item.clienteNome}</Text>
      </View>
      <Text style={styles.atividadeData}>{item.data}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { perfil } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const result = await api.getDashboard();
      setData(result);
    } catch {
      // Dados mock para demonstracao
      setData({
        totalClientes: 247,
        apolicesAtivas: 312,
        cotacoesPendentes: 18,
        comissoesDoMes: 12450.0,
        apolicesVencendo: 8,
        sinistrosAbertos: 3,
        ultimasAtividades: [
          {
            id: "1",
            tipo: "nova_apolice",
            descricao: "Nova apolice auto emitida",
            data: "Hoje",
            clienteNome: "Maria Silva",
          },
          {
            id: "2",
            tipo: "cotacao",
            descricao: "Cotacao residencial solicitada",
            data: "Hoje",
            clienteNome: "Joao Santos",
          },
          {
            id: "3",
            tipo: "vencimento",
            descricao: "Apolice vence em 5 dias",
            data: "18/06",
            clienteNome: "Ana Costa",
          },
          {
            id: "4",
            tipo: "sinistro",
            descricao: "Sinistro auto aberto",
            data: "17/06",
            clienteNome: "Carlos Oliveira",
          },
          {
            id: "5",
            tipo: "pagamento",
            descricao: "Comissao recebida",
            data: "16/06",
            clienteNome: "Porto Seguro",
          },
        ],
      });
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

  const formatCurrency = (value: number) =>
    `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Ola, {perfil?.nome || "Corretor"}!
        </Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          label="Clientes"
          value={data?.totalClientes ?? "-"}
          icon="people"
          color={Colors.primary}
        />
        <StatCard
          label="Apolices Ativas"
          value={data?.apolicesAtivas ?? "-"}
          icon="shield-checkmark"
          color={Colors.success}
        />
        <StatCard
          label="Cotacoes Pendentes"
          value={data?.cotacoesPendentes ?? "-"}
          icon="calculator"
          color={Colors.info}
        />
        <StatCard
          label="Comissoes do Mes"
          value={data ? formatCurrency(data.comissoesDoMes) : "-"}
          icon="cash"
          color={Colors.accent}
        />
      </View>

      <View style={styles.alertsRow}>
        <TouchableOpacity style={[styles.alertCard, { backgroundColor: Colors.warning + "15" }]}>
          <Ionicons name="time" size={20} color={Colors.warning} />
          <Text style={styles.alertValue}>{data?.apolicesVencendo ?? 0}</Text>
          <Text style={styles.alertLabel}>Vencendo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.alertCard, { backgroundColor: Colors.error + "15" }]}>
          <Ionicons name="warning" size={20} color={Colors.error} />
          <Text style={styles.alertValue}>{data?.sinistrosAbertos ?? 0}</Text>
          <Text style={styles.alertLabel}>Sinistros</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Acoes Rapidas</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/nova-cotacao")}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.info + "20" }]}>
              <Ionicons name="add-circle" size={24} color={Colors.info} />
            </View>
            <Text style={styles.actionText}>Nova Cotacao</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/(tabs)/apolices")}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.success + "20" }]}>
              <Ionicons name="search" size={24} color={Colors.success} />
            </View>
            <Text style={styles.actionText}>Buscar Apolice</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/(tabs)/chat")}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.accent + "20" }]}>
              <Ionicons name="chatbubbles" size={24} color={Colors.accent} />
            </View>
            <Text style={styles.actionText}>Chat MarIAna</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Atividade Recente</Text>
        {data?.ultimasAtividades?.map((item) => (
          <AtividadeItem key={item.id} item={item} />
        ))}
      </View>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  greeting: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
    color: Colors.white,
  },
  date: {
    fontSize: FontSize.sm,
    color: Colors.accentLight,
    marginTop: Spacing.xs,
    textTransform: "capitalize",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: Spacing.md,
    marginTop: -Spacing.md,
    gap: Spacing.sm,
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    width: "48%",
    flexGrow: 1,
    borderLeftWidth: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  alertsRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  alertCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  alertValue: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.text,
  },
  alertLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  quickActions: {
    padding: Spacing.md,
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  actionText: {
    fontSize: FontSize.xs,
    color: Colors.text,
    textAlign: "center",
    fontWeight: "500",
  },
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  atividadeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  atividadeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  atividadeContent: {
    flex: 1,
  },
  atividadeDesc: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: "500",
  },
  atividadeCliente: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  atividadeData: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
  },
});
