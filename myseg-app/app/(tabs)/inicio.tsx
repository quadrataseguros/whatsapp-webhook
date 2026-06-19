import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Colors, Spacing, FontSize, BorderRadius } from "@/constants/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface MenuItemData {
  icon: IconName;
  label: string;
  color: string;
  onPress: () => void;
}

function MenuButton({ icon, label, color, onPress }: MenuItemData) {
  return (
    <TouchableOpacity style={styles.menuButton} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={30} color={color} />
      </View>
      <Text style={styles.menuLabel} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function InicioScreen() {
  const { perfil } = useAuth();
  const nome = perfil?.nome?.split(" ")[0] || "Cliente";

  const menuItems: MenuItemData[] = [
    {
      icon: "shield-checkmark",
      label: "Meus\nSeguros",
      color: Colors.primary,
      onPress: () => router.push("/(tabs)/seguros"),
    },
    {
      icon: "document-text",
      label: "Solicitar\nCotacao",
      color: Colors.accent,
      onPress: () => router.push("/solicitar-cotacao"),
    },
    {
      icon: "alert-circle",
      label: "Acionar\nSinistro",
      color: Colors.error,
      onPress: () => router.push("/novo-sinistro"),
    },
    {
      icon: "call",
      label: "Falar com\nCorretor",
      color: "#7B1FA2",
      onPress: () => router.push("/(tabs)/contato"),
    },
    {
      icon: "logo-whatsapp",
      label: "WhatsApp",
      color: Colors.whatsapp,
      onPress: () => Linking.openURL("https://wa.me/5511999887766?text=Ola%20Quadrata!"),
    },
    {
      icon: "card",
      label: "2a Via\nBoleto",
      color: "#00897B",
      onPress: () => {},
    },
    {
      icon: "car",
      label: "Assistencia\n24h",
      color: "#E65100",
      onPress: () => Linking.openURL("tel:08007777777"),
    },
    {
      icon: "help-circle",
      label: "Duvidas\nFrequentes",
      color: "#546E7A",
      onPress: () => {},
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Ola, {nome}!</Text>
            <Text style={styles.welcomeText}>Bem-vindo ao Quadrata App</Text>
          </View>
          <View style={styles.headerLogo}>
            <Text style={styles.headerLogoText}>Q</Text>
          </View>
        </View>
      </View>

      <View style={styles.alertBanner}>
        <Ionicons name="notifications" size={20} color={Colors.accent} />
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle}>Seguro Auto vence em 15 dias</Text>
          <Text style={styles.alertSub}>Fale com seu corretor para renovar</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
      </View>

      <View style={styles.menuGrid}>
        {menuItems.map((item, index) => (
          <MenuButton key={index} {...item} />
        ))}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Quadrata Seguros</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color={Colors.primary} />
            <Text style={styles.infoText}>Seu corretor de confianca</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time" size={16} color={Colors.primary} />
            <Text style={styles.infoText}>Seg a Sex - 9h as 18h</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call" size={16} color={Colors.primary} />
            <Text style={styles.infoText}>(11) 99988-7766</Text>
          </View>
        </View>
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl + Spacing.md,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
    color: Colors.white,
  },
  welcomeText: {
    fontSize: FontSize.sm,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  headerLogoText: {
    fontSize: FontSize.xl,
    fontWeight: "900",
    color: Colors.primary,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginTop: -Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
  },
  alertSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: Spacing.md,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  menuButton: {
    width: "23%",
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  menuIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  menuLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
    lineHeight: 14,
  },
  infoSection: {
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
