import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import Navbar from "../components/NavBar";
import { useFriends } from "../context/FriendsContext";
import { useAuth } from "../context/AuthContext";

export default function FriendsSearch() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    sendFriendRequest,
    friends,
    outgoingRequests,
  } = useFriends();

  const { user, signOut } = useAuth();

  // ✅ ANTI setState APÓS UNMOUNT + CANCELAMENTO DE BUSCA
  const mountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  // =========================
  // ✅ BUSCA BLINDADA
  // =========================
  async function searchUsers(text: string) {
    setQuery(text);

    if (!user || text.length < 2) {
      abortRef.current?.abort();
      setUsers([]);
      return;
    }

    try {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      if (mountedRef.current) setLoading(true);

      const res = await api.get(`/users/search?q=${text}`, {
        signal: abortRef.current.signal,
      });

      if (mountedRef.current) {
        setUsers(res.data || []);
      }
    } catch (err: any) {
      if (err.name === "CanceledError") return;

      if (err?.response?.status === 401) {
        signOut();
        return;
      }

      console.log("❌ ERRO AO BUSCAR USUÁRIOS:", err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  // =========================
  // ✅ STATUS REAL DO BOTÃO
  // =========================
  function getStatus(userId: string) {
    if (friends.some((f) => f.friend.id === userId)) {
      return "friend";
    }

    if (outgoingRequests.includes(userId)) {
      return "pending";
    }

    return "add";
  }

  // =========================
  // ✅ ADD FRIEND BLINDADO
  // =========================
  async function handleAdd(id: string) {
    try {
      if (!user) return;

      await sendFriendRequest(id);
    } catch (err: any) {
      alert(err?.message || "Erro ao enviar pedido");
    }
  }

  return (
    <View style={styles.container}>
      <Navbar title="Adicionar Amigos" />

      <TextInput
        style={styles.input}
        placeholder="Buscar por username..."
        placeholderTextColor="#777"
        value={query}
        onChangeText={searchUsers}
        editable={!!user}
      />

      <FlatList
        data={users}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 18 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const status = getStatus(item.id);

          return (
            <View style={styles.userRow}>
              <Image
                source={{
                  uri:
                    item.avatar_url ||
                    `https://ui-avatars.com/api/?name=${item.username}`,
                }}
                style={styles.avatar}
              />

              <Text style={styles.username}>@{item.username}</Text>

              {status === "pending" && (
                <View style={styles.pending}>
                  <Text style={styles.pendingText}>Pendente</Text>
                </View>
              )}

              {status === "friend" && (
                <View style={styles.friend}>
                  <Text style={styles.friendText}>Amigo</Text>
                </View>
              )}

              {status === "add" && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleAdd(item.id)}
                  disabled={!user}
                >
                  <Text style={styles.addText}>Adicionar</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  input: {
    height: 48,
    margin: 16,
    borderRadius: 14,
    backgroundColor: "#111",
    paddingHorizontal: 14,
    color: "#fff",
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
  },

  username: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#fff",
  },

  addText: {
    color: "#000",
    fontWeight: "700",
  },

  pending: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#222",
  },

  pendingText: {
    color: "#aaa",
    fontWeight: "700",
  },

  friend: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#1db954",
  },

  friendText: {
    color: "#000",
    fontWeight: "800",
  },
});
