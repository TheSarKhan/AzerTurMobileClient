import React, { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { Button, Page, s } from "../../design/ui";
import { colors } from "../../design/theme";
import { useDiscovery } from "../../state/discovery";
import { usePriceWords } from "../../features/events/EventCard";
import {
  categoryLabels,
  cityName,
  eventTitle,
  getEvent,
  type EventDetail,
} from "../../features/events/api";
import {
  formatPrice,
  formatWhen,
  isHttps,
  mapUrl,
} from "../../features/events/format";
export default function EventScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, locale } = useDiscovery();
  const words = usePriceWords();
  const [attempt, setAttempt] = useState(0),
    [loaded, setLoaded] = useState<{
      key: string;
      data: EventDetail | null;
      status: number;
    } | null>(null);
  const key = slug + "#" + attempt;
  useEffect(() => {
    let live = true;
    getEvent(String(slug))
      .then((data) => live && setLoaded({ key, data, status: 200 }))
      .catch((e: { status?: number }) => {
        if (live) setLoaded({ key, data: null, status: e?.status ?? 0 });
      });
    return () => {
      live = false;
    };
  }, [slug, key]);
  const data = loaded?.key === key ? loaded.data : null;
  const state: "loading" | "missing" | "failed" | "ready" =
    loaded?.key !== key
      ? "loading"
      : data
        ? "ready"
        : loaded.status === 404
          ? "missing"
          : "failed";
  const title = t("Event", "Событие", "Tədbir");
  if (state !== "ready" || !data)
    return (
      <Page back title={title}>
        {state === "loading" && <ActivityIndicator color={colors.ink} />}
        {state === "missing" && (
          <Text style={s.body}>
            {t(
              "This event is no longer listed.",
              "Это событие больше не отображается.",
              "Bu tədbir artıq siyahıda yoxdur.",
            )}
          </Text>
        )}
        {state === "failed" && (
          <View style={{ gap: 10 }}>
            <Text accessibilityRole="alert" style={s.body}>
              {t(
                "The event could not be loaded.",
                "Не удалось загрузить событие.",
                "Tədbiri yükləmək olmadı.",
              )}
            </Text>
            <Button outline onPress={() => setAttempt((n) => n + 1)}>
              {t("Try again", "Повторить", "Yenidən cəhd et")}
            </Button>
          </View>
        )}
      </Page>
    );
  const e = data.event;
  const description =
    locale === "ru"
      ? data.descriptionRu
      : locale === "az"
        ? data.descriptionAz
        : data.descriptionEn;
  const categories = categoryLabels(t);
  const fact = (icon: "calendar" | "map-pin" | "tag", text: string) => (
    <View style={[s.row, { alignItems: "flex-start", gap: 10 }]}>
      <Feather
        name={icon}
        size={18}
        color={colors.accent}
        style={{ marginTop: 3 }}
      />
      <Text style={[s.body, { flex: 1 }]}>{text}</Text>
    </View>
  );
  return (
    <Page back title={title}>
      <Text
        style={[s.muted, { color: colors.accent, fontFamily: "InterSemi" }]}
      >
        {categories[e.category] ?? e.category} · {cityName(e, locale)}
      </Text>
      <Text style={s.title}>{eventTitle(e, locale)}</Text>
      {fact("calendar", formatWhen(e.startsAt, e.endsAt, e.timeKnown, locale))}
      {fact("map-pin", e.venueName + (data.address ? ", " + data.address : ""))}
      {fact("tag", formatPrice(e.free, e.priceFromMinor, e.currency, words))}
      {description !== "" && <Text style={s.body}>{description}</Text>}
      <Button
        outline
        onPress={() => Linking.openURL(mapUrl(e.latitude, e.longitude))}
      >
        {t("Open in maps", "Открыть на карте", "Xəritədə aç")}
      </Button>
      {isHttps(data.ticketUrl) && (
        <Button onPress={() => Linking.openURL(data.ticketUrl as string)}>
          {t(
            "Tickets & details",
            "Билеты и подробности",
            "Biletlər və ətraflı",
          )}
        </Button>
      )}
      <Text style={s.muted}>
        {t(
          "Dates, prices and tickets are set by the organiser. Check their page before you go.",
          "Даты, цены и билеты устанавливает организатор. Проверьте его страницу перед поездкой.",
          "Tarix, qiymət və biletləri təşkilatçı müəyyən edir. Getməzdən əvvəl onun səhifəsini yoxlayın.",
        )}
      </Text>
    </Page>
  );
}
