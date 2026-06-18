import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, Apolice } from "@/services/api";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/theme";

const tipoIcons: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  auto: "car",
  vida: "heart",
  residencial: "home",
  empresarial: "business",
  saude: "medkit",
};

const statusColors: Record<string, string> = {
  ativa: Colors.success,
  vencida: Colors.error,
  cancelada: Colors.textLight,
  pendente: Colors.warning,
};

const MOCK: Apolice = {
  id: "1",
  numero: "APL-2024-001",
  clienteNome: "Maria Silva",
  clienteTelefone: "5511999887766",
  tipo: "auto",
  seguradora: "Porto Seguro",
  premio: 2800.0,
  vigenciaInicio: "2024-01-15",
  vigenciaFim: "2025-01-15",
  status: "ativa",
  comissao: 560.0,
};

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ComponentProps<typeof Ionicons>["name"] }) {
  return (
    <View style={styles.infoRow}>
      {icon && <Ionicons name={icon} size={16} color={Colors.textSecondary} style={{ marginRight: 8 }} />}
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function ApoliceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [apolice, setApolice] = useState<Apolice | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const result = await api.getApolice(id);
        setApolice(result);
      } catch {
        setApolice(MOCK);
      }
    })();
  }, [id]);

  if (!apolice) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  const statusColor = statusColors[apolice.status] || Colors.textSecondary;
  const icon = tipoIcons[apolice.tipo] || "shield";
  const diasRestantes = Math.ceil(
    (new Date(apolice.vigenciaFim).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const handleWhatsApp = () => {
    const phone = apolice.clienteTelefone.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Ola ${apolice.clienteNome}! Aqui e da Quadrata Seguros, sobre sua apolice ${apolice.numero}.`
    );
    Linking.openURL(`https://wa.me/${phone}?text=${msg}`);
  };

  const handleLigar = () => {
    Linking.openURL(`tel:${apolice.clienteTelefone}`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: Colors.primary + "20" }]}>
          <Ionicons name={icon} size={32} color={Colors.primary} />
        </View>
        <Text style={styles.numero}>{apolice.numero}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {apolice.status.charAt(0).toUpperCase() + apolice.status.slice(1)}
          </Text>
        </View>
      </View>

      {diasRestantes > 0 && diasRestantes <= 30 && (
        <View style={styles.alertBanner}>
          <Ionicons name="warning" size={18} color={Colors.warning} />
          <Text style={styles.alertText}>
            Vence em {diasRestantes} dias - Renovacao pendente
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cliente</Text>
        <View style={styles.card}>
          <InfoRow label="Nome" value={apolice.clienteNome} icon="person" />
          <InfoRow label="Telefone" value={apolice.clienteTelefone} icon="call" />
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={20} color={Colors.success} />
            <Text style={[styles.actionBtnText, { color: Colors.success }]}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLigar}>
            <Ionicons name="call" size={20} color={Colors.info} />
            <Text style={[styles.actionBtnText, { color: Colors.info }]}>Ligar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados da Apolice</Text>
        <View style={styles.card}>
          <InfoRow label="Tipo" value={apolice.tipo.charAt(0).toUpperCase() + apolice.tipo.slice(1)} icon="shield" />
          <InfoRow label="Seguradora" value={apolice.seguradora} icon="business" />
          <InfoRow
            label="Inicio"
            value={new Date(apolice.vigenciaInicio).toLocaleDateString("pt-BR")}
            icon="calendar"
          />
          <InfoRow
            label="Vencimento"
            value={new Date(apolice.vigenciaFim).toLocaleDateString("pt-BR")}
            icon="calendar-outline"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financeiro</Text>
        <View style={styles.financialCards}>
          <View style={[styles.financialCard, { borderLeftColor: Colors.primary }]}>
            <Text style={styles.financialLabel}>Premio Anual</Text>
            <Text style={styles.financialValue}>
              R$ {apolice.premio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={[styles.financialCard, { borderLeftColor: Colors.accent }]}>
            <Text style={styles.financialLabel}>Comissao</Text>
            <Text style={[styles.financialValue, { color: Colors.accent }]}>
              R$ {apolice.comissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.renewButton}
          onPress={() => Alert.alert("Renovacao", "Funcionalidade de renovacao sera implementada em breve.")}
        >
          <Ionicons name="refresh" size={20} color={Colors.white} />
          <Text style={styles.renewButtonText}>Iniciar Renovacao</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  header: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  numero: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.warning + "15",
    padding: Spacing.md,
    margin: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  alertText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: "500",
  },
  section: {
    padding: Spacing.md,
  },
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
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
  },
  infoLabel: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  actionBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
  },
  financialCards: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  financialCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  financialLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  financialValue: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
    color: Colors.text,
    marginTop: 4,
  },
  renewButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  renewButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: "bold",
  },
});
