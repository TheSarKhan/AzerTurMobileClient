import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button, Page, s } from "../../design/ui";
import { colors } from "../../design/theme";
import { useDiscovery } from "../../state/discovery";
import EventCard from "../../features/events/EventCard";
import { getEvents, type EventView } from "../../features/events/api";
import EventFilterSheet from "../../features/events/EventFilterSheet";
import ActiveFilters, {
  FilterButton,
} from "../../features/events/ActiveFilters";
import {
  activeCount,
  eventQuery,
  noFilters,
  type EventFilters,
} from "../../features/events/filters";
import { useCities } from "../../features/events/useCities";
import { useLocate } from "../../features/events/useLocate";
import type { Quick } from "../../features/events/ranges";
type Filters = {
  city: string;
  category: string;
  query: string;
  when: Quick;
  near: { lat: number; lng: number } | null;
  radius: number;
  page: number;
  attempt: number;
};
type Result = {
  key: string;
  base: string;
  items: EventView[];
  total: number;
  failed: boolean;
};
const PAGE = 12;
const CITY_KEY = "azertur.events.city.v1";
export default function Events() {
  const { t } = useDiscovery();
  const cities = useCities();
  const here = useLocate();
  const [filters, setFilters] = useState<Filters>({
      city: "",
      category: "",
      query: "",
      when: "any",
      near: null,
      radius: 25,
      page: 0,
      attempt: 0,
    }),
    [text, setText] = useState(""),
    [result, setResult] = useState<Result>({
      key: "",
      base: "",
      items: [],
      total: 0,
      failed: false,
    }),
    [sheet, setSheet] = useState(false);
  const { city, category, near, radius, page } = filters;
  const change = (patch: Partial<Filters>) =>
    setFilters((f) => ({ ...f, page: 0, ...patch }));
  const applied: EventFilters = {
    when: filters.when,
    city,
    category,
    near,
    radius,
  };
  const params = eventQuery(applied, page, PAGE, filters.query);
  const base = params.toString().replace(/page=\d+&/, "");
  const key = params.toString() + "#" + filters.attempt;
  const loading = result.key !== key;
  useEffect(() => {
    AsyncStorage.getItem(CITY_KEY)
      .then((saved) => saved && change({ city: saved }))
      .catch(() => {});
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => change({ query: text.trim() }), 350);
    return () => clearTimeout(timer);
  }, [text]);
  useEffect(() => {
    let live = true;
    getEvents(new URLSearchParams(key.split("#")[0]))
      .then((data) => {
        if (!live) return;
        setResult((old) => ({
          key,
          base,
          items:
            page > 0 && old.base === base
              ? [...old.items, ...data.items]
              : data.items,
          total: data.total,
          failed: false,
        }));
      })
      .catch(() => {
        if (live) setResult((old) => ({ ...old, key, base, failed: true }));
      });
    return () => {
      live = false;
    };
  }, [key, base, page]);
  const items = result.base === base ? result.items : [];
  const total = result.total;
  const failed = !loading && result.failed;
  const activeFilters = activeCount(applied);
  const changeFilters = (patch: Partial<EventFilters>) => {
    here.clearNote();
    change(patch);
    if (patch.city !== undefined)
      (patch.city
        ? AsyncStorage.setItem(CITY_KEY, patch.city)
        : AsyncStorage.removeItem(CITY_KEY)
      ).catch(() => {});
  };
  const clearAll = () => changeFilters({ ...noFilters, radius });
  return (
    <View style={{ flex: 1 }}>
      <Page>
        <Text accessibilityRole="header" style={s.title}>
          {t("Events", "События", "Tədbirlər")}
        </Text>
        <View style={styles.bar}>
          <View style={styles.search}>
            <Ionicons name="search-outline" size={20} color={colors.muted} />
            <TextInput
              accessibilityLabel={t(
                "Search events",
                "Поиск событий",
                "Tədbir axtar",
              )}
              value={text}
              onChangeText={setText}
              placeholder={t("Search events", "Поиск событий", "Tədbir axtar")}
              placeholderTextColor={colors.muted}
              returnKeyType="search"
              style={[styles.input, { outlineWidth: 0 } as object]}
            />
            {text !== "" && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(
                  "Clear search",
                  "Очистить поиск",
                  "Axtarışı təmizlə",
                )}
                onPress={() => setText("")}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={20} color={colors.muted} />
              </Pressable>
            )}
          </View>
          <FilterButton count={activeFilters} onPress={() => setSheet(true)} />
        </View>
        <ActiveFilters
          filters={applied}
          cities={cities}
          onChange={changeFilters}
          onClear={clearAll}
        />
        {!loading && !failed && (
          <Text style={s.muted}>
            {total} {t(total === 1 ? "event" : "events", "событий", "tədbir")}
          </Text>
        )}
        {failed && (
          <View style={{ gap: 10 }}>
            <Text accessibilityRole="alert" style={s.body}>
              {t(
                "Events could not be loaded. Check your connection and try again.",
                "Не удалось загрузить события. Проверьте соединение и повторите.",
                "Tədbirləri yükləmək olmadı. Bağlantını yoxlayıb yenidən cəhd edin.",
              )}
            </Text>
            <Button
              outline
              onPress={() =>
                setFilters((f) => ({ ...f, attempt: f.attempt + 1 }))
              }
            >
              {t("Try again", "Повторить", "Yenidən cəhd et")}
            </Button>
          </View>
        )}
        {items.map((e) => (
          <EventCard key={e.slug} event={e} />
        ))}
        {loading && <ActivityIndicator color={colors.ink} />}
        {!loading && !failed && items.length === 0 && (
          <View style={{ gap: 10 }}>
            <Text style={s.body}>
              {near
                ? t(
                    "No events within this distance yet. Try a larger radius or pick a city.",
                    "В этом радиусе пока нет событий. Увеличьте радиус или выберите город.",
                    "Bu məsafədə hələ tədbir yoxdur. Radiusu artırın və ya şəhər seçin.",
                  )
                : t(
                    "No events match yet. Try other filters.",
                    "Пока нет подходящих событий. Измените фильтры.",
                    "Hələ uyğun tədbir yoxdur. Başqa filtrlər sına.",
                  )}
            </Text>
            {activeFilters > 0 && (
              <Button outline onPress={clearAll}>
                {t("Clear filters", "Сбросить фильтры", "Filtrləri təmizlə")}
              </Button>
            )}
          </View>
        )}
        {!loading && items.length < total && (
          <Button
            outline
            onPress={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
          >
            {t("Show more", "Показать ещё", "Daha çox göstər")}
          </Button>
        )}
      </Page>
      <EventFilterSheet
        open={sheet}
        onClose={() => setSheet(false)}
        value={applied}
        query={filters.query}
        cities={cities}
        locate={here.locate}
        locating={here.locating}
        note={here.note}
        onApply={(next) => {
          here.clearNote();
          change({
            when: next.when,
            city: next.near ? "" : next.city,
            category: next.category,
            near: next.near,
            radius: next.radius,
          });
          if (!next.near)
            (next.city
              ? AsyncStorage.setItem(CITY_KEY, next.city)
              : AsyncStorage.removeItem(CITY_KEY)
            ).catch(() => {});
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", gap: 10 },
  search: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    fontFamily: "Inter",
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 10,
  },
  activeText: { fontFamily: "InterSemi", fontSize: 13, color: colors.ink },
  clearAll: { fontFamily: "InterSemi", fontSize: 13, color: colors.accent },
});
