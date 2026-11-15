import React, { useCallback, useState } from "react";
import { Text, View, Image, Pressable, ActivityIndicator } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Page, s, Button } from "../../design/ui";
import { useAccount } from "../../state/account";
import { useDiscovery } from "../../state/discovery";
import {
  SignedIn,
  ErrorNotice,
  useProblem,
} from "../../features/account/components";
import type { Booking } from "../../api/client";
import { type Offer, tripGroup, slug } from "../../features/trips/model";
import { tripStatus } from "../../features/trips/status";
import { photo } from "../../features/explore/TourCard";
import { colors } from "../../design/theme";
export default function Trips() {
  const a = useAccount(),
    { t, tours, title: tourTitle } = useDiscovery(),
    problem = useProblem();
  const [rows, setRows] = useState<Booking[]>([]),
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
  // One list for everything: journeys that are on or coming up first, then requests, then past and
  // closed ones, each group by departure date.
  const trips = [...rows].sort((x, y) => {
    const days = (b: Booking) =>
      tours.find((tour) => tour.slug === slug(b))?.days || 1;
    return (
      tripGroup(x, days(x)) - tripGroup(y, days(y)) ||
      x.departure.localeCompare(y.departure)
    );
  });
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
        <ErrorNotice message={error} />
        {loading && <ActivityIndicator color={colors.ink} />}
        {!loading && !error && !trips.length && (
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
                "Your journeys and requests will appear here.",
                "Здесь появятся ваши поездки и запросы.",
                "Səfərləriniz və sorğularınız burada görünəcək.",
              )}
            </Text>
          </View>
        )}
        {trips.map((b) => (
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
                {b.departure}, #{b.id.slice(0, 8)}
              </Text>
              <Text style={[s.body, { color: colors.accent }]}>
                {tripStatus(
                  b,
                  offers.some((x) => x.bookingId === b.id),
                  t,
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
