import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function MenuItem({
  icon,
  label,
  sublabel,
  onPress,
  color,
}: {
  icon: IconName;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  color?: string;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: (color || Colors.primary) + "15" }]}>
        <Ionicons name={icon} size={20} color={color || Colors.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, color ? { color } : null]}>{label}</Text>
        {sublabel && <Text style={styles.menuSublabel}>{sublabel}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
    </TouchableOpacity>
  );
}

export default function PerfilScreen() {
  const { perfil, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Sair", "Deseja realmente sair do app?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const nome = perfil?.nome || "Corretor Quadrata";
  const email = perfil?.email || "corretor@quadrataseguros.com.br";
  const initials = nome
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.nome}>{nome}</Text>
        <Text style={styles.email}>{email}</Text>
        {perfil?.susep && (
          <View style={styles.susepBadge}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
            <Text style={styles.susepText}>SUSEP: {perfil.susep}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conta</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon="person"
            label="Editar Perfil"
            sublabel="Nome, telefone, foto"
          />
          <MenuItem
            icon="lock-closed"
            label="Alterar Senha"
            sublabel="Atualizar credenciais"
          />
          <MenuItem
            icon="notifications"
            label="Notificacoes"
            sublabel="Alertas de vencimento, sinistros"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Corretora</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon="business"
            label="Dados da Corretora"
            sublabel={perfil?.corretora || "Quadrata Seguros"}
          />
          <MenuItem
            icon="people"
            label="Equipe"
            sublabel="Gerenciar corretores"
          />
          <MenuItem
            icon="document-text"
            label="Relatorios"
            sublabel="Producao, comissoes, renovacoes"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuracoes</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon="color-palette"
            label="Aparencia"
            sublabel="Tema claro/escuro"
          />
          <MenuItem
            icon="help-circle"
            label="Ajuda e Suporte"
            sublabel="FAQ, contato"
          />
          <MenuItem
            icon="information-circle"
            label="Sobre o App"
            sublabel="MYSeg v1.0.0"
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.menuGroup}>
          <MenuItem
            icon="log-out"
            label="Sair da Conta"
            color={Colors.error}
            onPress={handleLogout}
          />
        </View>
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
  profileHeader: {
    backgroundColor: Colors.primary,
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingBottom: Spacing.xl + Spacing.md,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: FontSize.xxl,
    fontWeight: "bold",
    color: Colors.primary,
  },
  nome: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
    color: Colors.white,
  },
  email: {
    fontSize: FontSize.sm,
    color: Colors.accentLight,
    marginTop: 4,
  },
  susepBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.sm,
    gap: 4,
  },
  susepText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.primary,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  menuGroup: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: "500",
  },
  menuSublabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
