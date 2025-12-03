import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";

type User = {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const mountedRef = useRef(true);

  // ===============================
  // ✅ CONTROLE DE MONTAGEM
  // ===============================
  useEffect(() => {
    mountedRef.current = true;
    loadStorage();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ===============================
  // ✅ CARREGAR SESSÃO COM VALIDAÇÃO REAL NO BACKEND
  // ===============================
  async function loadStorage() {
    try {
      const savedUser = await AsyncStorage.getItem("@napse:user");
      const savedToken = await AsyncStorage.getItem("@napse:token");

      if (!savedUser || !savedToken) {
        if (mountedRef.current) {
          setUser(null);
        }
        return;
      }

      const parsed = JSON.parse(savedUser);

      if (!parsed?.id) {
        throw new Error("User inválido no storage");
      }

      // ✅ TESTA O TOKEN NO BACKEND (SE FALHAR, LIMPA TUDO)
      await api.get("/albums"); // ✅ rota protegida simples

      if (mountedRef.current) {
        setUser(parsed);
      }
    } catch (err) {
      console.log("❌ Sessão inválida no boot, limpando tudo:", err);

      await AsyncStorage.multiRemove([
        "@napse:user",
        "@napse:token",
        "@napse:refresh",
      ]);

      if (mountedRef.current) {
        setUser(null);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }

  // ===============================
  // ✅ SIGN UP
  // ===============================
  async function signUp(username: string, email: string, password: string) {
    try {
      const res = await api.post("/auth/signup", {
        username,
        email,
        password,
      });

      const { access_token, refresh_token, user } = res.data;

      await AsyncStorage.multiSet([
        ["@napse:token", access_token],
        ["@napse:refresh", refresh_token],
        ["@napse:user", JSON.stringify(user)],
      ]);

      if (mountedRef.current) {
        setUser(user);
      }

      console.log("✅ SIGNUP: sessão criada");
    } catch (err) {
      console.log("❌ SIGNUP FALHOU:", err);
      throw err;
    }
  }

  // ===============================
  // ✅ SIGN IN
  // ===============================
  async function signIn(email: string, password: string) {
    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const { access_token, refresh_token, user } = res.data;

      await AsyncStorage.multiSet([
        ["@napse:token", access_token],
        ["@napse:refresh", refresh_token],
        ["@napse:user", JSON.stringify(user)],
      ]);

      if (mountedRef.current) {
        setUser(user);
      }

      console.log("✅ LOGIN OK");
    } catch (err) {
      console.log("❌ LOGIN FALHOU:", err);
      throw err;
    }
  }

  // ===============================
  // ✅ ATUALIZAR AVATAR
  // ===============================
  async function updateAvatar(avatarUrl: string) {
    if (!user) return;

    const updatedUser: User = {
      ...user,
      avatar_url: avatarUrl,
    };

    if (mountedRef.current) {
      setUser(updatedUser);
    }

    await AsyncStorage.setItem("@napse:user", JSON.stringify(updatedUser));
  }

  // ===============================
  // ✅ SIGN OUT 100% LIMPO + SAFE
  // ===============================
  async function signOut() {
    console.log("🔓 LOGOUT: limpando sessão");

    await AsyncStorage.multiRemove([
      "@napse:user",
      "@napse:token",
      "@napse:refresh",
    ]);

    if (mountedRef.current) {
      setUser(null);
    }

    console.log("✅ LOGOUT concluído");
  }

  // ===============================
  // ✅ LISTENER GLOBAL DE SESSÃO MORTA (VINDO DO api.ts)
  // ===============================
  useEffect(() => {
    const handler = async () => {
      console.log("🚨 Sessão expirada via evento global");
      await signOut();
    };

    globalThis.addEventListener?.("session-expired", handler);

    return () => {
      globalThis.removeEventListener?.("session-expired", handler);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        updateAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
