import React from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { Tabs } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { colors } from "../../design/theme";
import { useDiscovery } from "../../state/discovery";
import AzIcon from "../../features/map/AzIcon";
export default function Layout() {
  const { t } = useDiscovery();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.line,
          // In a browser the default bar is too short for an icon over its label, which cut the label.
          ...(Platform.OS === "web"
            ? { height: 84, paddingTop: 8, paddingBottom: 14 }
            : {}),
        },
        tabBarLabelStyle: { fontFamily: "Inter", fontSize: 11, lineHeight: 15 },
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      {(
        [
          {
            name: "index",
            title: t("Explore", "Обзор", "Kəşf et"),
            icon: "compass",
          },
          {
            name: "trips",
            title: t("My trips", "Поездки", "Səfərlərim"),
            icon: "briefcase",
          },
          {
            name: "map",
            title: t("Map", "Карта", "Xəritə"),
            icon: "map",
          },
          {
            name: "saved",
            title: t("Saved", "Сохранено", "Seçilmişlər"),
            icon: "bookmark",
          },
          {
            name: "account",
            title: t("Account", "Аккаунт", "Hesab"),
            icon: "user",
          },
        ] as const
      ).map((tab) =>
        tab.name === "map" ? (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarButton: (props) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={tab.title}
                  accessibilityState={props.accessibilityState}
                  onPress={props.onPress}
                  style={{ flex: 1, alignItems: "center" }}
                >
                  <View
                    style={{
                      marginTop: -22,
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      borderWidth: 4,
                      borderColor: colors.paper,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.ink,
                    }}
                  >
                    <AzIcon size={30} color={colors.white} />
                  </View>
                  <Text
                    style={{
                      marginTop: 2,
                      fontFamily: "Inter",
                      fontSize: 11,
                      lineHeight: 15,
                      color: props.accessibilityState?.selected
                        ? colors.ink
                        : colors.muted,
                    }}
                  >
                    {tab.title}
                  </Text>
                </Pressable>
              ),
            }}
          />
        ) : (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ focused, size }) => (
                <Feather
                  name={tab.icon}
                  color={focused ? colors.ink : colors.muted}
                  size={size}
                />
              ),
            }}
          />
        ),
      )}
    </Tabs>
  );
}
