import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import * as Location from "expo-location";
import Svg, { Line, Path } from "react-native-svg";
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
import {
  cluster,
  radialSlots,
  mainPlace,
  mapBox,
  mapPointAt,
  project,
  scrollFor,
  streetCamera,
  streetTiles,
  zoomToFit,
  type Cluster,
  type Spot,
} from "./geo";

import { StreetBasemap } from "./StreetBasemap";

type Pin =
  | { kind: "journey"; id: string; x: number; y: number; tour: Tour }
  | { kind: "event"; id: string; x: number; y: number; event: EventView }
  | { kind: "place"; id: string; x: number; y: number; city: string };
type Show = "all" | Pin["kind"];
const pinTheme = {
  journey: { color: "#226456", icon: "compass" },
  event: { color: "#A8412E", icon: "calendar" },
  place: { color: "#375DA7", icon: "map-pin" },
} as const;
const FAN_PAGE = 8;

const MARKER = 40;
// Room around the map so markers fanned out beside the coast are not cut off.
const EDGE = 34;
// Each step doubles the map. Spots closer than CLUSTER pixels merge into one numbered circle.
// Steps for the buttons and for jumping to a group; pinching and the wheel zoom in between.
const ZOOMS = [1, 2, 4, 8, 16, 24, 48, 96, 192, 384, 768];
const MIN_ZOOM = ZOOMS[0];
const MAX_ZOOM = ZOOMS[ZOOMS.length - 1];
const LOCATION_ZOOM = 48;
const STREET_ZOOM = 8;
const BAKU_CENTER = project(40.3755, 49.8357);
const TILE_TEMPLATE = process.env.EXPO_PUBLIC_MAP_TILE_URL
  || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const CLUSTER = 55;
// Events loaded onto the map: 10 pages of 50.
const MAX_PAGES = 10;
// In a browser, tell it the map handles pinching itself; two-finger pans still scroll.
const WEB_TOUCH = (
  Platform.OS === "web"
    ? { touchAction: "pan-x pan-y", cursor: "grab", userSelect: "none" }
    : {}
) as object;
// Marks cards and buttons laid over the map: pressing and dragging on them must not pan it.
const NO_DRAG = (
  Platform.OS === "web" ? { dataSet: { nodrag: "1" } } : {}
) as object;
// Four pale tones; neighbouring regions never share one (see scripts/build-regions.py).
const TONES = ["#E4EBE3", "#EFE6D2", "#DCE8EA", "#EADFE6"];
const cities = Object.keys(cityPoints);
// Time for drag handling; kept out of the component so rendering stays pure.
const clock = () => Date.now();

function insideMap(point: { x: number; y: number }) {
  return point.x >= mapBox.x && point.x <= mapBox.x + mapBox.width
    && point.y >= mapBox.y && point.y <= mapBox.y + mapBox.height;
}

