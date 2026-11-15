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
import {
  categoryLabels,
  getCities,
  getEvents,
  getFacets,
  type City,
  type EventView,
  type Facets,
} from "../events/api";
import { quickRange, type Quick } from "../events/ranges";
import ExploreSection from "./ExploreSection";
import EventTile, { EVENT_WIDTH } from "./EventTile";

function Chip({
  label,
  on,
  onPress,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[styles.chip, on && styles.chipOn]}
    >
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

/**
 * Upcoming events as their own block on Explore, with quick filters: when (today, this weekend,
 * this week), the type of event and the city. Hidden while there is nothing at all to show.
 */
export default function EventsBlock() {
  const { t, locale } = useDiscovery();
  const [items, setItems] = useState<EventView[]>([]);
  const [total, setTotal] = useState(0);
  const [when, setWhen] = useState<Quick>("any");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [everything, setEverything] = useState<number | null>(null);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [whenTotals, setWhenTotals] = useState<Record<Quick, number> | null>(
    null,
  );
  const filtered = when !== "any" || !!category || !!city;

  useEffect(() => {
    let live = true;
    getCities()
      .then((list) => live && setCities(list))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    let live = true;
    const query = new URLSearchParams({ page: "0", size: "8" });
    const range = quickRange(when);
    if (range) {
      query.set("from", range.from);
      query.set("to", range.to);
    }
    if (category) query.set("category", category);
    if (city) query.set("city", city);
    getEvents(query)
      .then((data) => {
        if (!live) return;
        setItems(data.items);
        setTotal(data.total);
        setLoading(false);
        if (!filtered) setEverything(data.total);
      })
      .catch(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [when, category, city, filtered]);

  // Which chips are worth showing: only those that lead to at least one event. The type and city
  // counts follow the date picked, and the date counts follow the type and city picked.
  useEffect(() => {
    let live = true;
    const query = (kind: Quick, withCategory: boolean, withCity: boolean) => {
      const q = new URLSearchParams();
      const range = quickRange(kind);
      if (range) {
        q.set("from", range.from);
        q.set("to", range.to);
      }
      if (withCategory && category) q.set("category", category);
      if (withCity && city) q.set("city", city);
      return q;
    };
    const kinds: Quick[] = ["any", "today", "weekend", "week"];
    Promise.all(kinds.map((k) => getFacets(query(k, true, true))))
      .then((all) => {
        if (!live) return;
        setWhenTotals({
          any: all[0].total,
          today: all[1].total,
          weekend: all[2].total,
          week: all[3].total,
        });
      })
      .catch(() => live && setWhenTotals(null));
    getFacets(query(when, true, true))
      .then((f) => live && setFacets(f))
      .catch(() => live && setFacets(null));
    return () => {
      live = false;
    };
  }, [when, category, city]);

  // No events at all (and no filter that could be the reason): the block stays away.
  if (!filtered && !loading && !items.length && !everything) return null;
  if (!filtered && loading && !items.length) return null;
  const labels = categoryLabels(t);
  const places = (slug: string) => {
    const c = cities.find((x) => x.slug === slug);
    if (!c) return slug;
    return locale === "ru" ? c.nameRu : locale === "az" ? c.nameAz : c.nameEn;
  };
  // Only options that have events stay; one that is picked stays so it can be switched off.
  const keep = (counts: Record<string, number> | undefined, picked: string) =>
    Object.entries(counts ?? {})
      .filter(([k, n]) => n > 0 || k === picked)
      .sort((a, b) => b[1] - a[1]);
  const categoryOptions = keep(facets?.categories, category).filter(
    ([k]) => k in labels,
  );
  const cityOptions = keep(facets?.cities, city);
  const whenOptions = (
    [
      ["any", t("Any date", "Любая дата", "İstənilən tarix")],
      ["today", t("Today", "Сегодня", "Bu gün")],
      ["weekend", t("This weekend", "На выходных", "Bu həftəsonu")],
      ["week", t("This week", "На этой неделе", "Bu həftə")],
    ] as [Quick, string][]
  ).filter(([k]) => k === "any" || k === when || (whenTotals?.[k] ?? 0) > 0);
  const reset = () => {
    setWhen("any");
    setCategory("");
    setCity("");
  };
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
          {whenOptions.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {whenOptions.map(([key, label]) => (
                <Chip
                  key={key}
                  label={label}
                  on={when === key}
                  onPress={() => setWhen(key)}
                />
              ))}
            </ScrollView>
          )}
          {categoryOptions.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              <Chip
                label={t("All types", "Все типы", "Bütün növlər")}
                on={!category}
                onPress={() => setCategory("")}
              />
              {categoryOptions.map(([key, count]) => (
                <Chip
                  key={key}
                  label={labels[key] + " " + count}
                  on={category === key}
                  onPress={() => setCategory(category === key ? "" : key)}
                />
              ))}
            </ScrollView>
          )}
          {cityOptions.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              <Chip
                label={t("All cities", "Все города", "Bütün şəhərlər")}
                on={!city}
                onPress={() => setCity("")}
              />
              {cityOptions.map(([slug, count]) => (
                <Chip
                  key={slug}
                  label={places(slug) + " " + count}
                  on={city === slug}
                  onPress={() => setCity(city === slug ? "" : slug)}
                />
              ))}
            </ScrollView>
          )}
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
          <Pressable accessibilityRole="button" onPress={reset} hitSlop={8}>
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
  filters: { gap: 8 },
  chips: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    minHeight: 34,
    justifyContent: "center",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontFamily: "Inter", fontSize: 13, color: colors.ink },
  chipTextOn: { color: colors.white },
  empty: { minHeight: 90, justifyContent: "center", gap: 8, paddingRight: 16 },
  emptyText: { fontFamily: "Inter", fontSize: 14, color: colors.muted },
});
