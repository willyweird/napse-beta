import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";

import { useAlbums } from "../context/AlbumsContext";
import { uploadImageAsync } from "../services/uploadImage";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

type Props = {
  route?: {
    params?: {
      albumId?: string;
    };
  };
};

export default function Create({ route }: Props) {
  const { albums, addAlbum, loadAlbums } = useAlbums();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const forcedAlbumId = route?.params?.albumId || null;

  const [mode, setMode] = useState<"album" | "photo">(
    forcedAlbumId ? "photo" : "album"
  );

  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(
    forcedAlbumId
  );

  const [title, setTitle] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ CONTROLE DE MONTAGEM (ANTI setState APÓS UNMOUNT)
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (user) {
      loadAlbums();
    }

    if (forcedAlbumId) {
      setMode("photo");
      setSelectedAlbumId(forcedAlbumId);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [user]);

  // ================================
  // ✅ PICK IMAGE (BLINDADO)
  // ================================
  async function pickImage() {
    if (loading) return;

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

      if (mountedRef.current) {
        setImage(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert("Erro", "Falha ao selecionar imagem");
    }
  }

  // ================================
  // ✅ CREATE ALBUM (100% SEGURO)
  // ================================
  async function handleCreateAlbum() {
    if (!title.trim() || !image || loading || !user) return;

    try {
      if (mountedRef.current) setLoading(true);

      const publicUrl = await uploadImageAsync(image);

      const res = await api.post("/albums/", {
        title: title.trim(),
        cover_url: publicUrl,
      });

      addAlbum(res.data);

      if (mountedRef.current) {
        setTitle("");
        setImage(null);
      }

      Alert.alert("Sucesso", "Álbum criado!");
    } catch (err: any) {
      if (err?.response?.status === 401) {
        signOut();
        return;
      }

      Alert.alert("Erro", err?.message || "Erro ao criar álbum");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  // ================================
  // ✅ ADD PHOTO (UPLOAD 100% SEGURO)
  // ================================
  async function handleAddPhoto() {
    if (!image || loading || !selectedAlbumId || !user) return;

    try {
      if (mountedRef.current) setLoading(true);

      const formData = new FormData();
      const fileName =
        image.split("/").pop() || `photo-${Date.now()}.jpg`;

      formData.append("file", {
        uri: image,
        name: fileName,
        type: "image/jpeg",
      } as any);

      formData.append("album_id", selectedAlbumId);
      formData.append("user_id", user.id);
      formData.append("caption", "");

      await api.post("/photos/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (mountedRef.current) setImage(null);

      Alert.alert("Sucesso", "Foto adicionada ao álbum!");
    } catch (err: any) {
      if (err?.response?.status === 401) {
        signOut();
        return;
      }

      Alert.alert("Erro", err?.message || "Erro ao adicionar foto");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  const isValid =
    mode === "album"
      ? !!title.trim() && !!image && !loading
      : !!image && !!selectedAlbumId && !loading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{
        flex: 1,
        backgroundColor: "#000",
        paddingTop: insets.top + 20,
        paddingHorizontal: 20,
      }}
    >
      {/* ================= TOGGLE ================= */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#111",
          borderRadius: 18,
          padding: 4,
          marginBottom: 28,
        }}
      >
        {["album", "photo"].map((item) => {
          const active = mode === item;
          return (
            <TouchableOpacity
              key={item}
              disabled={loading}
              onPress={() => {
                setMode(item as any);
                if (item === "album") {
                  setSelectedAlbumId(null);
                }
              }}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 14,
                backgroundColor: active ? "#fff" : "transparent",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: active ? "#000" : "#777",
                  fontWeight: "700",
                }}
              >
                {item === "album" ? "Create Album" : "Add Photo"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ================= TITLE ================= */}
      <Text style={{ color: "#fff", fontSize: 28, fontWeight: "800" }}>
        {mode === "album" ? "Novo Álbum" : "Nova Foto"}
      </Text>

      <Text style={{ color: "#777", marginBottom: 20 }}>
        {mode === "album"
          ? "Crie um novo álbum"
          : "Adicione uma foto a um álbum"}
      </Text>

      {/* ================= INPUT ALBUM ================= */}
      {mode === "album" && (
        <TextInput
          placeholder="Nome do álbum"
          placeholderTextColor="#555"
          value={title}
          onChangeText={setTitle}
          editable={!loading}
          style={{
            borderWidth: 1,
            borderColor: "#222",
            borderRadius: 16,
            padding: 16,
            color: "#fff",
            marginBottom: 22,
            fontSize: 16,
            backgroundColor: "#0d0d0d",
          }}
        />
      )}

      {/* ================= SELECT ALBUM ================= */}
      {mode === "photo" && !forcedAlbumId && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 18 }}
        >
          {albums.map((album) => {
            const active = selectedAlbumId === album.id;
            return (
              <TouchableOpacity
                key={album.id}
                disabled={loading}
                onPress={() => setSelectedAlbumId(album.id)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 16,
                  marginRight: 10,
                  backgroundColor: active ? "#fff" : "#111",
                }}
              >
                <Text
                  style={{
                    color: active ? "#000" : "#777",
                    fontWeight: "600",
                  }}
                >
                  {album.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ================= IMAGE PICKER ================= */}
      <Pressable
        disabled={loading}
        onPress={pickImage}
        style={{
          height: 240,
          borderRadius: 26,
          borderWidth: 1,
          borderColor: "#222",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 34,
          backgroundColor: "#0f0f0f",
          overflow: "hidden",
        }}
      >
        {image ? (
          <Image
            source={{ uri: image }}
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <Text style={{ color: "#777", fontSize: 15 }}>
            Selecionar imagem
          </Text>
        )}
      </Pressable>

      {/* ================= BUTTON ================= */}
      <TouchableOpacity
        onPress={mode === "album" ? handleCreateAlbum : handleAddPhoto}
        activeOpacity={0.85}
        disabled={!isValid}
        style={{
          backgroundColor: isValid ? "#fff" : "#222",
          padding: 18,
          borderRadius: 18,
          alignItems: "center",
          marginBottom: insets.bottom + 20,
        }}
      >
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text
            style={{
              color: isValid ? "#000" : "#666",
              fontWeight: "800",
              fontSize: 16,
            }}
          >
            {mode === "album" ? "Criar Álbum" : "Adicionar Foto"}
          </Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
