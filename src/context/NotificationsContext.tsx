import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

export type NotificationUser = {
  id: string;
  username: string;
  avatar_url?: string;
};

export type Notification = {
  id: string;
  user_id: string;
  from_user_id?: string;
  from_user?: NotificationUser;
  type: string;
  entity_id?: string;
  message: string;
  read: boolean;
  created_at: string;
};

type NotificationsContextType = {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  loadNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextType>(
  {} as NotificationsContextType
);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const { user, signOut } = useAuth();

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ==========================
  // ✅ LOAD NOTIFICATIONS (SEGURO)
  // ==========================
  async function loadNotifications() {
    if (!user) return;

    try {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);

      const res = await api.get("/notifications", {
        signal: abortRef.current.signal,
      });

      setNotifications(res.data || []);
    } catch (err: any) {
      if (err?.name === "CanceledError") return;

      if (err?.response?.status === 401) {
        console.log("🚨 Sessão expirada nas notificações (401)");
        signOut();
        return;
      }

      // ✅ 500, 404, 503 NÃO DEVEM DESLOGAR
      console.log(
        "❌ ERRO REAL AO CARREGAR NOTIFICAÇÕES:",
        err?.response?.status,
        err?.message
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================
  // ✅ MARK ONE AS READ
  // ==========================
  async function markAsRead(id: string) {
    if (!user) return;

    try {
      await api.post(`/notifications/read/${id}`);

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err: any) {
      if (err?.response?.status === 401) {
        console.log("🚨 Sessão expirada ao marcar notificação");
        signOut();
        return;
      }

      console.log(
        "❌ ERRO REAL AO MARCAR COMO LIDA:",
        err?.response?.status,
        err?.message
      );
    }
  }

  // ==========================
  // ✅ MARK ALL AS READ
  // ==========================
  async function markAllAsRead() {
    if (!user) return;

    try {
      await api.post("/notifications/read-all");

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err: any) {
      if (err?.response?.status === 401) {
        console.log("🚨 Sessão expirada ao marcar todas como lidas");
        signOut();
        return;
      }

      console.log(
        "❌ ERRO REAL AO MARCAR TODAS COMO LIDAS:",
        err?.response?.status,
        err?.message
      );
    }
  }

  // ==========================
  // ✅ LIFECYCLE
  // ==========================
  useEffect(() => {
    if (user) {
      console.log("🔔 NotificationsContext: Carregando notificações");
      loadNotifications();
    } else {
      console.log("🧹 NotificationsContext: Sessão finalizada");
      abortRef.current?.abort();
      setNotifications([]);
    }
  }, [user]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        loadNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
