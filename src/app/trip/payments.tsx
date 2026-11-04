import RevisedPlan from "../../features/trips/RevisedPlan";
import type { RevisedPlan as Plan } from "../../features/trips/changes";
import React, { useCallback, useState } from "react";
import { Text, View, Pressable } from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { Page, s, Button } from "../../design/ui";
import { useAccount } from "../../state/account";
import { useDiscovery } from "../../state/discovery";
import {
  SignedIn,
  ErrorNotice,
  Tabs,
  useProblem,
} from "../../features/account/components";
import { type Payment, money } from "../../features/trips/model";
export default function Payments() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    a = useAccount(),
    { t, locale } = useDiscovery(),
    problem = useProblem();
  const [rows, setRows] = useState<Payment[]>([]),
    [plan, setPlan] = useState<Plan | null>(null),
    [tab, setTab] = useState(0),
    [selected, setSelected] = useState<Payment | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (!a.token) return;
    setError("");
    setBusy(true);
    try {
      const [data, p] = await Promise.all([
        a.call<Payment[]>("bookings/" + id + "/payment-requests"),
        a.call<Plan | null>("bookings/" + id + "/revised-plan"),
      ]);
      setRows(data);
      setPlan(p);
      setSelected((old) => data.find((x) => x.id === old?.id) || null);
    } catch {
      setError(problem());
    } finally {
      setBusy(false);
    }
  }, [id, a.token]); // eslint-disable-line react-hooks/exhaustive-deps
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  const status = (v: string) =>
    ({
      PAID: t("Paid", "Оплачено", "Ödənilib"),
      OPEN: t("Requested", "Запрошено", "Tələb edilib"),
      CANCELLED: t("Cancelled", "Отменено", "Ləğv edilib"),
      PENDING: t(
        "Pending — do not retry",
        "Ожидается — не повторяйте",
        "Gözlənilir — təkrar etməyin",
      ),
      FAILED: t("Failed", "Ошибка", "Uğursuz"),
    })[v] || v;
  return (
    <Page
      back
      title={t("Payment history", "История оплат", "Ödəniş tarixçəsi")}
    >
      <SignedIn>
        <Text style={s.title}>
          {t(
            "Every payment, clear.",
            "Каждый платёж — ясно.",
            "Hər ödəniş aydın.",
          )}
        </Text>
        <Text style={s.muted}>
          {t(
            "Requests are not received payments. Amounts are set by the office for the accepted contract.",
            "Запросы не являются полученными платежами. Суммы назначает офис по принятому договору.",
            "Tələblər daxil olmuş ödəniş deyil. Məbləğləri təsdiqli müqaviləyə görə ofis təyin edir.",
          )}
        </Text>
        <ErrorNotice message={error} />
        {plan && (
          <RevisedPlan key={plan.id} id={id} plan={plan} onRefresh={load} />
        )}
        <Tabs
          items={[
            t("All", "Все", "Hamısı"),
            t("Paid", "Оплачено", "Ödənilib"),
            t("Requests", "Запросы", "Tələblər"),
          ]}
          value={tab}
          onChange={setTab}
        />
        {rows
          .filter(
            (x) =>
              tab === 0 ||
              (tab === 1 ? x.status === "PAID" : x.status !== "PAID"),
          )
          .map((x) => (
            <Pressable
              accessibilityRole="button"
              key={x.id}
              onPress={() => setSelected(x)}
              style={[s.card, { padding: 18, gap: 10 }]}
            >
              <View style={s.between}>
                <Text style={s.body}>
                  {x.kind === "DEPOSIT"
                    ? t("Deposit", "Депозит", "Beh")
                    : x.service_key}
                </Text>
                <Text style={s.h2}>
                  {money(x.amount_minor / 100, x.currency, locale)}
                </Text>
              </View>
              <Text style={s.body}>{status(x.status)}</Text>
              <Text style={s.muted}>
                {new Date(x.created_at).toLocaleDateString(locale)} · #
                {x.id.slice(0, 8)}
              </Text>
            </Pressable>
          ))}
        {!rows.length && !busy && !error && (
          <Text style={s.body}>
            {t(
              "No payment requests yet.",
              "Запросов на оплату пока нет.",
              "Hələ ödəniş tələbi yoxdur.",
            )}
          </Text>
        )}
        {selected && (
          <View style={[s.card, { padding: 20, gap: 16 }]}>
            <Text style={s.h2}>
              {money(selected.amount_minor / 100, selected.currency, locale)}
            </Text>
            <Text style={s.body}>{status(selected.status)}</Text>
            {!!selected.customer_message && (
              <Text style={s.body}>{selected.customer_message}</Text>
            )}
            <Text style={s.muted}>
              {selected.status === "OPEN"
                ? t(
                    "Online checkout will be available after the payment provider is connected. No payment was started.",
                    "Онлайн-оплата станет доступна после подключения провайдера. Платёж не начат.",
                    "Provayder qoşulduqdan sonra onlayn ödəniş açılacaq. Ödəniş başladılmayıb.",
                  )
                : t(
                    "This status comes from the server. Refresh if you recently paid.",
                    "Статус получен с сервера. Обновите после оплаты.",
                    "Bu vəziyyət serverdən gəlir. Yeni ödəniş etmisinizsə, yeniləyin.",
                  )}
            </Text>
          </View>
        )}
        <Button outline disabled={busy} onPress={() => void load()}>
          {t(
            "Refresh payment status",
            "Обновить статус",
            "Ödəniş vəziyyətini yenilə",
          )}
        </Button>
      </SignedIn>
    </Page>
  );
}
