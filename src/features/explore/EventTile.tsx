import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { useDiscovery } from "../../state/discovery";
import { colors } from "../../design/theme";
import { categoryLabels, cityName, eventTitle, type EventView } from "../events/api";
import { formatDay, formatPrice, formatTime } from "../events/format";
import { usePriceWords } from "../events/EventCard";

export const EVENT_WIDTH = 236;

/** An event in the horizontal list: picture, when, where and what it costs. */
export default function EventTile({ event }: { event: EventView }) {
  const { t, locale } = useDiscovery();
  const words = usePriceWords();
  const categories = categoryLabels(t);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={eventTitle(event, locale)}
      onPress={() =>
        router.push({ pathname: "/events/[slug]", params: { slug: event.slug } })
      }
      style={styles.card}
    >
      <View>
        {event.image ? (
          <Image source={{ uri: event.image }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.blank]}>
            <Feather name="calendar" size={30} color={colors.muted} />
          </View>
        )}
        <View style={styles.when}>
          <Feather name="calendar" size={13} color={colors.ink} />
          <Text style={styles.whenText}>
            {formatDay(event.startsAt, locale)}
            {event.timeKnown ? ", " + formatTime(event.startsAt) : ""}
          </Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.kind}>
          {categories[event.category] ?? event.category}
        </Text>
        <Text numberOfLines={2} style={styles.title}>
          {eventTitle(event, locale)}
        </Text>
        <View style={styles.where}>
          <Feather name="map-pin" size={14} color={colors.muted} />
          <Text numberOfLines={1} style={styles.place}>
            {event.venueName}, {cityName(event, locale)}
          </Text>
        </View>
        <Text style={styles.price}>
          {formatPrice(event.free, event.priceFromMinor, event.currency, words)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: EVENT_WIDTH,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  image: { width: "100%", height: 120 },
  blank: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EAF0EA",
  },
  when: {
    position: "absolute",
    left: 12,
    top: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.paper,
  },
  whenText: { fontFamily: "InterSemi", fontSize: 12, color: colors.ink },
  body: { padding: 16, gap: 6 },
  kind: { fontFamily: "InterSemi", fontSize: 12, color: colors.accent },
  title: {
    fontFamily: "InterSemi",
    fontSize: 17,
    lineHeight: 22,
    minHeight: 44,
    color: colors.ink,
  },
  where: { flexDirection: "row", alignItems: "center", gap: 6 },
  place: { fontFamily: "Inter", fontSize: 13, color: colors.muted, flex: 1 },
  price: { marginTop: 4, fontFamily: "InterSemi", fontSize: 15, color: colors.ink },
});
