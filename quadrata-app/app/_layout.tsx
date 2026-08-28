import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="screens/cotacao" options={{ headerShown: true, title: "Solicitar Cotação", headerStyle: { backgroundColor: "#0D2B6E" }, headerTintColor: "#fff" }} />
        <Stack.Screen name="screens/contato" options={{ headerShown: true, title: "Contatar Corretor", headerStyle: { backgroundColor: "#0D2B6E" }, headerTintColor: "#fff" }} />
        <Stack.Screen name="screens/sinistro" options={{ headerShown: true, title: "Acionar Sinistro", headerStyle: { backgroundColor: "#0D2B6E" }, headerTintColor: "#fff" }} />
        <Stack.Screen name="screens/boleto" options={{ headerShown: true, title: "2ª Via de Boleto", headerStyle: { backgroundColor: "#0D2B6E" }, headerTintColor: "#fff" }} />
        <Stack.Screen name="screens/assistencia" options={{ headerShown: true, title: "Assistência 24h", headerStyle: { backgroundColor: "#0D2B6E" }, headerTintColor: "#fff" }} />
        <Stack.Screen name="screens/seguro-detalhe" options={{ headerShown: true, title: "Meu Seguro", headerStyle: { backgroundColor: "#0D2B6E" }, headerTintColor: "#fff" }} />
      </Stack>
    </>
  );
}
