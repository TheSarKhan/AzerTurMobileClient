import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type Tour } from "../../api/client";
import { useDiscovery } from "../../state/discovery";
import { colors } from "../../design/theme";
import { cityPoints } from "../journeys/route-geo";
import { regions } from "./regions";
import { places } from "../journeys/route";
import { photo } from "../explore/TourCard";
import { cityName, eventTitle, getEvents, type EventView } from "../events/api";
import { formatPrice, formatWhen } from "../events/format";
import { usePriceWords } from "../events/EventCard";
import { cluster, fan, mainPlace, mapBox, project, type Spot } from "./geo";

type Pin =
  | { kind: "journey"; id: string; x: number; y: number; tour: Tour }
  | { kind: "event"; id: string; x: number; y: number; event: EventView };
type Show = "all" | "journey" | "event";

const MARKER = 40;
// Room around the map so markers fanned out beside the coast are not cut off.
const EDGE = 34;
// Each step doubles the map. Spots closer than CLUSTER pixels merge into one numbered circle.
const ZOOMS = [1, 2, 4, 8, 16];
const CLUSTER = 44;
// Four pale tones; neighbouring regions never share one (see scripts/build-regions.py).
const TONES = ["#E4EBE3", "#EFE6D2", "#DCE8EA", "#EADFE6"];
const cities = Object.keys(cityPoints);

