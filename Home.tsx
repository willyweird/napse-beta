import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  Dimensions,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";

import { useAlbums } from "../context/AlbumsContext";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/NavBar";

const { width } = Dimensions.get("window");
const GAP = 14;
const CARD_SIZE = (width - 16 * 2 - GAP) / 2;

export default function Home() {
  const { albums, loading, loadAlbums } = useAlbums();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  // ✅ GARANTE QUE NÃO RODA COM USER NULO
  useEffect(() => {
    if (user) {
      loadAlbums();
    }
  }, [user]);

  return (
    <View style={styles.container}>
      {/* ================= NAVBAR ================= */}
      <Navbar title="napse" />

      {/* ================= GRID ================= */}
      <FlatList
        data={albums}
        keyExtractor={(item) => String(item?.id)}
        numColumns={2}
        scrollEnabled
        showsVerticalScrollIndicator={false}
        bounces
        overScrollMode="always"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              if (user) loadAlbums(); // ✅ BLOQUEIA SE USER CAIR
            }}
            tintColor="#fff"
          />
        }
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: 16,
        }}
        columnWrapperStyle={{
          justifyContent: "space-between",
          marginBottom: GAP,
        }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => {
              if (!item?.id) return;

              navigation.navigate("Album", {
                album: item, // ✅ Envia álbum completo
              });
            }}
          >
            <View style={styles.cardImageWrapper}>
              {item?.cover_url ? (
                <Image
                  source={{ uri: item.cover_url }}
                  style={styles.cardImage}
                />
              ) : (
                <View style={styles.emptyCover}>
                  <Text style={{ color: "#555" }}>Sem capa</Text>
                </View>
              )}

              {/* OVERLAY COM NOME */}
              <View style={styles.overlay}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item?.title || "Álbum"}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Nenhum álbum ainda</Text>
              <Text style={styles.emptySubtitle}>
                Crie seu primeiro álbum tocando no botão +
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

/* ========================= STYLES ========================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  /* -------- Card -------- */
  card: {
    width: CARD_SIZE,
  },

  cardImageWrapper: {
    width: "100%",
    height: CARD_SIZE,
    borderRadius: 22,
    backgroundColor: "#111",
    overflow: "hidden",
  },

  cardImage: {
    width: "100%",
    height: "100%",
  },

  emptyCover: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  /* -------- Overlay -------- */
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  cardTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },

  /* -------- Empty State -------- */
  emptyState: {
    marginTop: 120,
    alignItems: "center",
    paddingHorizontal: 40,
  },

  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },

  emptySubtitle: {
    color: "#777",
    fontSize: 13,
    textAlign: "center",
  },
});
