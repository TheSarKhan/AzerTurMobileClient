import React from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { useDiscovery } from "../../state/discovery";
import { s } from "../../design/ui";
import { colors } from "../../design/theme";
import { categoryLabels, cityName, eventTitle, type EventView } from "./api";
import { formatDistance, formatPrice, formatWhen } from "./format";
export function usePriceWords() {
  const { t } = useDiscovery();
  return {
    free: t("Free", "Бесплатно", "Pulsuz"),
    from: t("from", "от", "başlayaraq"),
    see: t("See tickets", "Билеты по ссылке", "Biletlər keçiddə"),
  };
}
export default function EventCard({ event }: { event: EventView }) {
  const { t, locale } = useDiscovery();
  const words = usePriceWords();
  const categories = categoryLabels(t);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={eventTitle(event, locale)}
      onPress={() =>
        router.push({
          pathname: "/events/[slug]",
          params: { slug: event.slug },
        })
      }
      style={[s.card, { padding: 16, gap: 8 }]}
    >
      <Text
        style={[s.muted, { color: colors.accent, fontFamily: "InterSemi" }]}
      >
        {categories[event.category] ?? event.category} ·{" "}
        {cityName(event, locale)}
      </Text>
      <Text style={[s.h2, { fontSize: 21 }]}>{eventTitle(event, locale)}</Text>
      <View style={[s.row, { gap: 6 }]}>
        <Feather name="calendar" size={15} color={colors.muted} />
        <Text style={s.muted}>
          {formatWhen(event.startsAt, event.endsAt, event.timeKnown, locale)}
        </Text>
      </View>
      <View style={[s.row, { gap: 6 }]}>
        <Feather name="map-pin" size={15} color={colors.muted} />
        <Text style={[s.muted, { flex: 1 }]}>
          {event.venueName}
          {event.distanceKm != null
            ? " · " + formatDistance(event.distanceKm)
            : ""}
        </Text>
      </View>
      <Text style={[s.body, { fontFamily: "InterSemi" }]}>
        {formatPrice(event.free, event.priceFromMinor, event.currency, words)}
      </Text>
    </Pressable>
  );
}
