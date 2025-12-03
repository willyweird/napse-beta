import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { uploadImageAsync } from "../services/uploadImage";
import { api } from "../services/api";
import Navbar from "../components/NavBar";
import { useFriends } from "../context/FriendsContext";
import { useNavigation } from "@react-navigation/native";

export default function Profile() {
  const { user, signOut, updateAvatar } = useAuth();
  const { friends, requests } = useFriends();
  const [uploading, setUploading] = useState(false);
  const navigation = useNavigation<any>();

  // ✅ CONTROLE DE MONTAGEM (ANTI setState APÓS UNMOUNT)
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  if (!user) return null;

  /* =================== TROCAR AVATAR (100% SEGURO) =================== */
  async function changeAvatar() {
    if (uploading || !user) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (result.canceled) return;

      if (!result.assets?.length || !result.assets[0].uri) {
        Alert.alert("Erro", "Imagem inválida");
        return;
      }

      const uri = result.assets[0].uri;

      if (mountedRef.current) setUploading(true);

      const imageUrl = await uploadImageAsync(uri);

      if (!imageUrl) {
        throw new Error("Upload falhou");
      }

      await api.put("/auth/avatar", {
        avatar_url: imageUrl,
      });

      await updateAvatar(imageUrl);

      Alert.alert("Sucesso", "Avatar atualizado!");
    } catch (err: any) {
      if (err?.response?.status === 401) {
        signOut(); // ✅ sessão morta durante upload
        return;
      }

      console.log("❌ ERRO AO TROCAR AVATAR:", err?.message || err);
      Alert.alert("Erro", err?.message || "Não foi possível trocar o avatar");
    } finally {
      if (mountedRef.current) setUploading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* ================= NAVBAR GLOBAL ================= */}
      <Navbar
        title="napse"
        rightIcon="log-out-outline"
        onRightPress={signOut}
      />

      {/* ================= AVATAR ================= */}
      <TouchableOpacity
        style={styles.avatarWrapper}
        onPress={changeAvatar}
        activeOpacity={0.8}
        disabled={uploading}
      >
        <Image
          source={{
            uri:
              user.avatar_url ||
              `https://ui-avatars.com/api/?name=${user.username || "User"}`,
          }}
          style={styles.avatar}
        />

        {uploading && (
          <View style={styles.avatarOverlay}>
            <ActivityIndicator color="#fff" />
          </View>
        )}

        <View style={styles.editBadge}>
          <Ionicons name="camera" size={14} color="#fff" />
        </View>
      </TouchableOpacity>

      {/* ================= INFO ================= */}
      <Text style={styles.username}>@{user.username}</Text>
      <Text style={styles.email}>{user.email}</Text>

      {/* ================= STATS ================= */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Álbuns</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statBox}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Fotos</Text>
        </View>

        <View style={styles.statDivider} />

        {/* ✅ AMIGOS */}
        <TouchableOpacity
          style={styles.statBox}
          onPress={() => navigation.navigate("Friends")}
        >
          <Text style={styles.statNumber}>{friends.length}</Text>
          <Text style={styles.statLabel}>Amigos</Text>

          {requests.length > 0 && (
            <View style={styles.requestBadge}>
              <Text style={styles.requestBadgeText}>
                {requests.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ================= ACTIONS ================= */}
      <TouchableOpacity style={styles.editButton}>
        <Text style={styles.editText}>Editar Perfil</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.searchFriendsButton}
        onPress={() => navigation.navigate("FriendsSearch")}
        disabled={uploading}
      >
        <Ionicons name="person-add-outline" size={18} color="#fff" />
        <Text style={styles.searchFriendsText}>Adicionar Amigos</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ========================= STYLES ========================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
  },

  avatarWrapper: {
    marginTop: 40,
    marginBottom: 18,
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },

  avatar: {
    width: 122,
    height: 122,
    borderRadius: 61,
  },

  avatarOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 66,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  editBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#333",
  },

  username: {
    color: "#fff",
    fontSize: 21,
    fontWeight: "700",
  },

  email: {
    color: "#777",
    fontSize: 13,
    marginTop: 4,
  },

  statsContainer: {
    flexDirection: "row",
    marginTop: 32,
    marginBottom: 30,
    backgroundColor: "#0d0d0d",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 28,
  },

  statBox: {
    alignItems: "center",
    marginHorizontal: 12,
  },

  statNumber: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },

  statLabel: {
    color: "#777",
    fontSize: 12,
    marginTop: 4,
  },

  statDivider: {
    width: 1,
    backgroundColor: "#222",
    marginHorizontal: 18,
  },

  requestBadge: {
    position: "absolute",
    top: -6,
    right: -10,
    backgroundColor: "#ff2d55",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },

  requestBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },

  editButton: {
    width: "82%",
    height: 50,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  editText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 15,
  },

  searchFriendsButton: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#111",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#222",
  },

  searchFriendsText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
