// src/services/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ==============================
// ✅ CONFIGURAÇÃO BÁSICA
// ==============================
const BASE_URL = "http://192.168.0.20:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// ==============================
// ✅ CONTROLE DE REFRESH GLOBAL
// ==============================
let isRefreshing = false;

type FailedRequest = {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
};

let failedQueue: FailedRequest[] = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
}

// ==============================
// ✅ INTERCEPTOR DE REQUEST
// — injeta o access_token em TODAS as rotas protegidas
// ==============================
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem("@napse:token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==============================
// ✅ FUNÇÃO DE REFRESH TOKEN
// ==============================
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await AsyncStorage.getItem("@napse:refresh");

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await api.post("/auth/refresh", {
      refresh_token: refreshToken,
    });

    const newAccess = response?.data?.access_token as string | undefined;

    if (!newAccess) {
      return null;
    }

    await AsyncStorage.setItem("@napse:token", newAccess);

    return newAccess;
  } catch {
    return null;
  }
}

// ==============================
// ✅ INTERCEPTOR DE RESPOSTA
// — tenta dar refresh em 401
// — se falhar, dispara "session-expired"
// — SEM quebrar err.response para os callers
// ==============================
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest: any = error.config;
    const status = error.response?.status;

    // Se não for 401, normaliza a mensagem e repassa o erro
    if (status !== 401) {
      const detail =
        (error.response?.data as any)?.detail ||
        (error.response?.data as any)?.message;

      if (detail) {
        error.message = detail;
      }

      return Promise.reject(error);
    }

    // Evita loop infinito
    if (originalRequest?._retry) {
      await AsyncStorage.multiRemove([
        "@napse:user",
        "@napse:token",
        "@napse:refresh",
      ]);

      globalThis.dispatchEvent?.(new Event("session-expired"));

      return Promise.reject(error);
    }

    // Não tenta refresh em rotas de auth
    const url = originalRequest?.url || "";

    if (
      url.includes("/auth/login") ||
      url.includes("/auth/signup") ||
      url.includes("/auth/refresh")
    ) {
      const detail =
        (error.response?.data as any)?.detail ||
        (error.response?.data as any)?.message;

      if (detail) {
        error.message = detail;
      }

      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      // Se já estiver atualizando, coloca na fila
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string | null) => {
            if (!token) {
              reject(error);
              return;
            }

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }

            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const newAccessToken = await refreshAccessToken();

      if (!newAccessToken) {
        // Refresh falhou: limpa tudo e encerra sessão
        await AsyncStorage.multiRemove([
          "@napse:user",
          "@napse:token",
          "@napse:refresh",
        ]);

        processQueue(null, null);
        globalThis.dispatchEvent?.(new Event("session-expired"));

        return Promise.reject(error);
      }

      processQueue(null, newAccessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }

      return api(originalRequest);
    } catch (err) {
      processQueue(err, null);

      await AsyncStorage.multiRemove([
        "@napse:user",
        "@napse:token",
        "@napse:refresh",
      ]);

      globalThis.dispatchEvent?.(new Event("session-expired"));

      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);
