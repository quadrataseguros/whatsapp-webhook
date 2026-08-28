import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";

function Icon({ label, emoji }: { label: string; emoji: string }) {
  return (
    <View style={s.iconWrap}>
      <Text style={s.emoji}>{emoji}</Text>
      <Text style={s.label}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#E0E8F5",
          height: 60,
          paddingBottom: 6,
        },
        tabBarActiveTintColor: "#0D2B6E",
        tabBarInactiveTintColor: "#aaa",
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: "Início",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="seguros"
        options={{
          title: "Meus Seguros",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📋</Text>,
        }}
      />
      <Tabs.Screen
        name="sinistros"
        options={{
          title: "Sinistros",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🚨</Text>,
        }}
      />
      <Tabs.Screen
        name="mensagens"
        options={{
          title: "Mensagens",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>💬</Text>,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  iconWrap: { alignItems: "center" },
  emoji: { fontSize: 22 },
  label: { fontSize: 9, color: "#0D2B6E" },
});
