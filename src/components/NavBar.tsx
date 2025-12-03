import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native"; // ✅
import { useNotifications } from "../context/NotificationsContext"; // ✅

type NavbarProps = {
  title?: string;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
};

export default function Navbar({
  title = "napse",
  rightIcon,
  onRightPress,
}: NavbarProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>(); // ✅
  const { unreadCount } = useNotifications(); // ✅

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* LADO ESQUERDO (SINO DE NOTIFICAÇÕES) */}
      <View style={styles.side}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("Notifications")}
          activeOpacity={0.75}
        >
          <Ionicons name="notifications-outline" size={20} color="#fff" />

          {/* ✅ BADGE */}
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* LOGO CENTRAL */}
      <Text style={styles.logo}>{title}</Text>

      {/* LADO DIREITO (ÍCONE DINÂMICO - LOGOUT ETC) */}
      <View style={styles.side}>
        {rightIcon ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onRightPress}
            activeOpacity={0.75}
          >
            <Ionicons name={rightIcon} size={20} color="#fff" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

/* ========================= STYLES ========================= */

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 18,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: "#111",
    backgroundColor: "#000",
  },

  side: {
    width: 42, // ✅ mantém centralização perfeita
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 1,
  },

  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },

  badge: {
    position: "absolute",
    right: -4,
    top: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ff3b30",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
});
