import React, { useState } from "react";
import type { Animated } from "react-native";
import { useDiscovery } from "../../state/discovery";
import {
  SheetChip as Chip,
  SheetFrame,
  SheetHost,
  SheetSection as Section,
} from "../../design/FilterSheet";
import type { Tour } from "../../api/client";
import { places } from "../journeys/route";
import {
  PLACES,
  PRICE_STEPS,
  activeJourneyCount,
  countWith,
  noJourneyFilters,
  type Duration,
  type JourneyFilters,
} from "./journey-filters";

type Props = {
  open: boolean;
  onClose: () => void;
  value: JourneyFilters;
  /** The journeys left after the category on Explore; the counts are taken from these. */
  tours: Tour[];
  onApply: (next: JourneyFilters) => void;
};

/**
 * Place, duration and price in one bottom sheet. Changes are a draft until the main button is
 * pressed; it says how many journeys the draft would show, and options with none are left out.
 */
export default function JourneyFilterSheet(props: Props) {
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
  tours,
  onApply,
}: Props & { rise: Animated.Value }) {
  const { t, locale, price } = useDiscovery();
  const [draft, setDraft] = useState<JourneyFilters>(value);
  const lang = locale === "ru" ? 1 : locale === "az" ? 2 : 0;
  const set = (patch: Partial<JourneyFilters>) =>
    setDraft((d) => ({ ...d, ...patch }));
  const total = countWith(tours, draft, {});

  const placeOptions = PLACES.map((p) => ({
    key: p,
    n: countWith(tours, draft, { place: p }),
  })).filter((o) => o.n > 0 || draft.place === o.key);
  const durations: [Duration, string][] = [
    ["1", t("1 day", "1 день", "1 gün")],
    ["2-3", t("2 to 3 days", "2–3 дня", "2–3 gün")],
    ["4+", t("4 days or more", "4 дня и больше", "4 gün və daha çox")],
  ];
  const durationOptions = durations
    .map(([key, label]) => ({
      key,
      label,
      n: countWith(tours, draft, { duration: key }),
    }))
    .filter((o) => o.n > 0 || draft.duration === o.key);
  // A price cap is only useful while it leaves out something.
  const everything = countWith(tours, draft, { max: null });
  const priceOptions = PRICE_STEPS.map((cap) => ({
    cap,
    n: countWith(tours, draft, { max: cap }),
  })).filter((o) => (o.n > 0 && o.n < everything) || draft.max === o.cap);

  return (
    <SheetFrame
      rise={rise}
      title={t("Filters", "Фильтры", "Filtrlər")}
      onClose={onClose}
      onReset={() => setDraft(noJourneyFilters)}
      canReset={activeJourneyCount(draft) > 0}
      canApply={total > 0}
      applyLabel={
        total === 0
          ? t("No journeys", "Нет поездок", "Səfər yoxdur")
          : t(
              "Show " + total + (total === 1 ? " journey" : " journeys"),
              "Показать поездки: " + total,
              total + " səfəri göstər",
            )
      }
      onApply={() => {
        onApply(draft);
        onClose();
      }}
    >
      {placeOptions.length > 0 && (
        <Section title={t("Place", "Место", "Məkan")}>
          <Chip
            label={t("Anywhere", "Везде", "Hər yer")}
            on={!draft.place}
            onPress={() => set({ place: "" })}
          />
          {placeOptions.map((o) => (
            <Chip
              key={o.key}
              label={places[o.key].name[lang] + " " + o.n}
              on={draft.place === o.key}
              onPress={() => set({ place: draft.place === o.key ? "" : o.key })}
            />
          ))}
        </Section>
      )}
      {durationOptions.length > 0 && (
        <Section title={t("Duration", "Длительность", "Müddət")}>
          <Chip
            label={t("Any length", "Любая", "İstənilən")}
            on={draft.duration === "all"}
            onPress={() => set({ duration: "all" })}
          />
          {durationOptions.map((o) => (
            <Chip
              key={o.key}
              label={o.label + " " + o.n}
              on={draft.duration === o.key}
              onPress={() =>
                set({ duration: draft.duration === o.key ? "all" : o.key })
              }
            />
          ))}
        </Section>
      )}
      {priceOptions.length > 0 && (
        <Section
          title={t("Price per person", "Цена за человека", "Adambaşı qiymət")}
        >
          <Chip
            label={t("Any price", "Любая цена", "İstənilən qiymət")}
            on={draft.max === null}
            onPress={() => set({ max: null })}
          />
          {priceOptions.map((o) => (
            <Chip
              key={o.cap}
              label={t("Up to ", "До ", "Ən çox ") + price(o.cap) + " " + o.n}
              on={draft.max === o.cap}
              onPress={() => set({ max: draft.max === o.cap ? null : o.cap })}
            />
          ))}
        </Section>
      )}
    </SheetFrame>
  );
}
