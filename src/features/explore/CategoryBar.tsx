import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useDiscovery } from "../../state/discovery";
import { colors } from "../../design/theme";
import ExploreSection from "./ExploreSection";

export type Category = "all" | "nature" | "culture" | "city";

/** Round icon buttons that filter the journeys. */
export default function CategoryBar({
  selected,
  onSelect,
}: {
  selected: Category;
  onSelect: (value: Category) => void;
}) {
  const { t } = useDiscovery();
  const items: {
    key: Category;
    icon: React.ComponentProps<typeof Ionicons>["name"];
    label: string;
  }[] = [
    { key: "all", icon: "grid-outline", label: t("All", "Все", "Hamısı") },
    {
      key: "nature",
      icon: "leaf-outline",
      label: t("Nature", "Природа", "Təbiət"),
    },
    {
      key: "culture",
      icon: "library-outline",
      label: t("Culture", "Культура", "Mədəniyyət"),
    },
    {
      key: "city",
      icon: "business-outline",
      label: t("City", "Город", "Şəhər"),
    },
  ];
  return (
    <ExploreSection title={t("Categories", "Категории", "Kateqoriyalar")}>
      {items.map((item) => {
        const on = selected === item.key;
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={item.label}
            onPress={() => onSelect(item.key)}
            style={styles.item}
          >
            <View style={[styles.circle, on && styles.circleOn]}>
              <Ionicons
                name={item.icon}
                size={26}
                color={on ? colors.white : colors.ink}
              />
            </View>
            <Text style={[styles.label, on && styles.labelOn]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ExploreSection>
  );
}

const styles = StyleSheet.create({
  item: { alignItems: "center", gap: 8, minWidth: 68, marginRight: 6 },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  circleOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  label: { fontFamily: "Inter", fontSize: 13, color: colors.muted },
  labelOn: { fontFamily: "InterSemi", color: colors.ink },
});
