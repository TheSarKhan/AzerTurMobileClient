import React, { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Page, s, Button } from "../../design/ui";
import { useAccount } from "../../state/account";
import { useDiscovery } from "../../state/discovery";
import {
  SignedIn,
  ErrorNotice,
  useProblem,
} from "../../features/account/components";
import type { Refund, Amendment } from "../../features/trips/changes";
import { money } from "../../features/trips/model";
export default function Refunds() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    a = useAccount(),
    { t, locale } = useDiscovery(),
    problem = useProblem();
  const [rows, setRows] = useState<Refund[]>([]),
    [amendments, setAmendments] = useState<Amendment[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (!a.token) return;
    setBusy(true);
    setError("");
    try {
      const [r, p] = await Promise.all([
        a.call<Refund[]>("bookings/" + id + "/cancellation-updates"),
        a.call<Amendment[]>("bookings/" + id + "/amendments"),
      ]);
      setRows(r);
      setAmendments(
        p.filter((x) => x.state === "ACCEPTED" && x.proposal.refundMinor > 0),
      );
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
  function state(v?: string) {
    return v === "COMPLETED_MANUAL"
      ? t(
          "Office recorded transfer — bank confirmation is separate",
          "Офис отметил перевод — подтверждение банка отдельно",
          "Ofis köçürməni qeyd edib — bank təsdiqi ayrıdır",
        )
      : v === "PROCESSING"
        ? t("Processing", "В обработке", "İcra olunur")
        : v === "FAILED"
          ? t(
              "Transfer failed — office follow-up needed",
              "Ошибка перевода — офис уточняет",
              "Köçürmə alınmadı — ofis yoxlayır",
            )
          : v === "UNKNOWN"
            ? t(
                "Awaiting confirmation",
                "Ожидается подтверждение",
                "Təsdiq gözlənilir",
              )
            : v === "NOT_REQUIRED"
              ? t(
                  "No refund required",
                  "Возврат не требуется",
                  "Geri ödəniş tələb olunmur",
                )
              : t(
                  "Under review / pending",
                  "Проверка / ожидание",
                  "Yoxlanılır / gözlənilir",
                );
  }
  return (
    <Page
      back
      title={t(
        "Refund tracking",
        "Отслеживание возврата",
        "Geri ödənişin izlənməsi",
      )}
    >
      <SignedIn>
        <Text style={s.title}>
          {t(
            "Know where things stand.",
            "Все статусы на виду.",
            "Hər mərhələ aydın.",
          )}
        </Text>
        <Text style={s.muted}>
          {t(
            "The operator reviews supplier terms, request time and the paid amount allocated to each service. A pending review is not a refund promise.",
            "Оператор проверяет условия, время запроса и распределённые платежи. Проверка не обещает возврат.",
            "Operator təchizatçı şərtlərini, sorğu vaxtını və xidmətə bölünmüş ödənişi yoxlayır. Yoxlama geri ödəniş vədi deyil.",
          )}
        </Text>
        <ErrorNotice message={error} />
        {rows.map((r) => (
          <View key={r.id} style={[s.card, { padding: 20, gap: 12 }]}>
            <Text style={s.h2}>
              {t("Cancellation request", "Запрос отмены", "Ləğv sorğusu")} #
              {r.id.slice(0, 8)}
            </Text>
            <Text style={s.body}>{r.message}</Text>
            <Text style={s.body}>{state(r.refundStatus)}</Text>
            {r.refundMinor !== undefined && r.currency && (
              <Text style={s.h2}>
                {money(r.refundMinor / 100, r.currency, locale)}
              </Text>
            )}
            {r.retainedMinor !== undefined && r.currency && (
              <Text style={s.muted}>
                {t("Retained fees", "Удержанные сборы", "Saxlanılan xərclər")}:{" "}
                {money(r.retainedMinor / 100, r.currency, locale)}
              </Text>
            )}
            {!!r.customer_explanation && (
              <Text style={s.body}>{r.customer_explanation}</Text>
            )}
            {r.lines?.map((x) => (
              <View key={x.serviceKey}>
                <Text style={s.body}>{x.serviceKey}</Text>
                <Text style={s.muted}>{x.policyText}</Text>
              </View>
            ))}
            {!!r.refundMessage && <Text style={s.body}>{r.refundMessage}</Text>}
          </View>
        ))}
        {amendments.map((p) => (
          <View key={p.id} style={[s.card, { padding: 20, gap: 12 }]}>
            <Text style={s.h2}>
              {t(
                "Change refund",
                "Возврат по изменению",
                "Dəyişiklik geri ödənişi",
              )}
            </Text>
            <Text style={s.h2}>
              {money(p.proposal.refundMinor / 100, p.proposal.currency, locale)}
            </Text>
            <Text style={s.body}>{state(p.refundTracking?.state)}</Text>
            {!!p.refundTracking?.customer_message && (
              <Text style={s.muted}>{p.refundTracking.customer_message}</Text>
            )}
          </View>
        ))}
        {!rows.length && !amendments.length && !error && !busy && (
          <Text style={s.body}>
            {t(
              "No refund requests yet.",
              "Запросов возврата пока нет.",
              "Hələ geri ödəniş sorğusu yoxdur.",
            )}
          </Text>
        )}
        <Button outline disabled={busy} onPress={() => void load()}>
          {t("Refresh status", "Обновить статус", "Vəziyyəti yenilə")}
        </Button>
      </SignedIn>
    </Page>
  );
}
