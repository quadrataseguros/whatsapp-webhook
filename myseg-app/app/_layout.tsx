import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/contexts/AuthContext";
import { Colors } from "@/constants/theme";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.white,
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="apolice/[id]"
          options={{ title: "Detalhes da Apolice" }}
        />
        <Stack.Screen
          name="nova-cotacao"
          options={{ title: "Nova Cotacao", presentation: "modal" }}
        />
      </Stack>
    </AuthProvider>
  );
}
