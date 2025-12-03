import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

export type Album = {
  id: string;
  title: string;
  cover_url?: string | null;
  owner_id?: string;
  created_at?: string;
};

type AlbumsContextType = {
  albums: Album[];
  loading: boolean;
  loadAlbums: () => Promise<void>;
  addAlbum: (album: Album) => void;
  setAlbums: (albums: Album[]) => void;
};

const AlbumsContext = createContext<AlbumsContextType | null>(null);

export function AlbumsProvider({ children }: { children: ReactNode }) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const abortRef = useRef<AbortController | null>(null);

  const { user, signOut } = useAuth(); // ✅ CONTROLA SESSÃO

  // =========================
  // ✅ LOAD ALBUMS BLINDADO
  // =========================
  async function loadAlbums() {
    if (!user) return;

    try {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);

      const res = await api.get<Album[]>("/albums/", {
        signal: abortRef.current.signal,
      });

      setAlbums(res.data || []);
    } catch (err: any) {
      if (err.name === "CanceledError") return;

      if (err?.response?.status === 401) {
        console.log("🚨 Sessão morta ao carregar álbuns");
        signOut();
        return;
      }

      console.log("❌ Erro ao carregar álbuns:", err);
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // ✅ ADD ALBUM SAFE
  // =========================
  function addAlbum(album: Album) {
    if (!user) return;
    setAlbums((prev) => [album, ...prev]);
  }

  // =========================
  // ✅ SESSION WATCHDOG
  // =========================
  useEffect(() => {
    if (user) {
      console.log("📦 AlbumsContext: Carregando álbuns");
      loadAlbums();
    } else {
      console.log("🧹 AlbumsContext: Limpando álbuns (logout)");
      abortRef.current?.abort();
      setAlbums([]);
    }
  }, [user]);

  return (
    <AlbumsContext.Provider
      value={{
        albums,
        loading,
        loadAlbums,
        addAlbum,
        setAlbums,
      }}
    >
      {children}
    </AlbumsContext.Provider>
  );
}

export function useAlbums() {
  const context = useContext(AlbumsContext);
  if (!context) {
    throw new Error("useAlbums must be used inside AlbumsProvider");
  }
  return context;
}
