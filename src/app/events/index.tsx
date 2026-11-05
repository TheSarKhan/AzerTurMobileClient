import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { Button, Page, s } from "../../design/ui";
import { colors } from "../../design/theme";
import { useDiscovery } from "../../state/discovery";
import EventCard from "../../features/events/EventCard";
import {
  CATEGORIES,
  categoryLabels,
  cityName,
  getCities,
  getEvents,
  type City,
  type EventView,
} from "../../features/events/api";
import { round2 } from "../../features/events/format";
type Filters = {
  city: string;
  category: string;
  query: string;
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
const RADII = [10, 25, 50, 100];
const CITY_KEY = "azertur.events.city.v1";
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
      style={{
        paddingHorizontal: 14,
        minHeight: 40,
        justifyContent: "center",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: on ? colors.ink : colors.line,
        backgroundColor: on ? colors.ink : colors.white,
      }}
    >
      <Text style={[s.muted, { color: on ? colors.white : colors.ink }]}>
        {label}
      </Text>
    </Pressable>
  );
}
export default function Events() {
  const { t, locale } = useDiscovery();
  const categories = categoryLabels(t);
  const [cities, setCities] = useState<City[]>([]),
    [filters, setFilters] = useState<Filters>({
      city: "",
      category: "",
      query: "",
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
    [locating, setLocating] = useState(false),
    [locationNote, setLocationNote] = useState("");
  const { city, category, near, radius, page } = filters;
  const change = (patch: Partial<Filters>) =>
    setFilters((f) => ({ ...f, page: 0, ...patch }));
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", String(PAGE));
  if (near) {
    params.set("lat", String(near.lat));
    params.set("lng", String(near.lng));
    params.set("radiusKm", String(radius));
  } else if (city) params.set("city", city);
  if (category) params.set("category", category);
  if (filters.query) params.set("q", filters.query);
  const base = params.toString().replace(/page=\d+&/, "");
  const key = params.toString() + "#" + filters.attempt;
  const loading = result.key !== key;
  useEffect(() => {
    getCities()
      .then(setCities)
      .catch(() => {});
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
  const pickCity = useCallback((slug: string) => {
    setLocationNote("");
    change({ near: null, city: slug });
    AsyncStorage.setItem(CITY_KEY, slug).catch(() => {});
  }, []);
  // Location is requested only when the person taps "Near me", never on open.
  async function findMe() {
    setLocating(true);
    setLocationNote("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setLocationNote(
          t(
            "Location is off. Pick a city instead.",
            "Геолокация выключена. Выберите город.",
            "Məkan icazəsi yoxdur. Şəhər seçin.",
          ),
        );
        return;
      }
      const here = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
      change({
        near: {
          lat: round2(here.coords.latitude),
          lng: round2(here.coords.longitude),
        },
      });
    } catch {
      setLocationNote(
        t(
          "We could not find your location. Pick a city instead.",
          "Не удалось определить местоположение. Выберите город.",
          "Məkanı tapa bilmədik. Şəhər seçin.",
        ),
      );
    } finally {
      setLocating(false);
    }
  }
  return (
    <Page back title={t("Events", "События", "Tədbirlər")}>
      <Text style={s.title}>
        {t("What's on nearby.", "Что проходит рядом.", "Yaxında nə var.")}
      </Text>
      <TextInput
        accessibilityLabel={t("Search events", "Поиск событий", "Tədbir axtar")}
        value={text}
        onChangeText={setText}
        placeholder={t("Search events", "Поиск событий", "Tədbir axtar")}
        placeholderTextColor={colors.muted}
        style={s.field}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[s.row, { gap: 8 }]}>
          <Chip
            label={t("All cities", "Все города", "Bütün şəhərlər")}
            on={!near && city === ""}
            onPress={() => pickCity("")}
          />
          {cities.map((c) => (
            <Chip
              key={c.slug}
              label={cityName(
                {
                  cityNameEn: c.nameEn,
                  cityNameRu: c.nameRu,
                  cityNameAz: c.nameAz,
                },
                locale,
              )}
              on={!near && city === c.slug}
              onPress={() => pickCity(c.slug)}
            />
          ))}
        </View>
      </ScrollView>
      <View style={{ gap: 10 }}>
        <Button outline disabled={locating} onPress={findMe}>
          {locating
            ? t("Finding you…", "Определяем…", "Axtarılır…")
            : near
              ? t("Near me ✓", "Рядом со мной ✓", "Yaxınlıqda ✓")
              : t("Near me", "Рядом со мной", "Yaxınlıqda")}
        </Button>
        {near && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[s.row, { gap: 8 }]}>
              {RADII.map((r) => (
                <Chip
                  key={r}
                  label={r + " km"}
                  on={radius === r}
                  onPress={() => change({ radius: r })}
                />
              ))}
            </View>
          </ScrollView>
        )}
        {locationNote !== "" && (
          <Text accessibilityRole="alert" style={s.muted}>
            {locationNote}
          </Text>
        )}
        <Text style={s.muted}>
          {t(
            "Your location is used only for this search. It is rounded to about 1 km and is not stored.",
            "Местоположение используется только для этого поиска, округляется до ~1 км и не сохраняется.",
            "Məkan yalnız bu axtarış üçündür, təxminən 1 km dəqiqliklə yuvarlaqlaşdırılır və saxlanmır.",
          )}
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[s.row, { gap: 8 }]}>
          <Chip
            label={t("All", "Все", "Hamısı")}
            on={category === ""}
            onPress={() => change({ category: "" })}
          />
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={categories[c]}
              on={category === c}
              onPress={() => change({ category: c })}
            />
          ))}
        </View>
      </ScrollView>
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
        <Text style={s.body}>
          {near
            ? t(
                "No events within this distance yet. Try a larger radius or pick a city.",
                "В этом радиусе пока нет событий. Увеличьте радиус или выберите город.",
                "Bu məsafədə hələ tədbir yoxdur. Radiusu artırın və ya şəhər seçin.",
              )
            : t(
                "No events match yet. Try another city or category.",
                "Пока нет подходящих событий. Выберите другой город или категорию.",
                "Hələ uyğun tədbir yoxdur. Başqa şəhər və ya kateqoriya seçin.",
              )}
        </Text>
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
  );
}
