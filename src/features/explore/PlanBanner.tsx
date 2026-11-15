import React, { useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useDiscovery } from "../../state/discovery";
import { colors } from "../../design/theme";
import { places } from "../journeys/route";
import { PLACES } from "./journey-filters";
import { useReducedMotion } from "../journeys/useReducedMotion";

type Key = "stay" | "driver" | "guide" | "transfer" | "activity";
const defaults: Record<Key, boolean> = {
  stay: true,
  driver: true,
  guide: true,
  transfer: false,
  activity: false,
};

/** Shrinks a little under the finger so a tap feels answered. */
function Pop({
  children,
  onPress,
  label,
  checked,
  role = "checkbox",
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  label: string;
  checked?: boolean;
  role?: "checkbox" | "button";
  style?: object;
}) {
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));
  const to = (v: number) =>
    reduced
      ? undefined
      : Animated.spring(scale, {
          toValue: v,
          friction: 6,
          tension: 260,
          useNativeDriver: false,
        }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        accessibilityRole={role}
        accessibilityLabel={label}
        accessibilityState={checked === undefined ? undefined : { checked }}
        onPress={onPress}
        onPressIn={() => to(0.95)}
        onPressOut={() => to(1)}
        style={{ flex: 1 }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

/**
 * The block that invites people to build a journey. It is a small first step of the builder: pick
 * the places (in the order you want to go) and the services, then "Start planning" opens the
 * builder with those already chosen.
 */
export default function PlanBanner() {
  const { t, locale } = useDiscovery();
  const lang = locale === "ru" ? 1 : locale === "az" ? 2 : 0;
  const [picked, setPicked] = useState<string[]>([]);
  const [services, setServices] = useState<Record<Key, boolean>>(defaults);
  const tiles: {
    key: Key;
    icon: React.ComponentProps<typeof Feather>["name"];
    label: string;
  }[] = [
    { key: "stay", icon: "home", label: t("Stay", "Жильё", "Qalma yeri") },
    { key: "driver", icon: "truck", label: t("Driver", "Водитель", "Sürücü") },
    { key: "guide", icon: "users", label: t("Guide", "Гид", "Bələdçi") },
    {
      key: "transfer",
      icon: "map-pin",
      label: t("Transfer", "Трансфер", "Transfer"),
    },
    {
      key: "activity",
      icon: "star",
      label: t("Experiences", "Впечатления", "Təcrübələr"),
    },
  ];
  const chosen = tiles.filter((x) => services[x.key]);
  const toggle = (place: string) =>
    setPicked((list) =>
      list.includes(place) ? list.filter((p) => p !== place) : [...list, place],
    );
  const start = () =>
    router.push({
      pathname: "/booking-request",
      params: {
        ...(picked.length ? { cities: picked.join(",") } : {}),
        services: chosen.map((x) => x.key).join(",") || "none",
      },
    });
  const summary = [
    picked.length
      ? picked.length +
        " " +
        t(picked.length === 1 ? "place" : "places", "мест", "yer")
      : t(
          "Places: we suggest a route",
          "Места: предложим маршрут",
          "Yerlər: marşrutu biz təklif edirik",
        ),
    chosen.length +
      " " +
      t(chosen.length === 1 ? "service" : "services", "услуг", "xidmət"),
  ].join(", ");
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.badge}>
          <Ionicons name="compass-outline" size={24} color={colors.white} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text accessibilityRole="header" style={styles.title}>
            {t(
              "Build your own journey",
              "Соберите свой маршрут",
              "Öz səfərini qur",
            )}
          </Text>
          <Text style={styles.text}>
            {t(
              "Pick what you like. We confirm the rest.",
              "Выберите, что нравится. Остальное подтвердим мы.",
              "Xoşuna gələni seç. Qalanını biz təsdiqləyirik.",
            )}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.step}>1</Text>
          <Text style={styles.sectionTitle}>
            {t("Where to?", "Куда?", "Hara?")}
          </Text>
          <Text style={styles.optional}>
            {t("optional", "по желанию", "istəyə görə")}
          </Text>
        </View>
        <View style={styles.wrap}>
          {PLACES.map((place) => {
            const order = picked.indexOf(place) + 1;
            return (
              <Pop
                key={place}
                label={places[place].name[lang]}
                checked={order > 0}
                onPress={() => toggle(place)}
              >
                <View style={[styles.place, order > 0 && styles.placeOn]}>
                  {order > 0 && (
                    <View style={styles.order}>
                      <Text style={styles.orderText}>{order}</Text>
                    </View>
                  )}
                  <Text
                    style={[styles.placeText, order > 0 && styles.placeTextOn]}
                  >
                    {places[place].name[lang]}
                  </Text>
                </View>
              </Pop>
            );
          })}
        </View>
        {picked.length > 1 && (
          <Text style={styles.hint}>
            {t(
              "The numbers show the order of your route.",
              "Цифры показывают порядок маршрута.",
              "Rəqəmlər marşrutun ardıcıllığını göstərir.",
            )}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.step}>2</Text>
          <Text style={styles.sectionTitle}>
            {t("What do you need?", "Что вам нужно?", "Nələr lazımdır?")}
          </Text>
        </View>
        <View style={styles.grid}>
          {tiles.map((x) => {
            const on = services[x.key];
            return (
              <Pop
                key={x.key}
                label={x.label}
                checked={on}
                onPress={() =>
                  setServices((s) => ({ ...s, [x.key]: !s[x.key] }))
                }
                style={styles.tileCell}
              >
                <View style={[styles.tile, on && styles.tileOn]}>
                  <Feather
                    name={x.icon}
                    size={22}
                    color={on ? colors.ink : colors.white}
                  />
                  <Text style={[styles.tileText, on && styles.tileTextOn]}>
                    {x.label}
                  </Text>
                  {on && (
                    <View style={styles.check}>
                      <Feather name="check" size={12} color={colors.white} />
                    </View>
                  )}
                </View>
              </Pop>
            );
          })}
        </View>
      </View>

      <View style={styles.foot}>
        <Text style={styles.summary}>{summary}</Text>
        <Pop
          role="button"
          label={t("Start planning", "Начать", "Planlamağa başla")}
          onPress={start}
        >
          <View style={styles.button}>
            <Text style={styles.buttonText}>
              {t("Start planning", "Начать", "Planlamağa başla")}
            </Text>
            <Feather name="arrow-right" size={20} color={colors.ink} />
          </View>
        </Pop>
        <View style={styles.safe}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#CFE0D5" />
          <Text style={styles.safeText}>
            {t(
              "You pay only after you approve the contract.",
              "Оплата только после согласования договора.",
              "Ödəniş yalnız müqaviləni təsdiq etdikdən sonra olur.",
            )}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 20,
    padding: 18,
    borderRadius: 26,
    backgroundColor: colors.ink,
  },
  head: { flexDirection: "row", alignItems: "center", gap: 14 },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  title: {
    fontFamily: "InterSemi",
    fontSize: 22,
    lineHeight: 28,
    color: colors.white,
  },
  text: { fontFamily: "Inter", fontSize: 14, lineHeight: 20, color: "#CFE0D5" },
  section: { gap: 12 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  step: {
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: "center",
    lineHeight: 24,
    overflow: "hidden",
    fontFamily: "InterSemi",
    fontSize: 13,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  sectionTitle: {
    flex: 1,
    fontFamily: "InterSemi",
    fontSize: 16,
    color: colors.white,
  },
  optional: { fontFamily: "Inter", fontSize: 12, color: "#9FBBAA" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  place: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  placeOn: { backgroundColor: colors.white, borderColor: colors.white },
  placeText: { fontFamily: "InterSemi", fontSize: 14, color: colors.white },
  placeTextOn: { color: colors.ink },
  order: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.ink,
  },
  orderText: { fontFamily: "InterSemi", fontSize: 12, color: colors.white },
  hint: { fontFamily: "Inter", fontSize: 12, color: "#9FBBAA" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tileCell: { width: "31%", flexGrow: 1, minWidth: 96 },
  tile: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 84,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  tileOn: { backgroundColor: colors.white },
  tileText: {
    fontFamily: "InterSemi",
    fontSize: 13,
    color: colors.white,
    textAlign: "center",
  },
  tileTextOn: { color: colors.ink },
  check: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  foot: { gap: 12 },
  summary: { fontFamily: "Inter", fontSize: 13, color: "#CFE0D5" },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
  },
  buttonText: { fontFamily: "InterSemi", fontSize: 17, color: colors.ink },
  safe: { flexDirection: "row", alignItems: "center", gap: 8 },
  safeText: { flex: 1, fontFamily: "Inter", fontSize: 12, color: "#CFE0D5" },
});
