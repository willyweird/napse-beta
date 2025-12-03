import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { useEffect } from "react";

import AuthNavigator from "./src/navigation/AuthNavigator";
import AppNavigator from "./src/navigation/AppNavigator";

import { AlbumsProvider } from "./src/context/AlbumsContext";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { FriendsProvider } from "./src/context/FriendsContext";
import { NotificationsProvider } from "./src/context/NotificationsContext";

// =====================================
// ✅ CONTEÚDO PRINCIPAL BLINDADO
// =====================================
function AppContent() {
  const { loading, user, signOut } = useAuth();

  // ✅ ESCUTA SESSÃO MORTA GLOBAL (do api.ts)
  useEffect(() => {
    const handler = async () => {
      console.log("🚨 App.tsx: Sessão expirada recebida");
      await signOut();
    };

    globalThis.addEventListener?.("session-expired", handler);

    return () => {
      globalThis.removeEventListener?.("session-expired", handler);
    };
  }, []);

  if (loading) return null;

  if (!user) return <AuthNavigator />;

  return (
    <AlbumsProvider>
      <FriendsProvider>
        <NotificationsProvider>
          <AppNavigator />
        </NotificationsProvider>
      </FriendsProvider>
    </AlbumsProvider>
  );
}

// =====================================
// ✅ ROOT FINAL
// =====================================
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer>
            <AppContent />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
