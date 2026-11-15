import React, { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useDiscovery } from "../../state/discovery";
import { colors } from "../../design/theme";
import {
  SheetChip as Chip,
  SheetFrame,
  SheetHost,
  SheetSection as Section,
} from "../../design/FilterSheet";
import { CATEGORIES, categoryLabels, cityName, type City } from "./api";
import type { Quick } from "./ranges";
import { noFilters, type EventFilters } from "./filters";
import { useEventFacets } from "./useEventFacets";

const RADII = [10, 25, 50, 100];

type Props = {
  open: boolean;
  onClose: () => void;
  value: EventFilters;
  query: string;
  cities: City[];
  onApply: (next: EventFilters) => void;
  locate: () => Promise<{ lat: number; lng: number } | null>;
  locating: boolean;
  note: string;
};

/**
 * Every event filter in one bottom sheet. Changes are only a draft until the main button is
 * pressed: it says how many events the draft would show, and chips that lead to no event are left out.
 */
export default function EventFilterSheet(props: Props) {
  return (
    <SheetHost open={props.open}>
      {(rise) => <Content {...props} rise={rise} />}
    </SheetHost>
  );
}

function Content({
  rise,
  onClose,
  value,
  query,
  cities,
  onApply,
  locate,
  locating,
  note,
}: Props & { rise: import("react-native").Animated.Value }) {
  const { t, locale } = useDiscovery();
  const [draft, setDraft] = useState<EventFilters>(value);
  const labels = categoryLabels(t);
  const { facets, whenTotals } = useEventFacets(
    draft.when,
    draft.category,
    draft.near ? "" : draft.city,
    query,
  );
  const whenOptions = (
    [
      ["any", t("Any date", "Любая дата", "İstənilən tarix")],
      ["today", t("Today", "Сегодня", "Bu gün")],
      ["weekend", t("This weekend", "На выходных", "Bu həftəsonu")],
      ["week", t("This week", "На этой неделе", "Bu həftə")],
    ] as [Quick, string][]
  ).filter(
    ([k]) =>
      k === "any" || k === draft.when || !whenTotals || whenTotals[k] > 0,
  );
  const cityOptions = cities.filter(
    (c) => !facets || (facets.cities[c.slug] ?? 0) > 0 || draft.city === c.slug,
  );
  const categoryOptions = CATEGORIES.filter(
    (c) => !facets || (facets.categories[c] ?? 0) > 0 || draft.category === c,
  );
  const count = !draft.near && facets ? facets.total : null;
  const dirty =
    draft.when !== "any" || !!draft.city || !!draft.category || !!draft.near;
  const set = (patch: Partial<EventFilters>) =>
    setDraft((d) => ({ ...d, ...patch }));

  async function toggleNear(on: boolean) {
    if (!on) return set({ near: null });
    const here = await locate();
    if (here) set({ near: here, city: "" });
  }

  return (
    <SheetFrame
      rise={rise}
      title={t("Filters", "Фильтры", "Filtrlər")}
      onClose={onClose}
      onReset={() => setDraft({ ...noFilters, radius: draft.radius })}
      canReset={dirty}
      canApply={count !== 0}
      applyLabel={
        count === 0
          ? t("No events", "Нет событий", "Tədbir yoxdur")
          : count === null
            ? t("Show events", "Показать события", "Tədbirləri göstər")
            : t(
                "Show " + count + " events",
                "Показать события: " + count,
                count + " tədbiri göstər",
              )
      }
      onApply={() => {
        onApply(draft);
        onClose();
      }}
    >
      <Section title={t("When", "Когда", "Nə vaxt")}>
        {whenOptions.map(([key, label]) => (
          <Chip
            key={key}
            label={label}
            on={draft.when === key}
            onPress={() => set({ when: key })}
          />
        ))}
      </Section>

      <View style={styles.block}>
        <View style={styles.nearRow}>
          <View style={styles.nearIcon}>
            <Ionicons name="navigate-outline" size={22} color={colors.ink} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.nearTitle}>
              {t("Near me", "Рядом со мной", "Yaxınlıqda")}
            </Text>
            <Text style={styles.nearText}>
              {locating
                ? t("Finding you…", "Определяем…", "Axtarılır…")
                : t(
                    "Events around your location",
                    "События вокруг вас",
                    "Yerləşdiyin yerin ətrafındakı tədbirlər",
                  )}
            </Text>
          </View>
          <Switch
            accessibilityLabel={t("Near me", "Рядом со мной", "Yaxınlıqda")}
            value={!!draft.near}
            disabled={locating}
            onValueChange={(on) => void toggleNear(on)}
            trackColor={{ false: "#D8DDD5", true: colors.ink }}
          />
        </View>
        {draft.near && (
          <View style={styles.radii}>
            {RADII.map((r) => (
              <Chip
                key={r}
                label={r + " km"}
                on={draft.radius === r}
                onPress={() => set({ radius: r })}
              />
            ))}
          </View>
        )}
        {note !== "" && (
          <Text accessibilityRole="alert" style={styles.note}>
            {note}
          </Text>
        )}
        <Text style={styles.privacy}>
          {t(
            "Your location is used only for this search. It is rounded to about 1 km and is not stored.",
            "Местоположение используется только для этого поиска, округляется до ~1 км и не сохраняется.",
            "Məkan yalnız bu axtarış üçündür, təxminən 1 km dəqiqliklə yuvarlaqlaşdırılır və saxlanmır.",
          )}
        </Text>
      </View>

      {!draft.near && cityOptions.length > 0 && (
        <Section title={t("City", "Город", "Şəhər")}>
          <Chip
            label={t("All cities", "Все города", "Bütün şəhərlər")}
            on={!draft.city}
            onPress={() => set({ city: "" })}
          />
          {cityOptions.map((c) => (
            <Chip
              key={c.slug}
              label={
                cityName(
                  {
                    cityNameEn: c.nameEn,
                    cityNameRu: c.nameRu,
                    cityNameAz: c.nameAz,
                  },
                  locale,
                ) + (facets ? " " + (facets.cities[c.slug] ?? 0) : "")
              }
              on={draft.city === c.slug}
              onPress={() => set({ city: draft.city === c.slug ? "" : c.slug })}
            />
          ))}
        </Section>
      )}

      {categoryOptions.length > 0 && (
        <Section title={t("Type", "Тип", "Növ")}>
          <Chip
            label={t("All types", "Все типы", "Bütün növlər")}
            on={!draft.category}
            onPress={() => set({ category: "" })}
          />
          {categoryOptions.map((c) => (
            <Chip
              key={c}
              label={
                labels[c] + (facets ? " " + (facets.categories[c] ?? 0) : "")
              }
              on={draft.category === c}
              onPress={() => set({ category: draft.category === c ? "" : c })}
            />
          ))}
        </Section>
      )}
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  block: { gap: 10, paddingVertical: 12 },
  nearRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  nearIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6EEE8",
  },
  nearTitle: { fontFamily: "InterSemi", fontSize: 15, color: colors.ink },
  nearText: { fontFamily: "Inter", fontSize: 13, color: colors.muted },
  radii: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  note: { fontFamily: "Inter", fontSize: 13, color: colors.danger },
  privacy: { fontFamily: "Inter", fontSize: 12, color: colors.muted },
});
