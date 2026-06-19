import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { token } = useAuth();
  return <Redirect href={token ? "/(tabs)/inicio" : "/login"} />;
}
