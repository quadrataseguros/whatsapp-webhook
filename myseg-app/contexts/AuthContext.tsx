import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api, Perfil } from "@/services/api";

interface AuthState {
  token: string | null;
  perfil: Perfil | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  token: null,
  perfil: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (email: string, senha: string) => {
    const result = await api.login(email, senha);
    setToken(result.token);
    setPerfil(result.perfil);
  };

  const logout = () => {
    setToken(null);
    setPerfil(null);
  };

  return (
    <AuthContext.Provider value={{ token, perfil, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
