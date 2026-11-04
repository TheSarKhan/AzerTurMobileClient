import React, { useCallback, useState } from "react";
import { Text, Image, View, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Page, s, Button } from "../../design/ui";
import { useAccount } from "../../state/account";
import { useDiscovery } from "../../state/discovery";
import {
  SignedIn,
  Menu,
  Row,
  ErrorNotice,
  useProblem,
} from "../../features/account/components";
import type { Booking } from "../../api/client";
import {
  type Offer,
  type Contract,
  type Payment,
  slug,
  money,
} from "../../features/trips/model";
import { photo } from "../../features/explore/TourCard";
import type { Cancellation } from "../../features/trips/changes";
import { colors } from "../../design/theme";
export default function Trip() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    a = useAccount(),
    { t, locale } = useDiscovery(),
    problem = useProblem();
  const [booking, setBooking] = useState<Booking | null>(null),
    [offer, setOffer] = useState<Offer | null>(null),
    [contract, setContract] = useState<Contract | null>(null),
    [payments, setPayments] = useState<Payment[]>([]),
    [finance, setFinance] = useState<Cancellation | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!a.token) return;
    setLoading(true);
    setError("");
    try {
      const [bookings, offers, c, p, f] = await Promise.all([
        a.call<Booking[]>("bookings"),
        a.call<Offer[]>("bookings/offers"),
        a.call<Contract | null>("bookings/" + id + "/contract"),
        a.call<Payment[]>("bookings/" + id + "/payment-requests"),
        a.call<Cancellation>("bookings/" + id + "/cancellation"),
      ]);
      setBooking(bookings.find((x) => x.id === id) || null);
      setOffer(offers.find((x) => x.bookingId === id) || null);
      setContract(c);
      setPayments(p);
      setFinance(f);
    } catch {
      setError(problem());
    } finally {
      setLoading(false);
    }
  }, [id, a.token]); // eslint-disable-line react-hooks/exhaustive-deps
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  const paid = payments
    .filter((x) => x.status === "PAID")
    .reduce((sum, x) => sum + x.amount_minor / 100, 0);
  const total = finance
    ? finance.services.reduce((sum, x) => sum + x.total, 0)
    : offer
      ? offer.services.reduce((sum, x) => sum + x.total, 0)
      : booking?.total || 0;
  const applied = finance ? finance.allocatableMinor / 100 : paid;
  return (
    <Page back title={t("Your journey", "Ваша поездка", "Səfəriniz")}>
      <SignedIn>
        <ErrorNotice message={error} />
        {loading && <ActivityIndicator color={colors.ink} />}
        {!loading && !error && !booking && (
          <Text style={s.body}>
            {t(
              "Journey unavailable.",
              "Поездка недоступна.",
              "Səfər əlçatan deyil.",
            )}
          </Text>
        )}
        {booking && (
          <>
            <Image
              source={photo(slug(booking))}
              style={{ height: 165, width: "100%", borderRadius: 12 }}
            />
            <Text style={s.title}>{offer?.title || booking.title}</Text>
            <Text style={s.muted}>
              {offer?.date || booking.departure}
              {offer
                ? " · " +
                  offer.travelers +
                  " " +
                  t("travelers", "путешественников", "nəfər")
                : ""}
            </Text>
            <Text style={[s.body, { color: colors.accent }]}>
              {contract?.state === "SENT"
                ? t(
                    "Your contract is ready for review.",
                    "Договор готов к проверке.",
                    "Müqaviləniz baxış üçün hazırdır.",
                  )
                : booking.status === "PENDING_REVIEW"
                  ? t(
                      "Our office is checking your request.",
                      "Офис проверяет ваш запрос.",
                      "Ofis sorğunuzu yoxlayır.",
                    )
                  : booking.status}
            </Text>
            <Text style={s.h2}>
              {t("Next step", "Следующий шаг", "Növbəti addım")}
            </Text>
            {contract ? (
              <View style={[s.card, { padding: 18, gap: 14 }]}>
                <Text style={s.h2}>
                  {contract.state === "ACCEPTED"
                    ? t(
                        "Contract accepted",
                        "Договор принят",
                        "Müqavilə təsdiqlənib",
                      )
                    : t(
                        "Your contract is ready",
                        "Ваш договор готов",
                        "Müqaviləniz hazırdır",
                      )}
                </Text>
                <Text style={s.muted}>
                  {t("Version", "Версия", "Versiya")} {contract.version} · PDF
                </Text>
                <Button
                  outline
                  onPress={() =>
                    router.push({ pathname: "/trip/contract", params: { id } })
                  }
                >
                  {t("Open contract", "Открыть договор", "Müqaviləyə bax")}
                </Button>
              </View>
            ) : (
              <Text style={s.muted}>
                {t(
                  "You will see the offer and contract here after the office prepares them.",
                  "Предложение и договор появятся после подготовки офисом.",
                  "Ofis hazırladıqdan sonra təklif və müqavilə burada görünəcək.",
                )}
              </Text>
            )}
            {!!offer?.itinerary?.length && (
              <>
                <Text style={s.h2}>
                  {t("Your route", "Ваш маршрут", "Marşrutunuz")}
                </Text>
                {offer.itinerary.map((day, i) => (
                  <View key={i} style={{ gap: 5 }}>
                    <Text style={s.body}>
                      {i + 1}. {day.city}
                    </Text>
                    <Text style={s.muted}>{day.description}</Text>
                  </View>
                ))}
              </>
            )}
            {(finance?.services || offer?.services)?.map((x) => (
              <View key={x.key} style={{ gap: 6 }}>
                <View style={s.between}>
                  <Text style={s.body}>{x.name}</Text>
                  <Text style={s.body}>
                    {money(
                      x.total,
                      offer?.currency || booking.currency,
                      locale,
                    )}
                  </Text>
                </View>
                <Text style={s.muted}>{x.policy}</Text>
                <View style={s.divider} />
              </View>
            ))}
            <Menu>
              {[
                [
                  t("Active services", "Действующие услуги", "Aktiv xidmətlər"),
                  total,
                ],
                [
                  t(
                    "Applied funds",
                    "Зачтённые средства",
                    "Tətbiq edilmiş vəsait",
                  ),
                  applied,
                ],
                [
                  t("Remaining", "Остаток", "Qalıq"),
                  Math.max(0, total - applied),
                ],
              ].map(([label, n]) => (
                <View key={String(label)} style={[s.between, { padding: 16 }]}>
                  <Text style={[s.body, { flex: 1 }]}>{label}</Text>
                  <Text style={s.body}>
                    {money(
                      Number(n),
                      offer?.currency || booking.currency,
                      locale,
                    )}
                  </Text>
                </View>
              ))}
            </Menu>
            <Text style={s.muted}>
              {t(
                "Only server-confirmed payments count. Cancellation and change adjustments are shown separately.",
                "Учитываются подтверждённые оплаты. Корректировки отмен и изменений показаны отдельно.",
                "Yalnız serverin təsdiqlədiyi ödənişlər sayılır. Ləğv və dəyişiklik düzəlişləri ayrıca göstərilir.",
              )}
            </Text>
            <Menu>
              <Row
                label={t(
                  "Payments & history",
                  "Платежи и история",
                  "Ödənişlər və tarixçə",
                )}
                onPress={() =>
                  router.push({ pathname: "/trip/payments", params: { id } })
                }
              />
              <Row
                label={t(
                  "Tickets & documents",
                  "Билеты и документы",
                  "Biletlər və sənədlər",
                )}
                onPress={() =>
                  router.push({
                    pathname: "/documents",
                    params: { booking: id },
                  })
                }
              />
              <Row
                label={t(
                  "Changes & cancellation",
                  "Изменения и отмена",
                  "Dəyişiklik və ləğv",
                )}
                onPress={() =>
                  router.push({ pathname: "/trip/changes", params: { id } })
                }
              />
              <Row
                label={t("Refund tracking", "Возвраты", "Geri ödənişlər")}
                onPress={() =>
                  router.push({ pathname: "/trip/refunds", params: { id } })
                }
              />
            </Menu>
            {!!booking.operatorNote && (
              <Text style={s.body}>{booking.operatorNote}</Text>
            )}
            {!!error && (
              <Button outline onPress={() => void load()}>
                {t("Retry", "Повторить", "Yenidən yoxla")}
              </Button>
            )}
          </>
        )}
      </SignedIn>
    </Page>
  );
}
