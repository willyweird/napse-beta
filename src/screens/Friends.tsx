import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { useFriends } from "../context/FriendsContext";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/NavBar";

export default function Friends() {
  const { friends, removeFriend } = useFriends();
  const { signOut } = useAuth();

  const [removingId, setRemovingId] = useState<string | null>(null);

  // ✅ CONTROLE DE MONTAGEM (ANTI setState APÓS UNMOUNT)
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // =========================
  // ✅ REMOVER AMIGO BLINDADO
  // =========================
  function handleRemove(friendId: string) {
    if (removingId) return; // ✅ bloqueia remoções múltiplas

    Alert.alert(
      "Remover amigo",
      "Tem certeza que deseja remover este amigo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              if (mountedRef.current) setRemovingId(friendId);

              await removeFriend(friendId);
            } catch (err: any) {
              if (err?.response?.status === 401) {
                signOut();
                return;
              }

              Alert.alert(
                "Erro",
                err?.message || "Erro ao remover amigo"
              );
            } finally {
              if (mountedRef.current) setRemovingId(null);
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <Navbar title="Amigos" />

      <FlatList
        data={friends}
        keyExtractor={(item) =>
          String(item?.friend?.id || Math.random())
        }
        contentContainerStyle={{ padding: 18 }}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum amigo ainda</Text>
        }
        renderItem={({ item }) => {
          if (!item?.friend) return null;

          const isRemoving = removingId === item.friend.id;

          return (
            <View style={styles.row}>
              <Image
                source={{
                  uri:
                    item.friend.avatar_url ||
                    `https://ui-avatars.com/api/?name=${item.friend.username || "User"}`,
                }}
                style={styles.avatar}
              />

              <Text style={styles.username}>
                @{item.friend.username}
              </Text>

              <TouchableOpacity
                style={[
                  styles.removeButton,
                  isRemoving && { opacity: 0.6 },
                ]}
                onPress={() => handleRemove(item.friend.id)}
                disabled={isRemoving}
              >
                <Text style={styles.removeText}>
                  {isRemoving ? "Removendo..." : "Remover"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  empty: {
    color: "#777",
    textAlign: "center",
    marginTop: 60,
  },

  row: {
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

  removeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#ff2d55",
  },

  removeText: {
    color: "#fff",
    fontWeight: "700",
  },
});
