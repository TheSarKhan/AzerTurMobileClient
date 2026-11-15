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
import EventFilterSheet from "../../features/events/EventFilterSheet";
import JourneyFilterSheet from "../../features/explore/JourneyFilterSheet";
import {
  FilterButton,
  RemovableChips,
} from "../../features/events/ActiveFilters";
import {
  activeJourneyCount,
  journeyMatches,
  noJourneyFilters,
  type JourneyFilters,
} from "../../features/explore/journey-filters";
import { places } from "../../features/journeys/route";
import { noFilters, type EventFilters } from "../../features/events/filters";
import { useCities } from "../../features/events/useCities";
import { useLocate } from "../../features/events/useLocate";
import MyJourneyCard from "../../features/explore/MyJourneyCard";
import NotificationBell from "../../features/explore/NotificationBell";
import PlanBanner from "../../features/explore/PlanBanner";

export default function Explore() {
  const { t, tours, loading, error, load, storageError, locale, price } =
    useDiscovery();
  const [selected, setSelected] = useState<Category>("all");
  const [eventFilters, setEventFilters] = useState<EventFilters>(noFilters);
  const [sheet, setSheet] = useState(false);
  const cities = useCities();
  const here = useLocate();
  const changeEvents = (patch: Partial<EventFilters>) =>
    setEventFilters((f) => ({ ...f, ...patch }));
  const [journeyFilters, setJourneyFilters] =
    useState<JourneyFilters>(noJourneyFilters);
  const [journeySheet, setJourneySheet] = useState(false);
  const inCategoryNow = tours.filter(
    (x) => selected === "all" || inCategory(x, selected),
  );
  const visible = inCategoryNow.filter((x) =>
    journeyMatches(x, journeyFilters),
  );
  const journeyCount = activeJourneyCount(journeyFilters);
  const lang = locale === "ru" ? 1 : locale === "az" ? 2 : 0;
  const journeyChips: { key: string; label: string; clear: () => void }[] = [];
  if (journeyFilters.place)
    journeyChips.push({
      key: "place",
      label: places[journeyFilters.place]?.name[lang] ?? journeyFilters.place,
      clear: () => setJourneyFilters((f) => ({ ...f, place: "" })),
    });
  if (journeyFilters.duration !== "all")
    journeyChips.push({
      key: "duration",
      label: {
        "1": t("1 day", "1 день", "1 gün"),
        "2-3": t("2 to 3 days", "2–3 дня", "2–3 gün"),
        "4+": t("4 days or more", "4 дня и больше", "4 gün və daha çox"),
      }[journeyFilters.duration],
      clear: () => setJourneyFilters((f) => ({ ...f, duration: "all" })),
    });
  if (journeyFilters.max !== null)
    journeyChips.push({
      key: "max",
      label: t("Up to ", "До ", "Ən çox ") + price(journeyFilters.max),
      clear: () => setJourneyFilters((f) => ({ ...f, max: null })),
    });
  return (
    <View style={{ flex: 1 }}>
      <Page>
        <View style={styles.top}>
          <Pressable
            accessibilityRole="search"
            accessibilityLabel={t(
              "Search journeys",
              "Поиск туров",
              "Tur axtar",
            )}
            style={styles.search}
            onPress={() => router.push("/search")}
          >
            <Feather name="search" size={20} color={colors.ink} />
            <Text numberOfLines={1} style={styles.placeholder}>
              {t("Where to?", "Куда поедем?", "Hara getmək istəyirsən?")}
            </Text>
          </Pressable>
          <LanguageMenu />
          <NotificationBell />
        </View>

        <MyJourneyCard />

        <CategoryBar selected={selected} onSelect={setSelected} />

        {loading && <ActivityIndicator color={colors.ink} />}
        {!!error && (
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
        {!loading && !error && !inCategoryNow.length && (
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
        {inCategoryNow.length > 0 && (
          <ExploreSection
            title={t("Journeys", "Путешествия", "Səfərlər")}
            icon={<Ionicons name="map-outline" size={18} color={colors.ink} />}
            note={String(visible.length)}
            action={
              <FilterButton
                size={40}
                count={journeyCount}
                onPress={() => setJourneySheet(true)}
              />
            }
            filters={
              <RemovableChips
                chips={journeyChips}
                onClear={() => setJourneyFilters(noJourneyFilters)}
                inset={16}
              />
            }
            snap={FEATURED_WIDTH + 12}
          >
            {visible.length === 0 && (
              <View style={styles.none}>
                <Text style={s.muted}>
                  {t(
                    "No journeys match these filters.",
                    "Нет поездок по этим фильтрам.",
                    "Bu filtrlərə uyğun səfər yoxdur.",
                  )}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setJourneyFilters(noJourneyFilters)}
                  hitSlop={8}
                >
                  <Text style={styles.noneClear}>
                    {t(
                      "Clear filters",
                      "Сбросить фильтры",
                      "Filtrləri təmizlə",
                    )}
                  </Text>
                </Pressable>
              </View>
            )}
            {visible.map((tour) => (
              <FeaturedCard key={tour.slug} tour={tour} />
            ))}
          </ExploreSection>
        )}

        <EventsBlock
          filters={eventFilters}
          cities={cities}
          onChange={changeEvents}
          onClear={() =>
            setEventFilters({ ...noFilters, radius: eventFilters.radius })
          }
          onOpenFilters={() => setSheet(true)}
        />

        <PlanBanner />

        {!!storageError && (
          <Text accessibilityRole="alert" style={s.muted}>
            {t(
              "Your preferences could not be saved on this device.",
              "Не удалось сохранить настройки на устройстве.",
              "Seçimlər bu cihazda saxlanılmadı.",
            )}
          </Text>
        )}
      </Page>
      <JourneyFilterSheet
        open={journeySheet}
        onClose={() => setJourneySheet(false)}
        value={journeyFilters}
        tours={inCategoryNow}
        onApply={setJourneyFilters}
      />
      <EventFilterSheet
        open={sheet}
        onClose={() => setSheet(false)}
        value={eventFilters}
        query=""
        cities={cities}
        locate={here.locate}
        locating={here.locating}
        note={here.note}
        onApply={(next) => {
          here.clearNote();
          setEventFilters({ ...next, city: next.near ? "" : next.city });
        }}
      />
    </View>
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
  none: { minHeight: 90, justifyContent: "center", gap: 8, paddingRight: 16 },
  noneClear: { fontFamily: "InterSemi", fontSize: 13, color: colors.accent },
});
