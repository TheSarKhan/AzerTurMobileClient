import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useDiscovery } from "../../state/discovery";
import { colors } from "../../design/theme";
import { categoryLabels, cityName, type City } from "./api";
import { activeCount, type EventFilters } from "./filters";

/**
 * The filters that are on, as chips that each remove themselves, plus "Clear all". `skip` leaves
 * out filters that are already visible elsewhere (Explore shows the date as quick chips).
 */
export default function ActiveFilters({
  filters,
  cities,
  onChange,
  onClear,
  skip = [],
  inset = 0,
}: {
  filters: EventFilters;
  cities: City[];
  onChange: (patch: Partial<EventFilters>) => void;
  onClear: () => void;
  skip?: ("when" | "city" | "category" | "near")[];
  /** Side padding, for use inside a card. */
  inset?: number;
}) {
  const { t, locale } = useDiscovery();
  const labels = categoryLabels(t);
  const when = {
    any: "",
    today: t("Today", "Сегодня", "Bu gün"),
    weekend: t("This weekend", "На выходных", "Bu həftəsonu"),
    week: t("This week", "На этой неделе", "Bu həftə"),
  }[filters.when];
  const city = cities.find((c) => c.slug === filters.city);
  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (filters.when !== "any" && !skip.includes("when"))
    chips.push({
      key: "when",
      label: when,
      clear: () => onChange({ when: "any" }),
    });
  if (filters.near && !skip.includes("near"))
    chips.push({
      key: "near",
      label:
        t("Near me", "Рядом со мной", "Yaxınlıqda") +
        " " +
        filters.radius +
        " km",
      clear: () => onChange({ near: null }),
    });
  else if (city && !skip.includes("city"))
    chips.push({
      key: "city",
      label: cityName(
        {
          cityNameEn: city.nameEn,
          cityNameRu: city.nameRu,
          cityNameAz: city.nameAz,
        },
        locale,
      ),
      clear: () => onChange({ city: "" }),
    });
  if (filters.category && !skip.includes("category"))
    chips.push({
      key: "category",
      label: labels[filters.category] ?? filters.category,
      clear: () => onChange({ category: "" }),
    });
  if (!chips.length || activeCount(filters) === 0) return null;
  return <RemovableChips chips={chips} onClear={onClear} inset={inset} />;
}

/** Chips that each remove themselves, with "Clear all" after them. */
export function RemovableChips({
  chips,
  onClear,
  inset = 0,
}: {
  chips: { key: string; label: string; clear: () => void }[];
  onClear: () => void;
  inset?: number;
}) {
  const { t } = useDiscovery();
  if (!chips.length) return null;
  return (
    <View style={[styles.row, { paddingHorizontal: inset }]}>
      {chips.map((c) => (
        <Pressable
          key={c.key}
          accessibilityRole="button"
          accessibilityLabel={c.label + ", " + t("remove", "убрать", "sil")}
          onPress={c.clear}
          style={styles.chip}
        >
          <Text style={styles.text}>{c.label}</Text>
          <Ionicons name="close" size={16} color={colors.ink} />
        </Pressable>
      ))}
      <Pressable accessibilityRole="button" onPress={onClear} hitSlop={8}>
        <Text style={styles.clear}>
          {t("Clear all", "Сбросить всё", "Hamısını təmizlə")}
        </Text>
      </Pressable>
    </View>
  );
}

/** The round filter button with the number of filters that are on. */
export function FilterButton({
  count,
  onPress,
  size = 50,
}: {
  count: number;
  onPress: () => void;
  size?: number;
}) {
  const { t } = useDiscovery();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        t("Filters", "Фильтры", "Filtrlər") + (count ? ", " + count : "")
      }
      onPress={onPress}
      style={[
        styles.button,
        { width: size, height: size, borderRadius: size / 2 },
        count > 0 && styles.buttonOn,
      ]}
    >
      <Ionicons
        name="options-outline"
        size={22}
        color={count ? colors.white : colors.ink}
      />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 14,
    paddingRight: 10,
    minHeight: 36,
    borderRadius: 18,
    backgroundColor: "#E6EEE8",
  },
  text: { fontFamily: "InterSemi", fontSize: 13, color: colors.ink },
  clear: { fontFamily: "InterSemi", fontSize: 13, color: colors.accent },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  buttonOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.paper,
  },
  badgeText: { fontFamily: "InterSemi", fontSize: 11, color: colors.white },
});
