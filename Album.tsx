// src/screens/Album.tsx
import {
  View,
  Text,
  FlatList,
  Image,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";

import Navbar from "../components/NavBar";
import { api } from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");
const GAP = 8;
const PHOTO_SIZE = (width - 16 * 2 - GAP * 2) / 3;

export default function Album() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuth();

  const album = route?.params?.album;
  const albumId = album?.id;

  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // ================= LOAD PHOTOS BLINDADO =================
  async function loadPhotos() {
    if (!user || !albumId) return;

    try {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);

      const res = await api.get(`/photos?album_id=${albumId}`, {
        signal: abortRef.current.signal,
      });

      if (mountedRef.current) {
        setPhotos(res.data || []);
      }
    } catch (err: any) {
      if (err.name === "CanceledError") return;

      if (err?.response?.status === 401) {
        console.log("🚨 Sessão morta dentro do Album");
        signOut();
        return;
      }

      console.log("❌ ERRO AO CARREGAR FOTOS:", err);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }

  // ================= CICLO DE VIDA BLINDADO =================
  useEffect(() => {
    mountedRef.current = true;

    loadPhotos();

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, [albumId, user]);

  // ================= FALLBACK SE ALBUM NÃO EXISTIR =================
  if (!albumId) {
    return (
      <View style={styles.container}>
        <Navbar title="Álbum" />
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={52} color="#333" />
          <Text style={styles.emptyTitle}>Álbum inválido</Text>
          <Text style={styles.emptySubtitle}>
            Esse álbum não existe ou foi removido.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ================= NAVBAR ================= */}
      <Navbar title={album.title} />

      {/* ================= GRID DE FOTOS ================= */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={styles.loadingText}>Carregando memórias…</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => String(item.id)}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 16,
          }}
          columnWrapperStyle={{
            justifyContent: "space-between",
            marginBottom: GAP,
          }}
          renderItem={({ item }) => (
            <View style={styles.photoWrapper}>
              <Image
                source={{ uri: item.image_url }}
                style={styles.photo}
                resizeMode="cover"
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="images-outline" size={52} color="#333" />
              <Text style={styles.emptyTitle}>Nenhuma foto ainda</Text>
              <Text style={styles.emptySubtitle}>
                Toque no botão + para começar a criar esse álbum
              </Text>
            </View>
          }
        />
      )}

      {/* ================= FLOATING ADD BUTTON ================= */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate("MainTabs", {
            screen: "Criar",
            params: { albumId },
          })
        }
      >
        <Ionicons name="add" size={30} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

/* ========================= STYLES ========================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#777",
    fontSize: 13,
  },

  photoWrapper: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    backgroundColor: "#0f0f0f",
    borderRadius: 14,
    overflow: "hidden",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },

  photo: {
    width: "100%",
    height: "100%",
  },

  emptyState: {
    marginTop: 140,
    alignItems: "center",
    paddingHorizontal: 40,
  },

  emptyTitle: {
    marginTop: 14,
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },

  emptySubtitle: {
    color: "#777",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 14,
  },
});
