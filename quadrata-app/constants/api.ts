import { Platform } from "react-native";

// Em produção (Railway), usar a URL pública. Em dev, usar localhost.
const PROD_URL = process.env.EXPO_PUBLIC_API_URL || "";

export const API_BASE =
  PROD_URL ||
  (Platform.OS === "web" ? "" : "http://localhost:3000");

export async function apiFetch(path: string, opts: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = "Bearer " + token;
  const res = await fetch(API_BASE + path, { ...opts, headers: { ...headers, ...(opts.headers as any) } });
  return res.json();
}
