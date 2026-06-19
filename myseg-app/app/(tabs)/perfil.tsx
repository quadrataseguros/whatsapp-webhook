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
      <View style={[styles.menuIcon, { backgroundColor: (color || Colors.primary) + "12" }]}>
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
    Alert.alert("Sair", "Deseja sair do Quadrata App?", [
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

  const nome = perfil?.nome || "Cliente";
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
        <Text style={styles.cpf}>CPF: ***.***.***-00</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Minha Conta</Text>
        <View style={styles.menuGroup}>
          <MenuItem icon="person" label="Dados Pessoais" sublabel="Nome, telefone, endereco" />
          <MenuItem icon="lock-closed" label="Alterar Senha" sublabel="Atualizar sua senha" />
          <MenuItem icon="notifications" label="Notificacoes" sublabel="Alertas de vencimento" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documentos</Text>
        <View style={styles.menuGroup}>
          <MenuItem icon="document-text" label="Apolices" sublabel="Documentos dos seus seguros" />
          <MenuItem icon="receipt" label="Boletos" sublabel="Segundas vias e historico" />
          <MenuItem icon="folder" label="Comprovantes" sublabel="Comprovantes de pagamento" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ajuda</Text>
        <View style={styles.menuGroup}>
          <MenuItem icon="help-circle" label="Duvidas Frequentes" sublabel="Perguntas comuns" />
          <MenuItem icon="information-circle" label="Sobre o App" sublabel="Quadrata App v1.0.0" />
          <MenuItem icon="star" label="Avaliar o App" sublabel="Sua opiniao e importante" />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.menuGroup}>
          <MenuItem icon="log-out" label="Sair da Conta" color={Colors.error} onPress={handleLogout} />
        </View>
      </View>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  avatarText: { fontSize: FontSize.xxl, fontWeight: "bold", color: Colors.primary },
  nome: { fontSize: FontSize.xl, fontWeight: "bold", color: Colors.white },
  cpf: { fontSize: FontSize.sm, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  section: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg },
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
    borderBottomColor: Colors.surfaceVariant,
    gap: Spacing.sm,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: FontSize.md, color: Colors.text, fontWeight: "500" },
  menuSublabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
});
