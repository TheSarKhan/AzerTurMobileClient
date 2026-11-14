import React from "react";
import { Image, View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { type Tour } from "../../api/client";
import { useDiscovery } from "../../state/discovery";
import { s } from "../../design/ui";
import { colors } from "../../design/theme";
export function photo(slug: string, image?: string) {
  // Tours added in the office carry an image key; older code paths only know the slug.
  if (image === "mountains")
    return require("../../../assets/photos/khinalug.png");
  if (image === "sheki") return require("../../../assets/photos/sheki.png");
  if (image === "gabala") return require("../../../assets/photos/gabala.png");
  if (image === "baku") return require("../../../assets/photos/baku.png");
  if (slug.includes("quba") || slug.includes("khinalug"))
    return require("../../../assets/photos/khinalug.png");
  if (slug.includes("sheki"))
    return require("../../../assets/photos/sheki.png");
  if (slug.includes("gabala"))
    return require("../../../assets/photos/gabala.png");
  return require("../../../assets/photos/baku.png");
}
export default function TourCard({ tour }: { tour: Tour }) {
  const { t, title, saved, toggle, price } = useDiscovery();
  const marked = saved.includes(tour.slug);
  return (
    <View style={s.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title(tour)}
        onPress={() =>
          router.push({ pathname: "/tour/[slug]", params: { slug: tour.slug } })
        }
      >
        <Image
          source={photo(tour.slug, tour.image)}
          style={styles.image}
          accessibilityLabel={title(tour)}
        />
        <View style={styles.copy}>
          <Text style={s.h2}>{title(tour)}</Text>
          <Text style={s.muted}>
            {tour.days}{" "}
            {t(
              tour.days === 1
                ? "day · Private journey"
                : "days · Private journey",
              "дн. · Индивидуальная поездка",
              "gün · Fərdi səfər",
            )}
          </Text>
          <Text style={[s.body, { fontFamily: "InterSemi" }]}>
            {t("From", "От", "Başlayan qiymət")} {price(tour.fromPriceEur)} /{" "}
            {t("person", "чел.", "nəfər")}
          </Text>
        </View>
      </Pressable>
      <Pressable
        style={styles.save}
        accessibilityRole="button"
        accessibilityState={{ selected: marked }}
        accessibilityLabel={
          marked
            ? t(
                "Remove from saved",
                "Убрать из сохранённых",
                "Yadda saxlanılanlardan sil",
              )
            : t("Save journey", "Сохранить поездку", "Səfəri yadda saxla")
        }
        onPress={() => toggle(tour.slug)}
      >
        <Ionicons
          name={marked ? "bookmark" : "bookmark-outline"}
          size={22}
          color={marked ? colors.accent : colors.ink}
        />
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  image: { width: "100%", height: 220 },
  copy: { padding: 18, gap: 7 },
  save: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 44,
    height: 44,
    borderRadius: 9,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
});
