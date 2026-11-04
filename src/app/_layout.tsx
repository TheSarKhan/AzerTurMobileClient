import React from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import Feather from "@expo/vector-icons/Feather";
import { ActivityIndicator, View, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AccountProvider } from "../state/account";
import { DiscoveryProvider } from "../state/discovery";
import { colors } from "../design/theme";
export default function Root() {
  const [ready, error] = useFonts({
    Inter: require("../../assets/fonts/inter-400.ttf"),
    InterSemi: require("../../assets/fonts/inter-600.ttf"),
    ...Feather.font,
  });
  if (!ready && !error)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.paper,
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  if (error)
    return (
      <View style={{ padding: 30 }}>
        <Text>Could not load the application fonts. Please restart.</Text>
      </View>
    );
  return (
    <DiscoveryProvider>
      <AccountProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.paper },
          }}
        />
      </AccountProvider>
    </DiscoveryProvider>
  );
}