export default function MapBoard() {
  const { t, locale, tours, title, price, loading } = useDiscovery();
  const words = usePriceWords();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<EventView[]>([]);
  const [eventsUnavailable, setEventsUnavailable] = useState(false);
  const [show, setShow] = useState<Show>("all");
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const zoomRef = useRef(MIN_ZOOM);
  const [chosen, setChosen] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<{ group: Cluster; page: number } | null>(null);
  const [location, setLocation] = useState<{ x: number; y: number } | null>(null);
  const [locationMessage, setLocationMessage] = useState(false);
  const [locating, setLocating] = useState(false);
  const initialCenter = useRef(false);
  const interacted = useRef(false);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [vectorReady, setVectorReady] = useState(false);
  const [creditChoice, setCreditChoice] = useState<boolean | null>(null);
  const [creditIntro, setCreditIntro] = useState(true);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: MIN_ZOOM });
  const across = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const down = useRef<React.ComponentRef<typeof ScrollView>>(null);
  // After a zoom: which map point to put at which spot of the screen.
  const focus = useRef<{
    point: { x: number; y: number };
    screen: { x: number; y: number };
  } | null>(null);
  const stage = useRef<React.ComponentRef<typeof View>>(null);
  const pinch = useRef<{ d0: number; z0: number } | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const wanted = useRef<{
    zoom: number;
    screen: { x: number; y: number };
  } | null>(null);
  // Where the map was scrolled to. Leaving for a detail page hides this screen and its scroll
  // position is lost; it is put back when the screen is laid out again.
  const offset = useRef({ x: 0, y: 0 });
  const hidden = useRef(false);
  const restore = () => {
    setTimeout(() => {
      across.current?.scrollTo({ x: offset.current.x, animated: false });
      down.current?.scrollTo({ y: offset.current.y, animated: false });
    }, 80);
  };
  const lang = locale === "ru" ? 1 : locale === "az" ? 2 : 0;

  useEffect(() => {
    let live = true;
    // The API hands out 50 at a time; the map wants all of them (up to a sane limit).
    (async () => {
      const all: EventView[] = [];
      for (let page = 0; page < MAX_PAGES; page++) {
        const data = await getEvents(
          new URLSearchParams({ page: String(page), size: "50" }),
        );
        all.push(...data.items);
        if (!live) return;
        setEvents([...all]);
        if (all.length >= data.total || !data.items.length) break;
      }
    })().catch(() => {
      if (live) setEventsUnavailable(true);
    });
    return () => {
      live = false;
    };
  }, []);

  // Every journey and event that has a known place, each one once.
  const pins = useMemo(() => {
    const out: Pin[] = cities.map((city) => ({
      kind: "place",
      id: "p:" + city,
      ...cityPoints[city],
      city,
    }));
    for (const tour of tours) {
      const city = mainPlace(tour.region, cities);
      const point =
        typeof tour.latitude === "number" && typeof tour.longitude === "number"
          ? project(tour.latitude, tour.longitude)
          : city ? cityPoints[city] : null;
      if (!point || !insideMap(point)) continue;
      out.push({ kind: "journey", id: "j:" + tour.slug, ...point, tour });
    }
    for (const event of events) {
      const p = project(event.latitude, event.longitude);
      if (!insideMap(p)) continue;
      out.push({ kind: "event", id: "e:" + event.slug, ...p, event });
    }
    return out;
  }, [tours, events]);

  const shown = pins.filter((pin) => show === "all" || pin.kind === show);
  const byId = new Map(pins.map((pin) => [pin.id, pin]));
  const selected = chosen ? byId.get(chosen) : undefined;
  const base = Math.max(width - EDGE * 2, 1);
  const mapWidth = base * zoom;
  const mapHeight = (mapWidth * mapBox.height) / mapBox.width;
  const scale = mapWidth / mapBox.width;
  const px = (x: number) => (x - mapBox.x) * scale;
  const py = (y: number) => (y - mapBox.y) * scale;
  const spots = shown.map<Spot>(({ id, x, y }) => ({ id, x, y }));
  const items = cluster(spots, scale, CLUSTER);
  const showStreets = zoom >= STREET_ZOOM && width > 0 && height > 0;
  const fanIds = expanded?.group.ids.slice(expanded.page * FAN_PAGE, (expanded.page + 1) * FAN_PAGE) ?? [];
  const fanSlots = radialSlots(fanIds.length);
  const pinLabel = (pin: Pin) =>
    pin.kind === "journey" ? title(pin.tour)
      : pin.kind === "event" ? eventTitle(pin.event, locale)
      : places[pin.city].name[lang];

  // Empty space round a map that is smaller than the viewport (it is centred then).
  const padFor = (z: number) => ({
    x: Math.max(0, (width - (base * z + EDGE * 2)) / 2),
    y: Math.max(
      0,
      (height - ((base * z * mapBox.height) / mapBox.width + EDGE * 2)) / 2,
    ),
  });
  const useVector = showStreets && Platform.OS === "web" && !process.env.EXPO_PUBLIC_MAP_TILE_URL;
  const vectorActive = useVector && vectorReady;
  const creditsOpen = creditChoice ?? creditIntro;
  useEffect(() => {
    if (!vectorActive) return;
    const timer = setTimeout(() => setCreditIntro(false), 5000);
    return () => clearTimeout(timer);
  }, [vectorActive]);
  const vectorView = streetCamera(
    mapPointAt(camera, { x: width / 2, y: height / 2 }, padFor(camera.zoom),
      base * camera.zoom / mapBox.width, EDGE),
    base * camera.zoom / mapBox.width,
  );
  const tiles = showStreets && (!useVector || !vectorReady) && camera.zoom === zoom ? streetTiles(
    mapPointAt(camera, { x: 0, y: 0 }, padFor(zoom), scale, EDGE),
    mapPointAt(camera, { x: width, y: height }, padFor(zoom), scale, EDGE),
    scale,
  ) : [];
  const reach = useRef({ x: 0, y: 0 });
  const moveTo = (x: number, y: number) => {
    const to = {
      x: Math.min(reach.current.x, Math.max(0, x)),
      y: Math.min(reach.current.y, Math.max(0, y)),
    };
    offset.current = to;
    if (showStreets) setCamera({ ...to, zoom });
    across.current?.scrollTo({ x: to.x, animated: false });
    down.current?.scrollTo({ y: to.y, animated: false });
    return to;
  };
  // Zooms to `next`, keeping `screen` (the viewport centre by default) over the same map point,
  // or putting `point` there when given.
  const zoomTo = (
    next: number,
    screen = { x: width / 2, y: height / 2 },
    point?: { x: number; y: number },
  ) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    if (Math.abs(clamped - zoomRef.current) < 0.001) {
      if (point) {
        const to = scrollFor(point, screen, padFor(clamped), scale, EDGE);
        moveTo(to.x, to.y);
      }
      return;
    }
    interacted.current = true;
    setExpanded(null);
    const old = zoomRef.current;
    focus.current = {
      point:
        point ??
        mapPointAt(
          offset.current,
          screen,
          padFor(old),
          (base * old) / mapBox.width,
          EDGE,
        ),
      screen,
    };
    zoomRef.current = clamped;
    setZoom(clamped);
  };
  const zoomToRef = useRef(zoomTo);
  // Gestures fire faster than the map can redraw, so only the latest wish is applied per frame.
  const ask = (next: number, screen: { x: number; y: number }) => {
    const waiting = wanted.current !== null;
    wanted.current = { zoom: next, screen };
    if (waiting) return;
    requestAnimationFrame(() => {
      const w = wanted.current;
      wanted.current = null;
      if (w) zoomToRef.current(w.zoom, w.screen);
    });
  };
  const askRef = useRef(ask);
  // The gesture listeners outlive a render, so they call the latest versions through refs.
  useEffect(() => {
    zoomRef.current = zoom;
    zoomToRef.current = zoomTo;
    askRef.current = ask;
  });

  async function locate(showError = true) {
    setLocating(true);
    setLocationMessage(false);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") throw new Error("Location unavailable");
      const here = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const point = project(here.coords.latitude, here.coords.longitude);
      if (!insideMap(point)) throw new Error("Location outside the map");
      setLocation(point);
      return point;
    } catch {
      setLocationMessage(showError);
      return null;
    } finally {
      setLocating(false);
    }
  }

  useEffect(() => {
    if (!width || !height || initialCenter.current) return;
    initialCenter.current = true;
    void locate(false).then((point) => {
      if (!interacted.current)
        zoomToRef.current(LOCATION_ZOOM, undefined, point ?? BAKU_CENTER);
    });
  }, [width, height]);

  // Dragging moves the map in any direction at once and carries on a little after release. The
  // scroll views have their own scrolling switched off, because nested ones can only move one
  // way at a time.
  const pan = useRef<{
    x: number;
    y: number;
    px: number;
    py: number;
    lx: number;
    ly: number;
    vx: number;
    vy: number;
    at: number;
    moved: boolean;
  } | null>(null);
  const slide = useRef(0);
  const dragged = useRef(0);
  useEffect(() => {
    reach.current = {
      x: Math.max(0, base * zoom + EDGE * 2 - width),
      y: Math.max(
        0,
        (base * zoom * mapBox.height) / mapBox.width + EDGE * 2 - height,
      ),
    };
  });
  // A tap right after a drag is the end of the drag, not a press.
  const tappable = () => clock() - dragged.current > 150;
  const panBegin = (x: number, y: number) => {
    cancelAnimationFrame(slide.current);
    const o = offset.current;
    pan.current = {
      x,
      y,
      px: o.x,
      py: o.y,
      lx: o.x,
      ly: o.y,
      vx: 0,
      vy: 0,
      at: clock(),
      moved: false,
    };
  };
  const panMove = (x: number, y: number) => {
    const p = pan.current;
    if (!p) return;
    const dx = x - p.x,
      dy = y - p.y;
    if (!p.moved && Math.hypot(dx, dy) < 6) return;
    p.moved = true;
    interacted.current = true;
    dragged.current = clock();
    const to = moveTo(p.px - dx, p.py - dy);
    const now = clock(),
      dt = Math.max(1, now - p.at);
    p.vx = 0.7 * p.vx + (0.3 * (to.x - p.lx)) / dt;
    p.vy = 0.7 * p.vy + (0.3 * (to.y - p.ly)) / dt;
    p.lx = to.x;
    p.ly = to.y;
    p.at = now;
  };
  const panEnd = (fling: boolean) => {
    const p = pan.current;
    pan.current = null;
    if (!p || !p.moved) return;
    dragged.current = clock();
    let { vx, vy } = p;
    if (!fling || clock() - p.at > 80 || Math.hypot(vx, vy) < 0.15) return;
    let before = performance.now();
    const step = (now: number) => {
      const dt = now - before;
      before = now;
      const slow = Math.pow(0.95, dt / 16);
      vx *= slow;
      vy *= slow;
      const from = offset.current;
      const to = moveTo(from.x + vx * dt, from.y + vy * dt);
      if (Math.hypot(vx, vy) > 0.03 && (to.x !== from.x || to.y !== from.y)) {
        slide.current = requestAnimationFrame(step);
      }
    };
    slide.current = requestAnimationFrame(step);
  };
  const panBy = (dx: number, dy: number) => {
    cancelAnimationFrame(slide.current);
    moveTo(offset.current.x + dx, offset.current.y + dy);
  };
  const panRef = useRef<{
    panBegin: (x: number, y: number) => void;
    panMove: (x: number, y: number) => void;
    panEnd: (fling: boolean) => void;
    panBy: (dx: number, dy: number) => void;
  } | null>(null);
  useEffect(() => {
    panRef.current = { panBegin, panMove, panEnd, panBy };
  });

  // After a zoom, scroll so the chosen map point sits where it was asked to.
  useEffect(() => {
    const at = focus.current;
    if (!at) return;
    focus.current = null;
    const to = scrollFor(at.point, at.screen, padFor(zoom), scale, EDGE);
    const frame = requestAnimationFrame(() => moveTo(to.x, to.y));
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, scale, width, height]);

  // A pinch on a trackpad reaches the browser as a wheel with ctrl held (Safari sends gesture
  // events); without this the whole page zooms instead of the map.
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const node = stage.current as unknown as HTMLElement | null;
    if (!node) return;
    const spot = (e: { clientX: number; clientY: number }) => {
      const r = node.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest("[data-nodrag]")) return;
      if (!e.ctrlKey) {
        e.preventDefault();
        panRef.current?.panBy(e.deltaX, e.deltaY);
        return;
      }
      e.preventDefault();
      askRef.current(zoomRef.current * Math.exp(-e.deltaY * 0.012), spot(e));
    };
    let start = 1;
    const onStart = (e: Event) => {
      e.preventDefault();
      start = zoomRef.current;
    };
    const onChange = (e: Event) => {
      e.preventDefault();
      const g = e as unknown as {
        scale: number;
        clientX: number;
        clientY: number;
      };
      askRef.current(start * g.scale, spot(g));
    };
    // Press and drag with the mouse to move the map (fingers are handled by the touch events).
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      if ((e.target as HTMLElement).closest("[data-nodrag]")) return;
      node.style.cursor = "grabbing";
      panRef.current?.panBegin(e.clientX, e.clientY);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse")
        panRef.current?.panMove(e.clientX, e.clientY);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      node.style.cursor = "grab";
      panRef.current?.panEnd(true);
    };
    const onClick = (e: MouseEvent) => {
      // The release of a drag must not also count as a tap on whatever is underneath.
      if (clock() - dragged.current > 120) return;
      e.stopPropagation();
      e.preventDefault();
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    node.addEventListener("gesturestart", onStart);
    node.addEventListener("gesturechange", onChange);
    node.addEventListener("pointerdown", onDown);
    node.addEventListener("click", onClick, true);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      node.removeEventListener("wheel", onWheel);
      node.removeEventListener("gesturestart", onStart);
      node.removeEventListener("gesturechange", onChange);
      node.removeEventListener("pointerdown", onDown);
      node.removeEventListener("click", onClick, true);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  // One finger moves the map; two fingers zoom it by how far apart they are.
  const touchStage = (e: {
    nativeEvent: { touches: ArrayLike<{ pageX: number; pageY: number }> };
  }) => {
    const t = e.nativeEvent.touches;
    if (t.length === 0) {
      pinch.current = null;
      panEnd(true);
      return;
    }
    if (t.length === 1) {
      pinch.current = null;
      if (!pan.current) panBegin(t[0].pageX, t[0].pageY);
      else panMove(t[0].pageX, t[0].pageY);
      return;
    }
    if (t.length !== 2) return;
    if (pan.current) panEnd(false);
    const d = Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY) || 1;
    if (!pinch.current) {
      pinch.current = { d0: d, z0: zoomRef.current };
      stage.current?.measureInWindow((x, y) => {
        origin.current = { x, y };
      });
      return;
    }
    ask((pinch.current.z0 * d) / pinch.current.d0, {
      x: (t[0].pageX + t[1].pageX) / 2 - origin.current.x,
      y: (t[0].pageY + t[1].pageY) / 2 - origin.current.y,
    });
  };

  const chip = (value: Show, label: string) => {
    const active = show === value;
    const theme = value === "all" ? { icon: "layers", color: colors.ink } as const : pinTheme[value];
    return (
      <Pressable
        key={value}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={() => {
          setExpanded(null);
          setShow(value);
          setChosen(null);
        }}
        style={[styles.chip, active && styles.chipOn]}
      >
        <Feather name={theme.icon} size={13} color={active ? colors.white : theme.color} />
        <Text numberOfLines={1} style={[styles.chipText, active && styles.chipTextOn]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, 34) + 8 }]}>
      <View style={styles.head}>
        <View style={styles.heading}>
          <View style={styles.headingIcon}>
            <Feather name="map" size={18} color={colors.ink} />
          </View>
          <Text accessibilityRole="header" style={styles.title}>
            {t("Explore the map", "Карта мест", "Xəritəni kəşf et")}
          </Text>
        </View>
        <View style={styles.chips}>
          {chip("all", t("All", "Все", "Hamısı"))}
          {chip("journey", t("Tours", "Туры", "Turlar"))}
          {chip("event", t("Events", "События", "Tədbirlər"))}
          {chip("place", t("Places", "Места", "Məkanlar"))}
        </View>
      </View>

      <View
        ref={stage}
        style={[styles.stage, WEB_TOUCH]}
        onTouchStart={touchStage}
        onTouchMove={touchStage}
        onTouchEnd={touchStage}
        onTouchCancel={touchStage}
        onLayout={(e) => {
          const { width: w, height: h } = e.nativeEvent.layout;
          if (w === 0 || h === 0) hidden.current = true;
          else if (hidden.current) {
            hidden.current = false;
            restore();
          }
          setWidth(w);
          setHeight(h);
        }}
      >
        {useVector && camera.zoom >= STREET_ZOOM && (
          <StreetBasemap {...vectorView} onReady={setVectorReady} />
        )}
        <ScrollView
          ref={across}
          horizontal
          scrollEnabled={false}
          scrollEventThrottle={32}
          onScroll={(e) => {
            if (!hidden.current)
              offset.current.x = e.nativeEvent.contentOffset.x;
          }}
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: EDGE }}
        >
          <ScrollView
            ref={down}
            scrollEnabled={false}
            scrollEventThrottle={32}
            onScroll={(e) => {
              if (!hidden.current)
                offset.current.y = e.nativeEvent.contentOffset.y;
            }}
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
              onPress={() => {
                if (!tappable()) return;
                setChosen(null);
                setExpanded(null);
              }}
              style={{ width: mapWidth, height: mapHeight }}
            >
              {showStreets ? (
                <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                  {tiles.map(({ x, y, zoom: level, start, end }) => (
                    <Image
                      key={`${level}/${x}/${y}`}
                      accessibilityIgnoresInvertColors
                      accessible={false}
                      fadeDuration={0}
                      resizeMode="stretch"
                      source={{
                        uri: TILE_TEMPLATE.replace("{z}", String(level)).replace("{x}", String(x)).replace("{y}", String(y)),
                        ...(Platform.OS !== "web" && {
                          headers: { "User-Agent": "AzTripMap/1.0 (+https://aztrip.online)" },
                        }),
                      }}
                      style={{
                        position: "absolute",
                        left: px(start.x),
                        top: py(start.y),
                        width: px(end.x) - px(start.x) + 0.6,
                        height: py(end.y) - py(start.y) + 0.6,
                      }}
                    />
                  ))}
                  {(!useVector || !vectorReady) && <View style={styles.streetTint} />}
                </View>
              ) : (
                <>
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
                  {zoom >= 2 &&
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
                  {zoom >= 4 &&
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
                </>
              )}
              {location && (
                <View
                  pointerEvents="none"
                  accessibilityLabel={t("Your location", "Ваше местоположение", "Sizin məkanınız")}
                  style={[styles.you, { left: px(location.x) - 9, top: py(location.y) - 9 }]}
                />
              )}
              {items.map((item) => {
                const left = px(item.x) - MARKER / 2;
                const top = py(item.y) - MARKER / 2;
                const members = item.ids.map((id) => byId.get(id)!);
                if (members.length === 1) {
                  const pin = members[0];
                  return (
                    <Marker
                      key={pin.id}
                      pin={pin}
                      label={pinLabel(pin)}
                      left={left}
                      top={top}
                      selected={chosen === pin.id}
                      onPress={() => {
                        if (tappable()) setChosen(pin.id);
                      }}
                    />
                  );
                }
                const feature = members.find((pin) => pin.kind === "event" && pin.event.image)
                  ?? members.find((pin) => pin.kind !== "place")
                  ?? members[0];
                const theme = pinTheme[feature.kind];
                return (
                  <Pressable
                    key={item.ids.join("|")}
                    accessibilityRole="button"
                    accessibilityLabel={item.ids.length + " " + t("places here", "мест здесь", "yer burada")}
                    onPress={() => {
                      if (!tappable()) return;
                      setChosen(null);
                      const from = ZOOMS.findLastIndex((level) => level <= zoom + 0.01);
                      const to = ZOOMS[zoomToFit(members, from, ZOOMS, base, { width, height }, CLUSTER)];
                      zoomTo(to, undefined, item);
                      if (to <= zoom + 0.01) setExpanded({ group: item, page: 0 });
                    }}
                    style={[styles.cluster, { left: left - 6, top: top - 6 }]}
                  >
                    <View style={[styles.clusterPhoto, { backgroundColor: theme.color }]}>
                      <PinPhoto pin={feature} />
                      {feature.kind === "place" && <Feather name={theme.icon} size={18} color={colors.white} />}
                    </View>
                    <View style={[styles.clusterBadge, { backgroundColor: theme.color }]}>
                      <Feather name={theme.icon} size={10} color={colors.white} />
                      <Text style={styles.clusterCount}>{item.ids.length}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </Pressable>
          </ScrollView>
        </ScrollView>

        {vectorActive ? (
          <View style={styles.mapSources} {...NO_DRAG}>
            {creditsOpen && (
              <View style={styles.sourceLinks}>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => void Linking.openURL("https://www.openmaptiles.org/")}
                >
                  <Text style={styles.creditText}>© OpenMapTiles</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => void Linking.openURL("https://www.openstreetmap.org/copyright")}
                >
                  <Text style={styles.creditText}>© OpenStreetMap</Text>
                </Pressable>
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: creditsOpen }}
              accessibilityLabel={t("Map sources", "Источники карты", "Xəritə mənbələri")}
              onPress={() => setCreditChoice(!creditsOpen)}
              style={styles.sourceToggle}
            >
              <Feather name={creditsOpen ? "x" : "info"} size={15} color={colors.ink} />
            </Pressable>
          </View>
        ) : showStreets ? (
          <Pressable
            {...NO_DRAG}
            accessibilityRole="link"
            onPress={() => void Linking.openURL("https://www.openstreetmap.org/copyright")}
            style={styles.streetCredit}
          >
            <Text style={styles.creditText}>© OpenStreetMap</Text>
          </Pressable>
        ) : (
          <Text pointerEvents="none" style={styles.credit}>
            geoBoundaries, CC BY-SA 3.0
          </Text>
        )}
        {loading && (
          <ActivityIndicator style={styles.busy} color={colors.ink} />
        )}

        <View style={styles.zoom} {...NO_DRAG}>
          <View style={styles.zoomStack}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("Zoom in", "Приблизить", "Yaxınlaşdır")}
              disabled={zoom >= MAX_ZOOM - 0.05}
              onPress={() =>
                zoomTo(ZOOMS.find((z) => z > zoom * 1.02) ?? MAX_ZOOM)
              }
              style={[styles.zoomStep, zoom >= MAX_ZOOM - 0.05 && styles.off]}
            >
              <Feather name="plus" size={20} color={colors.ink} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("Zoom out", "Отдалить", "Uzaqlaşdır")}
              disabled={zoom <= MIN_ZOOM + 0.01}
              onPress={() =>
                zoomTo(
                  [...ZOOMS].reverse().find((z) => z < zoom / 1.02) ?? MIN_ZOOM,
                )
              }
              style={[styles.zoomStep, zoom <= MIN_ZOOM + 0.01 && styles.off]}
            >
              <Feather name="minus" size={20} color={colors.ink} />
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("My location", "Моё местоположение", "Mənim məkanım")}
            disabled={locating}
            onPress={async () => {
              const point = await locate();
              if (point) zoomTo(Math.max(zoomRef.current, LOCATION_ZOOM), undefined, point);
            }}
            style={[styles.zoomButton, styles.recenter]}
          >
            {locating ? <ActivityIndicator color={colors.white} /> : <Feather name="crosshair" size={20} color={colors.white} />}
          </Pressable>
        </View>

        {eventsUnavailable && (
          <Text accessibilityRole="alert" style={styles.eventWarning}>
            {t("Some events could not load.", "Не все события загрузились.", "Bəzi tədbirləri yükləmək olmadı.")}
          </Text>
        )}
        {locationMessage && (
          <Text style={styles.empty}>
            {t(
              "Location unavailable. Explore the map or try again.",
              "Местоположение недоступно. Изучите карту или повторите попытку.",
              "Məkan əlçatan deyil. Xəritəyə baxın və ya yenidən cəhd edin.",
            )}
          </Text>
        )}

        {expanded && (
          <View style={StyleSheet.absoluteFill} {...NO_DRAG}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("Close group", "Закрыть группу", "Qrupu bağla")}
              style={styles.fanBackdrop}
              onPress={() => { setExpanded(null); setChosen(null); }}
            />
            <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
              <Svg pointerEvents="none" width={width} height={height}>
                {fanSlots.map(({ x, y }, index) => (
                  <Line key={index} x1={width / 2} y1={height / 2}
                    x2={width / 2 + x} y2={height / 2 + y}
                    stroke={colors.muted} strokeWidth={1.5} />
                ))}
              </Svg>
              {fanIds.map((id, index) => {
                const pin = byId.get(id);
                if (!pin) return null;
                const spot = fanSlots[index];
                return (
                  <Marker key={id} pin={pin} label={pinLabel(pin)}
                    left={width / 2 + spot.x - MARKER / 2}
                    top={height / 2 + spot.y - MARKER / 2}
                    selected={chosen === id}
                    onPress={() => setChosen(id)}
                  />
                );
              })}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("Close group", "Закрыть группу", "Qrupu bağla")}
                onPress={() => { setExpanded(null); setChosen(null); }}
                style={[styles.zoomButton, styles.fanCenter, { left: width / 2 - 21, top: height / 2 - 21 }]}
              >
                <Feather name="x" size={19} color={colors.ink} />
              </Pressable>
              {expanded.group.ids.length > FAN_PAGE && (
                <View style={styles.fanPages}>
                  <Pressable accessibilityRole="button" accessibilityLabel={t("Previous", "Назад", "Əvvəlki")}
                    disabled={expanded.page === 0}
                    onPress={() => { setChosen(null); setExpanded({ ...expanded, page: expanded.page - 1 }); }}
                    style={[styles.zoomButton, expanded.page === 0 && styles.off]}>
                    <Feather name="chevron-left" size={20} color={colors.ink} />
                  </Pressable>
                  <Text style={styles.countText}>{expanded.page + 1} / {Math.ceil(expanded.group.ids.length / FAN_PAGE)}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel={t("Next", "Дальше", "Növbəti")}
                    disabled={(expanded.page + 1) * FAN_PAGE >= expanded.group.ids.length}
                    onPress={() => { setChosen(null); setExpanded({ ...expanded, page: expanded.page + 1 }); }}
                    style={[styles.zoomButton, (expanded.page + 1) * FAN_PAGE >= expanded.group.ids.length && styles.off]}>
                    <Feather name="chevron-right" size={20} color={colors.ink} />
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}

        {selected && (
          <View style={styles.card} {...NO_DRAG}>
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
            ) : selected.kind === "event" ? (
              <Detail
                image={eventImage(selected.event)}
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
            ) : (
              <View style={styles.info}>
                <Text style={styles.kind}>{t("Place", "Место", "Məkan")}</Text>
                <Text style={styles.name}>{pinLabel(selected)}</Text>
                <Text style={styles.line}>{places[selected.city].note[lang]}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function eventImage(event: EventView): { uri: string } | number {
  return event.image ? { uri: event.image } : photo(event.citySlug, event.citySlug);
}

function Marker({ pin, label, left, top, selected, onPress }: {
  pin: Pin;
  label: string;
  left: number;
  top: number;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = pinTheme[pin.kind];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.marker, { left, top, borderColor: theme.color, zIndex: selected ? 10 : 1 }]}
    >
      <PinPhoto pin={pin} />
      <View style={[pin.kind !== "place" ? styles.pinBadge : styles.placeBadge, { backgroundColor: theme.color }]}>
        <Feather name={theme.icon} size={pin.kind !== "place" ? 10 : 19} color={colors.white} />
      </View>
    </Pressable>
  );
}

function PinPhoto({ pin }: { pin: Pin }) {
  const image = pin.kind === "journey" ? photo(pin.tour.slug, pin.tour.image)
    : pin.kind === "event" ? eventImage(pin.event) : null;
  const [failedUri, setFailedUri] = useState<string>();
  const uri = typeof image === "object" ? image?.uri : undefined;
  const source = uri && uri === failedUri && pin.kind === "event"
    ? photo(pin.event.citySlug, pin.event.citySlug)
    : image;
  if (!source) return null;
  return <Image source={source} onError={() => setFailedUri(uri)} style={styles.photo} />;
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
  head: { paddingHorizontal: 16, gap: 10, paddingBottom: 12 },
  heading: { flexDirection: "row", alignItems: "center", gap: 9 },
  headingIcon: {
    width: 34, height: 34, borderRadius: 12, alignItems: "center",
    justifyContent: "center", backgroundColor: "#DFEADF",
  },
  title: { fontFamily: "InterSemi", fontSize: 23, color: colors.ink },
  chips: { flexDirection: "row", gap: 5 },
  streetTint: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(248, 244, 231, 0.24)" },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 5,
    minHeight: 35,
    justifyContent: "center",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontFamily: "InterSemi", fontSize: 11, color: colors.ink },
  chipTextOn: { color: colors.white },
  stage: { flex: 1, overflow: "hidden", backgroundColor: "#e4ece5" },
  marker: {
    position: "absolute",
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    borderWidth: 2,
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
  cluster: {
    position: "absolute",
    width: 52,
    height: 52,
    padding: 3,
    borderRadius: 26,
    backgroundColor: colors.white,
    boxShadow: "0px 2px 6px rgba(15, 45, 32, 0.26)",
  },
  clusterPhoto: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  clusterBadge: {
    position: "absolute",
    right: -4,
    bottom: -2,
    minHeight: 21,
    paddingHorizontal: 5,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 3,
  },
  clusterCount: { fontFamily: "InterSemi", fontSize: 10, color: colors.white },
  countText: { fontFamily: "InterSemi", fontSize: 13, color: colors.ink },
  pinBadge: { position: "absolute", bottom: 0, right: 0, padding: 3, borderRadius: 9 },
  placeBadge: { flex: 1, alignItems: "center", justifyContent: "center" },
  you: { position: "absolute", width: 18, height: 18, borderRadius: 9, backgroundColor: "#2075D8", borderColor: colors.white, borderWidth: 3, zIndex: 2 },
  fanBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(244, 247, 237, 0.58)" },
  fanCenter: { position: "absolute" },
  fanPages: { position: "absolute", top: 12, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 10 },
  photo: { width: "100%", height: "100%" },
  blank: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3E3DB",
  },
  busy: { position: "absolute", top: 16, alignSelf: "center" },
  eventWarning: {
    position: "absolute",
    top: 12,
    left: 14,
    right: 64,
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.white,
    color: colors.ink,
  },
  empty: {
    position: "absolute",
    bottom: 30,
    left: 14,
    right: 58,
    padding: 8,
    backgroundColor: colors.white,
    borderRadius: 8,
    alignSelf: "center",
    fontFamily: "Inter",
    fontSize: 14,
    color: colors.muted,
  },
  mapSources: {
    position: "absolute",
    right: 8,
    bottom: 8,
    zIndex: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sourceLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 6,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: 8,
  },
  sourceToggle: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: 14,
  },
  streetCredit: {
    position: "absolute",
    right: 8,
    bottom: 8,
    zIndex: 25,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: 4,
    padding: 4,
  },
  creditText: { color: colors.ink, fontSize: 10 },
  credit: {
    position: "absolute",
    left: 14,
    bottom: 12,
    fontFamily: "Inter",
    fontSize: 10,
    color: colors.muted,
  },
  zoom: { position: "absolute", right: 12, bottom: 43, gap: 9 },
  zoomStack: {
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#E2E9DE",
    backgroundColor: colors.white,
    boxShadow: "0px 2px 8px rgba(15, 45, 32, 0.16)",
  },
  zoomStep: { width: 40, height: 41, alignItems: "center", justifyContent: "center" },
  recenter: {
    backgroundColor: colors.ink,
    borderColor: colors.white,
    boxShadow: "0px 2px 8px rgba(15, 45, 32, 0.26)",
  },
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
    top: 52,
    padding: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    zIndex: 20,
    boxShadow: "0px 4px 12px rgba(15, 45, 32, 0.17)",
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
  cardPhoto: { width: 76, height: 90, borderRadius: 16 },
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
