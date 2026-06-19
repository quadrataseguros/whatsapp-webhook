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
          name="seguro/[id]"
          options={{ title: "Meu Seguro" }}
        />
        <Stack.Screen
          name="novo-sinistro"
          options={{ title: "Abrir Sinistro", presentation: "modal" }}
        />
        <Stack.Screen
          name="solicitar-cotacao"
          options={{ title: "Solicitar Cotacao", presentation: "modal" }}
        />
      </Stack>
    </AuthProvider>
  );
}
