import React from "react";
import { Tabs } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { colors } from "../../design/theme";
import { useDiscovery } from "../../state/discovery";
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
        },
        tabBarLabelStyle: { fontFamily: "Inter", fontSize: 11 },
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
      ).map((tab) => (
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
      ))}
    </Tabs>
  );
}
