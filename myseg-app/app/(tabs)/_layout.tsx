import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const tabs: { name: string; title: string; icon: IconName }[] = [
  { name: "inicio", title: "Inicio", icon: "home" },
  { name: "seguros", title: "Meus Seguros", icon: "shield-checkmark" },
  { name: "sinistros", title: "Sinistros", icon: "alert-circle" },
  { name: "contato", title: "Contato", icon: "chatbubbles" },
  { name: "perfil", title: "Perfil", icon: "person" },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={tab.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
