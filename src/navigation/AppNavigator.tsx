// src/navigation/AppNavigator.tsx
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TabNavigator from "./TabNavigator";
import Album from "../screens/Album";
import Friends from "../screens/Friends";
import FriendsSearch from "../screens/FriendsSearch";
import Notifications from "../screens/Notifications";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* ✅ Container principal das tabs */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />

      {/* ✅ Telas push fora das tabs */}
      <Stack.Screen name="Album" component={Album} />
      <Stack.Screen name="Friends" component={Friends} />
      <Stack.Screen name="FriendsSearch" component={FriendsSearch} />
      <Stack.Screen name="Notifications" component={Notifications} />
    </Stack.Navigator>
  );
}
