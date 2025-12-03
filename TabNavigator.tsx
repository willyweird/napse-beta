// src/navigation/TabNavigator.tsx
import "react-native-gesture-handler";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  View,
  Image,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Home from "../screens/Home";
import Create from "../screens/Create";
import Profile from "../screens/Profile";
import Album from "../screens/Album";

import { useAuth } from "../context/AuthContext";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/* =========================
   TABS (APP LOGADO)
========================= */

function AppTabs() {
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#777",
      }}
    >
      {/* ================= HOME ================= */}
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />

      {/* ================= CREATE ================= */}
      <Tab.Screen
        name="Criar"
        component={Create}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "add" : "add-outline"}
              size={30}
              color={focused ? "#fff" : color}
            />
          ),
        }}
      />

      {/* ================= PROFILE ================= */}
      <Tab.Screen
        name="Perfil"
        component={Profile}
        options={{
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.avatarWrapper,
                focused && styles.avatarFocused,
              ]}
            >
              <Image
                source={{
                  uri:
                    user?.avatar_url ||
                    (user?.username
                      ? `https://ui-avatars.com/api/?name=${user.username}`
                      : "https://ui-avatars.com/api/?name=User"),
                }}
                style={styles.avatar}
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/* =========================
   STACK DO APP
========================= */

export default function TabNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* ✅ Container que embala as tabs */}
      <Stack.Screen name="MainTabs" component={AppTabs} />

      {/* 🔹 Telas fora das tabs */}
      <Stack.Screen name="Album" component={Album} />
    </Stack.Navigator>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#000",
    borderTopWidth: 0.5,
    borderTopColor: "#111",
    height: Platform.OS === "ios" ? 82 : 64,
    paddingBottom: Platform.OS === "ios" ? 18 : 8,
  },

  tabItem: {
    paddingVertical: 6,
  },

  avatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 0,
    borderColor: "#fff",
  },

  avatarFocused: {
    borderWidth: 2,
  },

  avatar: {
    width: "100%",
    height: "100%",
  },
});
