import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { type Tour } from "../../api/client";
import { useDiscovery } from "../../state/discovery";
import { colors } from "../../design/theme";
import { photo } from "./TourCard";

export const FEATURED_WIDTH = 236;

/** A journey in the horizontal list: photo, how long it takes, where, and the price. */
export default function FeaturedCard({ tour }: { tour: Tour }) {
  const { t, title, saved, toggle, price } = useDiscovery();
  const marked = saved.includes(tour.slug);
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title(tour)}
        onPress={() =>
          router.push({ pathname: "/tour/[slug]", params: { slug: tour.slug } })
        }
      >
        <View>
          <Image source={photo(tour.slug, tour.image)} style={styles.image} />
          <View style={styles.days}>
            <Feather name="clock" size={13} color={colors.ink} />
            <Text style={styles.daysText}>
              {tour.days} {t(tour.days === 1 ? "day" : "days", "дн.", "gün")}
            </Text>
          </View>
        </View>
        <View style={styles.body}>
          <Text numberOfLines={1} style={styles.title}>
            {title(tour)}
          </Text>
          <View style={styles.where}>
            <Feather name="map-pin" size={14} color={colors.muted} />
            <Text numberOfLines={1} style={styles.region}>
              {tour.region}
            </Text>
          </View>
          <View style={styles.foot}>
            <Text style={styles.price}>
              {t("From", "От", "Başlayan")} {price(tour.fromPriceEur)}
              <Text style={styles.per}>
                {" / "}
                {t("person", "чел.", "nəfər")}
              </Text>
            </Text>
            <View style={styles.go}>
              <Feather name="arrow-right" size={18} color={colors.white} />
            </View>
          </View>
        </View>
      </Pressable>
      <Pressable
        style={styles.save}
        accessibilityRole="button"
        accessibilityState={{ selected: marked }}
        accessibilityLabel={
          marked
            ? t("Remove from saved", "Убрать из сохранённых", "Yadda saxlanılanlardan sil")
            : t("Save journey", "Сохранить поездку", "Səfəri yadda saxla")
        }
        onPress={() => toggle(tour.slug)}
      >
        <Ionicons
          name={marked ? "bookmark" : "bookmark-outline"}
          size={20}
          color={marked ? colors.accent : colors.ink}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: FEATURED_WIDTH,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  image: { width: "100%", height: 150 },
  days: {
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
  daysText: { fontFamily: "InterSemi", fontSize: 12, color: colors.ink },
  body: { padding: 16, gap: 6 },
  title: { fontFamily: "InterSemi", fontSize: 18, color: colors.ink },
  where: { flexDirection: "row", alignItems: "center", gap: 6 },
  region: { fontFamily: "Inter", fontSize: 13, color: colors.muted, flex: 1 },
  foot: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: { fontFamily: "InterSemi", fontSize: 15, color: colors.ink },
  per: { fontFamily: "Inter", fontSize: 13, color: colors.muted },
  go: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.ink,
  },
  save: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
});
