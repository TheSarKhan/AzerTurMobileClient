import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useDiscovery } from "../../state/discovery";
import { colors } from "../../design/theme";
import ExploreSection from "./ExploreSection";
import { categoriesOf, categoryList, type CategoryId } from "./categories";

export type Category = "all" | CategoryId;

/** Round icon buttons that filter the journeys: All, then every category the website has. */
export default function CategoryBar({
  selected,
  onSelect,
}: {
  selected: Category;
  onSelect: (value: Category) => void;
}) {
  const { t, locale, tours } = useDiscovery();
  const lang = locale === "ru" ? 1 : locale === "az" ? 2 : 0;
  const items: {
    key: Category;
    icon: React.ComponentProps<typeof Ionicons>["name"];
    label: string;
    count: number;
  }[] = [
    {
      key: "all",
      icon: "grid-outline",
      label: t("All", "Все", "Hamısı"),
      count: tours.length,
    },
    ...categoryList.map((c) => ({
      key: c.id,
      icon: c.icon,
      label: c.label[lang],
      count: tours.filter((x) => categoriesOf(x).includes(c.id)).length,
    })),
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
            <Text
              numberOfLines={1}
              style={[styles.label, on && styles.labelOn]}
            >
              {item.label}
            </Text>
            <Text style={styles.count}>{item.count}</Text>
          </Pressable>
        );
      })}
    </ExploreSection>
  );
}

const styles = StyleSheet.create({
  item: { alignItems: "center", gap: 4, minWidth: 84, marginRight: 4 },
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
  count: { fontFamily: "Inter", fontSize: 11, color: colors.muted },
});
