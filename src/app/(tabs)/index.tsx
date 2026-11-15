import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Page, Button, s } from "../../design/ui";
import { colors } from "../../design/theme";
import { useDiscovery, inCategory } from "../../state/discovery";
import LanguageMenu from "../../features/explore/LanguageMenu";
import CategoryBar, { type Category } from "../../features/explore/CategoryBar";
import ExploreSection from "../../features/explore/ExploreSection";
import FeaturedCard, {
  FEATURED_WIDTH,
} from "../../features/explore/FeaturedCard";
import EventsBlock from "../../features/explore/EventsBlock";
import PlanBanner from "../../features/explore/PlanBanner";

export default function Explore() {
  const { t, tours, loading, error, load, storageError } = useDiscovery();
  const [selected, setSelected] = useState<Category>("all");
  const visible = tours.filter(
    (x) => selected === "all" || inCategory(x, selected),
  );
  return (
    <Page>
      <View style={styles.top}>
        <Pressable
          accessibilityRole="search"
          accessibilityLabel={t("Search journeys", "Поиск туров", "Tur axtar")}
          style={styles.search}
          onPress={() => router.push("/search")}
        >
          <Feather name="search" size={20} color={colors.ink} />
          <Text numberOfLines={1} style={styles.placeholder}>
            {t("Where to?", "Куда поедем?", "Hara getmək istəyirsən?")}
          </Text>
        </Pressable>
        <LanguageMenu />
      </View>

      <CategoryBar selected={selected} onSelect={setSelected} />

      {loading && <ActivityIndicator color={colors.ink} />}
      {error && (
        <View style={styles.notice}>
          <Text accessibilityRole="alert" style={s.body}>
            {t(
              "Could not load journeys. Check your connection.",
              "Не удалось загрузить туры. Проверьте подключение.",
              "Turlar yüklənmədi. Bağlantını yoxla.",
            )}
          </Text>
          <Button onPress={() => void load()}>
            {t("Try again", "Повторить", "Yenidən yoxla")}
          </Button>
        </View>
      )}
      {!loading && !error && !visible.length && (
        <View style={styles.notice}>
          <Feather name="compass" size={26} color={colors.muted} />
          <Text style={s.muted}>
            {t(
              "No journeys in this category yet.",
              "Пока нет туров в этой категории.",
              "Bu kateqoriyada hələ tur yoxdur.",
            )}
          </Text>
        </View>
      )}
      {visible.length > 0 && (
        <ExploreSection
          title={t("Journeys", "Путешествия", "Səfərlər")}
          icon={<Ionicons name="map-outline" size={18} color={colors.ink} />}
          note={String(visible.length)}
          snap={FEATURED_WIDTH + 12}
        >
          {visible.map((tour) => (
            <FeaturedCard key={tour.slug} tour={tour} />
          ))}
        </ExploreSection>
      )}

      <EventsBlock />

      <PlanBanner />

      {storageError && (
        <Text accessibilityRole="alert" style={s.muted}>
          {t(
            "Your preferences could not be saved on this device.",
            "Не удалось сохранить настройки на устройстве.",
            "Seçimlər bu cihazda saxlanılmadı.",
          )}
        </Text>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: 10, zIndex: 30 },
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
  placeholder: {
    flex: 1,
    fontFamily: "Inter",
    fontSize: 14,
    color: colors.muted,
  },
  notice: { alignItems: "flex-start", gap: 12 },
});
