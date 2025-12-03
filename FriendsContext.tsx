import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

export type FriendUser = {
  id: string;
  username: string;
  email?: string;
  avatar_url?: string;
};

export type Friend = {
  id: string;
  friend: FriendUser;
};

export type FriendRequest = {
  id: string;
  from_user: FriendUser;
  status: "pending" | "accepted" | "rejected";
};

type FriendsContextType = {
  friends: Friend[];
  requests: FriendRequest[];
  outgoingRequests: string[];
  loading: boolean;

  loadFriends: () => Promise<void>;
  loadRequests: () => Promise<void>;

  sendFriendRequest: (userId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
};

const FriendsContext = createContext<FriendsContextType>(
  {} as FriendsContextType
);

export function FriendsProvider({ children }: { children: ReactNode }) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const { user, signOut } = useAuth(); // ✅ CONTROLA SESSÃO AQUI

  // ======================== LOAD FRIENDS ========================
  async function loadFriends() {
    if (!user) return;

    try {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);

      const res = await api.get("/friends/", {
        signal: abortRef.current.signal,
      });

      setFriends(res.data || []);
    } catch (err: any) {
      if (err.name === "CanceledError") return;

      if (err?.response?.status === 401) {
        console.log("🚨 Sessão morta ao carregar amigos");
        signOut();
        return;
      }

      console.log("❌ ERRO AO CARREGAR AMIGOS:", err);
    } finally {
      setLoading(false);
    }
  }

  // ======================== LOAD REQUESTS ========================
  async function loadRequests() {
    if (!user) return;

    try {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);

      const incoming = await api.get("/friends/requests", {
        signal: abortRef.current.signal,
      });
      setRequests(incoming.data || []);

      const outgoing = await api.get("/friends/sent", {
        signal: abortRef.current.signal,
      });

      setOutgoingRequests(
        (outgoing.data || []).map((r: { to_user_id: string }) => r.to_user_id)
      );
    } catch (err: any) {
      if (err.name === "CanceledError") return;

      if (err?.response?.status === 401) {
        console.log("🚨 Sessão morta ao carregar pedidos");
        signOut();
        return;
      }

      console.log("❌ ERRO AO CARREGAR PEDIDOS:", err);
    } finally {
      setLoading(false);
    }
  }

  // ======================== ACTIONS ========================
  async function sendFriendRequest(userId: string) {
    if (!user) return;

    try {
      await api.post("/friends/request", { to_user_id: userId });

      setOutgoingRequests((prev) => [...prev, userId]);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        console.log("🚨 Sessão morta ao enviar pedido");
        signOut();
        return;
      }

      console.log("❌ ERRO AO ENVIAR PEDIDO:", err);
      throw err;
    }
  }

  async function acceptFriendRequest(requestId: string) {
    if (!user) return;

    try {
      await api.post("/friends/accept", { request_id: requestId });

      setRequests((prev) => prev.filter((req) => req.id !== requestId));

      await loadFriends();
      await loadRequests();
    } catch (err: any) {
      if (err?.response?.status === 401) {
        console.log("🚨 Sessão morta ao aceitar pedido");
        signOut();
        return;
      }

      console.log("❌ ERRO AO ACEITAR PEDIDO:", err);
      throw err;
    }
  }

  async function rejectFriendRequest(requestId: string) {
    if (!user) return;

    try {
      await api.post("/friends/reject", { request_id: requestId });

      setRequests((prev) => prev.filter((req) => req.id !== requestId));

      await loadRequests();
    } catch (err: any) {
      if (err?.response?.status === 401) {
        console.log("🚨 Sessão morta ao recusar pedido");
        signOut();
        return;
      }

      console.log("❌ ERRO AO RECUSAR PEDIDO:", err);
      throw err;
    }
  }

  async function removeFriend(friendId: string) {
    if (!user) return;

    try {
      await api.delete(`/friends/${friendId}`);

      setFriends((prev) => prev.filter((f) => f.friend.id !== friendId));
    } catch (err: any) {
      if (err?.response?.status === 401) {
        console.log("🚨 Sessão morta ao remover amigo");
        signOut();
        return;
      }

      console.log("❌ ERRO AO REMOVER AMIGO:", err);
      throw err;
    }
  }

  // ======================== SESSION WATCH ========================
  useEffect(() => {
    if (user) {
      console.log("👥 FriendsContext: Carregando dados...");
      loadFriends();
      loadRequests();
    } else {
      console.log("🧹 FriendsContext: Limpando dados (logout)");
      abortRef.current?.abort();
      setFriends([]);
      setRequests([]);
      setOutgoingRequests([]);
    }
  }, [user]);

  // ======================== PROVIDER ========================
  return (
    <FriendsContext.Provider
      value={{
        friends,
        requests,
        outgoingRequests,
        loading,
        loadFriends,
        loadRequests,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend,
      }}
    >
      {children}
    </FriendsContext.Provider>
  );
}

export function useFriends() {
  return useContext(FriendsContext);
}