export default function MapBoard() {
  const { t, locale, tours, title, price, loading } = useDiscovery();
  const words = usePriceWords();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<EventView[]>([]);
  const [show, setShow] = useState<Show>("all");
  const [zoom, setZoom] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const across = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const down = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const focus = useRef<{ x: number; y: number } | null>(null);
  const lang = locale === "ru" ? 1 : locale === "az" ? 2 : 0;

  useEffect(() => {
    let live = true;
    getEvents(new URLSearchParams({ page: "0", size: "50" }))
      .then((data) => live && setEvents(data.items))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  // Every journey and event that has a known place, each one once.
  const pins = useMemo(() => {
    const out: Pin[] = [];
    for (const tour of tours) {
      const city = mainPlace(tour.region, cities);
      if (!city) continue;
      out.push({
        kind: "journey",
        id: "j:" + tour.slug,
        ...cityPoints[city],
        tour,
      });
    }
    for (const event of events) {
      const p = project(event.latitude, event.longitude);
      if (
        p.x < mapBox.x ||
        p.x > mapBox.x + mapBox.width ||
        p.y < mapBox.y ||
        p.y > mapBox.y + mapBox.height
      )
        continue;
      out.push({ kind: "event", id: "e:" + event.slug, ...p, event });
    }
    return out;
  }, [tours, events]);

  const journeys = pins.filter((p) => p.kind === "journey").length;
  const eventCount = pins.length - journeys;
  const shown = pins.filter((p) => show === "all" || p.kind === show);
  const byId = new Map(pins.map((p) => [p.id, p]));
  const selected = chosen ? (byId.get(chosen) ?? null) : null;
  const mapWidth = Math.max(width - EDGE * 2, 1) * ZOOMS[zoom];
  const mapHeight = (mapWidth * mapBox.height) / mapBox.width;
  const scale = mapWidth / mapBox.width;
  const px = (x: number) => (x - mapBox.x) * scale;
  const py = (y: number) => (y - mapBox.y) * scale;
  const last = zoom === ZOOMS.length - 1;
  const spots = shown.map<Spot>((p) => ({ id: p.id, x: p.x, y: p.y }));
  // Zoomed out, close items merge into a count; at the closest zoom they fan out instead.
  const items = last
    ? fan(spots).map((p) => ({
        x: p.x,
        y: p.y,
        dx: p.dx,
        dy: p.dy,
        ids: [p.id],
      }))
    : cluster(spots, scale, CLUSTER).map((c) => ({ ...c, dx: 0, dy: 0 }));

  // After a zoom caused by tapping a count, bring that spot to the middle of the screen.
  useEffect(() => {
    const at = focus.current;
    if (!at) return;
    focus.current = null;
    const x = EDGE + (at.x - mapBox.x) * scale - width / 2,
      y = EDGE + (at.y - mapBox.y) * scale - height / 2;
    across.current?.scrollTo({ x: Math.max(0, x), animated: false });
    down.current?.scrollTo({ y: Math.max(0, y), animated: false });
  }, [zoom, scale, width, height]);

  const chip = (value: Show, label: string, count: number) => (
    <Pressable
      key={value}
      accessibilityRole="button"
      accessibilityState={{ selected: show === value }}
      onPress={() => {
        setShow(value);
        setChosen(null);
      }}
      style={[styles.chip, show === value && styles.chipOn]}
    >
      <Text style={[styles.chipText, show === value && styles.chipTextOn]}>
        {label} {count}
      </Text>
    </Pressable>
  );

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 34) + 8 }]}>
      <View style={styles.head}>
        <Text accessibilityRole="header" style={styles.title}>
          {t("Map", "Карта", "Xəritə")}
        </Text>
        <View style={styles.chips}>
          {chip("all", t("All", "Все", "Hamısı"), pins.length)}
          {chip("journey", t("Journeys", "Туры", "Səfərlər"), journeys)}
          {chip("event", t("Events", "События", "Tədbirlər"), eventCount)}
        </View>
      </View>

      <View
        style={styles.stage}
        onLayout={(e) => {
          setWidth(e.nativeEvent.layout.width);
          setHeight(e.nativeEvent.layout.height);
        }}
      >
        <ScrollView
          ref={across}
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: EDGE }}
        >
          <ScrollView
            ref={down}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              paddingVertical: EDGE,
            }}
          >
            <Pressable
              accessible={false}
              onPress={() => setChosen(null)}
              style={{ width: mapWidth, height: mapHeight }}
            >
              <Svg
                width={mapWidth}
                height={mapHeight}
                viewBox={[mapBox.x, mapBox.y, mapBox.width, mapBox.height].join(
                  " ",
                )}
              >
                {regions.map((region) => (
                  <Path
                    key={region.id}
                    d={region.path}
                    fill={TONES[region.tone % TONES.length]}
                    stroke="#FFFFFF"
                    strokeWidth={1.5 / scale}
                    strokeLinejoin="round"
                    fillRule="evenodd"
                  />
                ))}
              </Svg>
              {zoom >= 1 &&
                regions.map((region) => (
                  <Text
                    key={region.id}
                    pointerEvents="none"
                    numberOfLines={1}
                    style={[
                      styles.regionName,
                      {
                        left: px(region.label.x) - 60,
                        top: py(region.label.y) - 8,
                      },
                    ]}
                  >
                    {region.name[lang]}
                  </Text>
                ))}
              {zoom >= 2 &&
                cities.map((city) => (
                  <View
                    key={city}
                    pointerEvents="none"
                    style={[
                      styles.place,
                      {
                        left: px(cityPoints[city].x) - 50,
                        top: py(cityPoints[city].y) - 3,
                      },
                    ]}
                  >
                    <View style={styles.dot} />
                    <Text style={styles.placeName}>
                      {places[city].name[lang]}
                    </Text>
                  </View>
                ))}
              {items.map((item) => {
                const left = px(item.x) + item.dx - MARKER / 2;
                const top = py(item.y) + item.dy - MARKER / 2;
                if (item.ids.length > 1) {
                  const members = item.ids.map((id) => byId.get(id)!);
                  const events = members.every((m) => m.kind === "event");
                  return (
                    <Pressable
                      key={item.ids.join("|")}
                      accessibilityRole="button"
                      accessibilityLabel={
                        item.ids.length +
                        " " +
                        t(
                          "places, zoom in",
                          "мест, приблизить",
                          "yer, yaxınlaşdır",
                        )
                      }
                      onPress={() => {
                        focus.current = { x: item.x, y: item.y };
                        setZoom((z) => Math.min(z + 1, ZOOMS.length - 1));
                      }}
                      style={[
                        styles.marker,
                        styles.count,
                        {
                          left: left - 3,
                          top: top - 3,
                          backgroundColor: events ? colors.accent : colors.ink,
                        },
                      ]}
                    >
                      <Text style={styles.countText}>{item.ids.length}</Text>
                    </Pressable>
                  );
                }
                const id = item.ids[0];
                const pin = byId.get(id)!;
                const on = chosen === id;
                const label =
                  pin.kind === "journey"
                    ? title(pin.tour)
                    : eventTitle(pin.event, locale);
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    accessibilityState={{ selected: on }}
                    onPress={() => setChosen(id)}
                    style={[
                      styles.marker,
                      {
                        left,
                        top,
                        borderColor:
                          pin.kind === "journey" ? colors.ink : colors.accent,
                        zIndex: on ? 10 : 1,
                        transform: [{ scale: on ? 1.2 : 1 }],
                      },
                    ]}
                  >
                    {pin.kind === "journey" ? (
                      <Image
                        source={photo(pin.tour.slug, pin.tour.image)}
                        style={styles.photo}
                      />
                    ) : pin.event.image ? (
                      <Image
                        source={{ uri: pin.event.image }}
                        style={styles.photo}
                      />
                    ) : (
                      <View style={[styles.photo, styles.blank]}>
                        <Feather
                          name="calendar"
                          size={20}
                          color={colors.accent}
                        />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </Pressable>
          </ScrollView>
        </ScrollView>

        <Text pointerEvents="none" style={styles.credit}>
          {t("Boundaries", "Границы", "Sərhədlər")}: geoBoundaries, CC BY-SA 3.0
        </Text>
        {loading && (
          <ActivityIndicator style={styles.busy} color={colors.ink} />
        )}

        <View style={styles.zoom}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("Zoom in", "Приблизить", "Yaxınlaşdır")}
            disabled={zoom === ZOOMS.length - 1}
            onPress={() => setZoom((z) => z + 1)}
            style={[styles.zoomButton, zoom === ZOOMS.length - 1 && styles.off]}
          >
            <Feather name="plus" size={20} color={colors.ink} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("Zoom out", "Отдалить", "Uzaqlaşdır")}
            disabled={zoom === 0}
            onPress={() => setZoom((z) => z - 1)}
            style={[styles.zoomButton, zoom === 0 && styles.off]}
          >
            <Feather name="minus" size={20} color={colors.ink} />
          </Pressable>
        </View>

        {!loading && !pins.length && (
          <Text style={styles.empty}>
            {t(
              "Nothing to show on the map yet.",
              "Пока нечего показать на карте.",
              "Xəritədə hələ göstəriləcək bir şey yoxdur.",
            )}
          </Text>
        )}

        {selected && (
          <View style={styles.card}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("Close", "Закрыть", "Bağla")}
              onPress={() => setChosen(null)}
              style={styles.close}
              hitSlop={8}
            >
              <Feather name="x" size={18} color={colors.ink} />
            </Pressable>
            {selected.kind === "journey" ? (
              <Detail
                image={photo(selected.tour.slug, selected.tour.image)}
                kind={t("Journey", "Тур", "Səfər")}
                name={title(selected.tour)}
                place={selected.tour.region}
                when={
                  selected.tour.days +
                  " " +
                  t(selected.tour.days === 1 ? "day" : "days", "дн.", "gün")
                }
                cost={
                  t("From", "От", "Başlayan") +
                  " " +
                  price(selected.tour.fromPriceEur) +
                  " / " +
                  t("person", "чел.", "nəfər")
                }
                action={t("Details", "Подробнее", "Ətraflı")}
                onOpen={() =>
                  router.push({
                    pathname: "/tour/[slug]",
                    params: { slug: selected.tour.slug },
                  })
                }
              />
            ) : (
              <Detail
                image={
                  selected.event.image ? { uri: selected.event.image } : null
                }
                kind={t("Event", "Событие", "Tədbir")}
                name={eventTitle(selected.event, locale)}
                place={
                  selected.event.venueName +
                  ", " +
                  cityName(selected.event, locale)
                }
                when={formatWhen(
                  selected.event.startsAt,
                  selected.event.endsAt,
                  selected.event.timeKnown,
                  locale,
                )}
                cost={formatPrice(
                  selected.event.free,
                  selected.event.priceFromMinor,
                  selected.event.currency,
                  words,
                )}
                action={t("Details", "Подробнее", "Ətraflı")}
                onOpen={() =>
                  router.push({
                    pathname: "/events/[slug]",
                    params: { slug: selected.event.slug },
                  })
                }
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function Detail({
  image,
  kind,
  name,
  place,
  when,
  cost,
  action,
  onOpen,
}: {
  image: number | { uri: string } | null;
  kind: string;
  name: string;
  place: string;
  when: string;
  cost: string;
  action: string;
  onOpen: () => void;
}) {
  return (
    <View style={styles.detail}>
      {image ? (
        <Image source={image} style={styles.cardPhoto} />
      ) : (
        <View style={[styles.cardPhoto, styles.blank]}>
          <Feather name="calendar" size={28} color={colors.accent} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.kind}>{kind}</Text>
        <Text numberOfLines={2} style={styles.name}>
          {name}
        </Text>
        <Text numberOfLines={1} style={styles.line}>
          {place}
        </Text>
        <Text numberOfLines={1} style={styles.line}>
          {when}
        </Text>
        <View style={styles.bottom}>
          <Text numberOfLines={2} style={styles.cost}>
            {cost}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onOpen}
            style={styles.open}
          >
            <Text style={styles.openText}>{action}</Text>
            <Feather name="arrow-right" size={15} color={colors.white} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  head: { paddingHorizontal: 20, gap: 12, paddingBottom: 10 },
  title: { fontFamily: "InterSemi", fontSize: 24, color: colors.ink },
  chips: { flexDirection: "row", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    minHeight: 38,
    justifyContent: "center",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontFamily: "Inter", fontSize: 13, color: colors.ink },
  chipTextOn: { color: colors.white },
  stage: { flex: 1, overflow: "hidden" },
  marker: {
    position: "absolute",
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    borderWidth: 3,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  regionName: {
    position: "absolute",
    width: 120,
    textAlign: "center",
    fontFamily: "InterSemi",
    fontSize: 11,
    color: "#7C8A82",
  },
  place: { position: "absolute", width: 100, alignItems: "center" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.muted },
  placeName: {
    marginTop: 2,
    fontFamily: "Inter",
    fontSize: 11,
    color: colors.muted,
  },
  count: {
    width: MARKER + 6,
    height: MARKER + 6,
    borderRadius: (MARKER + 6) / 2,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { fontFamily: "InterSemi", fontSize: 16, color: colors.white },
  photo: { width: "100%", height: "100%" },
  blank: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3E3DB",
  },
  busy: { position: "absolute", top: 16, alignSelf: "center" },
  empty: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    fontFamily: "Inter",
    fontSize: 14,
    color: colors.muted,
  },
  credit: {
    position: "absolute",
    left: 14,
    bottom: 6,
    fontFamily: "Inter",
    fontSize: 10,
    color: colors.muted,
  },
  zoom: { position: "absolute", right: 14, top: 12, gap: 8 },
  zoomButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  off: { opacity: 0.4 },
  card: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    padding: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    zIndex: 20,
  },
  close: {
    position: "absolute",
    right: 10,
    top: 10,
    zIndex: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paper,
  },
  detail: { flexDirection: "row", gap: 12 },
  cardPhoto: { width: 96, height: 120, borderRadius: 16 },
  info: { flex: 1, gap: 3, paddingRight: 24 },
  kind: { fontFamily: "InterSemi", fontSize: 12, color: colors.accent },
  name: {
    fontFamily: "InterSemi",
    fontSize: 16,
    lineHeight: 20,
    color: colors.ink,
  },
  line: { fontFamily: "Inter", fontSize: 12, color: colors.muted },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 4,
  },
  cost: { flex: 1, fontFamily: "InterSemi", fontSize: 13, color: colors.ink },
  open: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: colors.ink,
  },
  openText: { fontFamily: "InterSemi", fontSize: 13, color: colors.white },
});
