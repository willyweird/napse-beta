import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNotifications } from "../context/NotificationsContext";
import Navbar from "../components/NavBar";

export default function Notifications() {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    loading,
  } = useNotifications();

  return (
    <View style={styles.container}>
      <Navbar
        title="Notificações"
        rightIcon="checkmark-done-outline"
        onRightPress={markAllAsRead}
      />

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 18 }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Nenhuma notificação ainda
          </Text>
        }
        renderItem={({ item }) => {
          const isUnread = !item.read;

          return (
            <TouchableOpacity
              style={[
                styles.row,
                isUnread && styles.unreadRow,
              ]}
              onPress={() => markAsRead(item.id)}
              activeOpacity={0.7}
            >
              <Image
                source={{
                  uri:
                    item.from_user?.avatar_url ||
                    `https://ui-avatars.com/api/?name=${item.from_user?.username || "Napse"}`,
                }}
                style={styles.avatar}
              />

              <View style={styles.textBox}>
                <Text style={styles.username}>
                  @{item.from_user?.username || "NapSe"}
                </Text>

                <Text style={styles.message}>
                  {item.message}
                </Text>

                <Text style={styles.date}>
                  {new Date(item.created_at).toLocaleString()}
                </Text>
              </View>

              {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
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

  empty: {
    color: "#777",
    textAlign: "center",
    marginTop: 60,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#0f0f0f",
  },

  unreadRow: {
    backgroundColor: "#141414",
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },

  textBox: {
    flex: 1,
  },

  username: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },

  message: {
    color: "#ccc",
    fontSize: 13,
    marginTop: 2,
  },

  date: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
  },

  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ff3b30",
  },
});
