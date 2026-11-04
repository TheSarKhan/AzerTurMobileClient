import React, { useCallback, useState } from "react";
import { Text, View, Image, Pressable, ActivityIndicator } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Page, s, Button } from "../../design/ui";
import { useAccount } from "../../state/account";
import { useDiscovery } from "../../state/discovery";
import {
  SignedIn,
  Tabs,
  ErrorNotice,
  useProblem,
} from "../../features/account/components";
import type { Booking } from "../../api/client";
import { type Offer, tripGroup, slug } from "../../features/trips/model";
import { photo } from "../../features/explore/TourCard";
import { colors } from "../../design/theme";
export default function Trips() {
  const a = useAccount(),
    { t, tours, title: tourTitle } = useDiscovery(),
    problem = useProblem();
  const [rows, setRows] = useState<Booking[]>([]),
    [tab, setTab] = useState(0),
    [offers, setOffers] = useState<Offer[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!a.token) return;
    setLoading(true);
    setError("");
    try {
      const [bookings, published] = await Promise.all([
        a.call<Booking[]>("bookings"),
        a.call<Offer[]>("bookings/offers"),
      ]);
      setRows(bookings);
      setOffers(published);
    } catch {
      setError(problem());
    } finally {
      setLoading(false);
    }
  }, [a.token]); // eslint-disable-line react-hooks/exhaustive-deps
  useFocusEffect(
    useCallback(() => {
      setRows([]);
      void load();
    }, [load]),
  );
  return (
    <Page>
      <SignedIn>
        <View style={s.between}>
          <Text style={s.title}>
            {t("Your journeys", "Ваши поездки", "Səfərləriniz")}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("Refresh", "Обновить", "Yenilə")}
            onPress={() => void load()}
          >
            <Text style={s.body}>↻</Text>
          </Pressable>
        </View>
        <Tabs
          items={[
            t("Upcoming", "Предстоящие", "Yaxınlaşan"),
            t("Requests", "Запросы", "Sorğular"),
            t("Past", "Прошедшие", "Keçmiş"),
          ]}
          value={tab}
          onChange={setTab}
        />
        <ErrorNotice message={error} />
        {loading && <ActivityIndicator color={colors.ink} />}
        {!loading &&
          !error &&
          !rows.filter(
            (x) =>
              tripGroup(
                x,
                tours.find((tour) => tour.slug === slug(x))?.days || 1,
              ) === tab,
          ).length && (
            <View style={{ gap: 12, paddingVertical: 25 }}>
              <Text style={s.h2}>
                {t(
                  "Room for a new adventure.",
                  "Время для нового приключения.",
                  "Yeni macəraya yer var.",
                )}
              </Text>
              <Text style={s.muted}>
                {t(
                  "Your journeys in this section will appear here.",
                  "Здесь появятся ваши поездки.",
                  "Bu bölmədəki səfərləriniz burada görünəcək.",
                )}
              </Text>
            </View>
          )}
        {rows
          .filter(
            (x) =>
              tripGroup(
                x,
                tours.find((tour) => tour.slug === slug(x))?.days || 1,
              ) === tab,
          )
          .map((b) => (
            <Pressable
              accessibilityRole="button"
              key={b.id}
              style={s.card}
              onPress={() =>
                router.push({ pathname: "/trip/[id]", params: { id: b.id } })
              }
            >
              <Image
                source={photo(slug(b))}
                style={{ height: 175, width: "100%" }}
              />
              <View style={{ padding: 18, gap: 9 }}>
                <Text style={s.h2}>
                  {offers.find((x) => x.bookingId === b.id)?.title ||
                    (tours.find((x) => x.slug === slug(b))
                      ? tourTitle(tours.find((x) => x.slug === slug(b))!)
                      : b.title)}
                </Text>
                <Text style={s.muted}>
                  {b.departure} · #{b.id.slice(0, 8)}
                </Text>
                <Text style={[s.body, { color: colors.accent }]}>
                  {offers.some((x) => x.bookingId === b.id) &&
                  b.status === "PENDING_REVIEW"
                    ? t(
                        "Offer ready — open journey",
                        "Предложение готово — откройте поездку",
                        "Təklif hazırdır — səfərə baxın",
                      )
                    : b.status === "PENDING_REVIEW"
                      ? t(
                          "Request under review",
                          "Запрос на проверке",
                          "Sorğu yoxlanılır",
                        )
                      : b.status === "CONFIRMED"
                        ? t(
                            "Confirmed journey",
                            "Поездка подтверждена",
                            "Səfər təsdiqlənib",
                          )
                        : b.status === "CANCELLED"
                          ? t("Cancelled", "Отменено", "Ləğv edilib")
                          : b.status === "REJECTED"
                            ? t("Not approved", "Не одобрено", "Təsdiqlənməyib")
                            : t(
                                "Open journey for the next step",
                                "Откройте поездку",
                                "Növbəti addım üçün səfərə baxın",
                              )}
                </Text>
                <View style={s.divider} />
                <Text style={s.body}>
                  {t("View journey →", "Посмотреть поездку →", "Səfərə bax →")}
                </Text>
              </View>
            </Pressable>
          ))}
        <Button outline onPress={() => router.push("/booking-request")}>
          {t(
            "Plan another journey",
            "Запланировать поездку",
            "Yeni səfər planla",
          )}
        </Button>
        <Button outline onPress={() => router.push("/documents")}>
          {t(
            "Tickets & documents",
            "Билеты и документы",
            "Biletlər və sənədlər",
          )}
        </Button>
      </SignedIn>
    </Page>
  );
}
