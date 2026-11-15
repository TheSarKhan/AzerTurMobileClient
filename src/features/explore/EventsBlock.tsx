import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useDiscovery } from "../../state/discovery";
import { colors } from "../../design/theme";
import { getEvents, type City, type EventView } from "../events/api";
import { activeCount, eventQuery, type EventFilters } from "../events/filters";
import type { Quick } from "../events/ranges";
import { useEventFacets } from "../events/useEventFacets";
import ActiveFilters, { FilterButton } from "../events/ActiveFilters";
import ExploreSection from "./ExploreSection";
import EventTile, { EVENT_WIDTH } from "./EventTile";

/**
 * Upcoming events as their own block on Explore. Three quick date chips and one filter button (the
 * rest opens in a sheet that Explore shows); filters that are on appear as removable chips.
 * Hidden while there is nothing at all to show.
 */
export default function EventsBlock({
  filters,
  cities,
  onChange,
  onClear,
  onOpenFilters,
}: {
  filters: EventFilters;
  cities: City[];
  onChange: (patch: Partial<EventFilters>) => void;
  onClear: () => void;
  onOpenFilters: () => void;
}) {
  const { t } = useDiscovery();
  const [items, setItems] = useState<EventView[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [everything, setEverything] = useState<number | null>(null);
  const count = activeCount(filters);
  const { whenTotals } = useEventFacets(
    filters.when,
    filters.category,
    filters.near ? "" : filters.city,
  );

  useEffect(() => {
    let live = true;
    getEvents(eventQuery(filters, 0, 8))
      .then((data) => {
        if (!live) return;
        setItems(data.items);
        setTotal(data.total);
        setLoading(false);
        if (count === 0) setEverything(data.total);
      })
      .catch(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [filters, count]);

  // No events at all (and no filter that could be the reason): the block stays away.
  if (count === 0 && !loading && !items.length && !everything) return null;
  if (count === 0 && loading && !items.length) return null;
  const quick = (
    [
      ["today", t("Today", "Сегодня", "Bu gün")],
      ["weekend", t("This weekend", "На выходных", "Bu həftəsonu")],
      ["week", t("This week", "На этой неделе", "Bu həftə")],
    ] as [Quick, string][]
  ).filter(([k]) => k === filters.when || !whenTotals || whenTotals[k] > 0);
  return (
    <ExploreSection
      title={t("Events", "События", "Tədbirlər")}
      icon={<Ionicons name="calendar-outline" size={18} color={colors.ink} />}
      note={String(total)}
      snap={EVENT_WIDTH + 12}
      action={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(
            "See all events",
            "Все события",
            "Bütün tədbirlər",
          )}
          onPress={() => router.push("/events")}
          hitSlop={8}
        >
          <Text style={styles.all}>{t("See all", "Все", "Hamısı")}</Text>
        </Pressable>
      }
      filters={
        <View style={styles.filters}>
          <View style={styles.bar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
              style={{ flex: 1 }}
            >
              {quick.map(([key, label]) => (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: filters.when === key }}
                  onPress={() =>
                    onChange({ when: filters.when === key ? "any" : key })
                  }
                  style={[styles.chip, filters.when === key && styles.chipOn]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      filters.when === key && styles.chipTextOn,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={{ paddingRight: 16 }}>
              <FilterButton size={44} count={count} onPress={onOpenFilters} />
            </View>
          </View>
          <ActiveFilters
            filters={filters}
            cities={cities}
            onChange={onChange}
            onClear={onClear}
            skip={["when"]}
            inset={16}
          />
        </View>
      }
    >
      {loading && <ActivityIndicator color={colors.ink} />}
      {!loading && !items.length && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {t(
              "No events match these filters.",
              "Нет событий по этим фильтрам.",
              "Bu süzgəclərə uyğun tədbir yoxdur.",
            )}
          </Text>
          <Pressable accessibilityRole="button" onPress={onClear} hitSlop={8}>
            <Text style={styles.all}>
              {t("Clear filters", "Сбросить фильтры", "Süzgəcləri təmizlə")}
            </Text>
          </Pressable>
        </View>
      )}
      {items.map((event) => (
        <EventTile key={event.slug} event={event} />
      ))}
    </ExploreSection>
  );
}

const styles = StyleSheet.create({
  all: { fontFamily: "InterSemi", fontSize: 13, color: colors.accent },
  filters: { gap: 10 },
  bar: { flexDirection: "row", alignItems: "center" },
  chips: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    minHeight: 36,
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontFamily: "Inter", fontSize: 13, color: colors.ink },
  chipTextOn: { color: colors.white, fontFamily: "InterSemi" },
  empty: { minHeight: 90, justifyContent: "center", gap: 8, paddingRight: 16 },
  emptyText: { fontFamily: "Inter", fontSize: 14, color: colors.muted },
});
