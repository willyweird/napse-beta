import { supabase } from "../lib/supabase";
import * as FileSystem from "expo-file-system/legacy";
import { Buffer } from "buffer";

export async function uploadImageAsync(uri?: string): Promise<string> {
  try {
    if (!uri) {
      throw new Error("URI da imagem está undefined");
    }

    // ✅ Garante extensão com fallback
    const uriParts = uri.split(".");
    const fileExt = uriParts.length > 1 ? uriParts.pop() : "jpg";

    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const buffer = Buffer.from(base64, "base64");
    const fileData = new Uint8Array(buffer);

    const { error } = await supabase.storage
      .from("photos")
      .upload(filePath, fileData, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (error) {
      console.log("❌ ERRO SUPABASE UPLOAD:", error);
      throw error;
    }

    const { data } = supabase.storage
      .from("photos")
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error("Falha ao gerar URL pública da imagem");
    }

    return data.publicUrl;
  } catch (err) {
    console.log("❌ ERRO uploadImageAsync:", err);
    throw err;
  }
}
