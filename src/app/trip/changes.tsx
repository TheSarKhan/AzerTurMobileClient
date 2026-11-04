import React, { useCallback, useState } from "react";
import { Text, View, Pressable } from "react-native";
import { useFocusEffect, useLocalSearchParams, router } from "expo-router";
import { Page, s, Button } from "../../design/ui";
import { useAccount } from "../../state/account";
import { useDiscovery } from "../../state/discovery";
import {
  SignedIn,
  ErrorNotice,
  Field,
  Tabs,
  useProblem,
} from "../../features/account/components";
import type { BookingRequest } from "../../api/client";
import type { Amendment, Cancellation } from "../../features/trips/changes";
import { money } from "../../features/trips/model";
export default function Changes() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    a = useAccount(),
    { t, locale } = useDiscovery(),
    problem = useProblem();
  const [tab, setTab] = useState(0),
    [rows, setRows] = useState<BookingRequest[]>([]),
    [proposals, setProposals] = useState<Amendment[]>([]),
    [context, setContext] = useState<Cancellation | null>(null),
    [selection, setSelection] = useState<string[]>([]),
    [reason, setReason] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const path = "bookings/" + id;
  const load = useCallback(async () => {
    if (!a.token) return;
    setError("");
    setBusy(true);
    try {
      const [r, p, c] = await Promise.all([
        a.call<BookingRequest[]>("bookings/requests"),
        a.call<Amendment[]>(path + "/amendments"),
        a.call<Cancellation>(path + "/cancellation"),
      ]);
      setRows(r.filter((x) => x.bookingId === id));
      setProposals(p);
      setContext(c);
      setSelection([]);
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
  const pending = rows.some((x) => x.status === "PENDING");
  async function send() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (tab === 1) {
        if (!context) return;
        await a.call(path + "/cancellation", {
          contractId: context.contractId,
          serviceKeys: selection,
          reason: reason.trim(),
          message: message.trim(),
        });
      } else
        await a.call(path + "/requests", {
          kind: "CHANGE",
          message: message.trim(),
        });
      setNotice(
        t(
          "Request sent. The office will check the terms before any change takes effect.",
          "Запрос отправлен. Офис проверит условия до вступления изменений в силу.",
          "Sorğu göndərildi. Dəyişiklik qüvvəyə minməzdən əvvəl ofis şərtləri yoxlayacaq.",
        ),
      );
      setMessage("");
      setReason("");
      await load();
    } catch {
      setError(problem());
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      back
      title={t(
        "Changes & cancellation",
        "Изменения и отмена",
        "Dəyişiklik və ləğv",
      )}
    >
      <SignedIn>
        <Text style={s.title}>
          {t("Plans can change.", "Планы меняются.", "Planlar dəyişə bilər.")}
        </Text>
        <ErrorNotice message={error} />
        {!!notice && (
          <Text accessibilityLiveRegion="polite" style={s.body}>
            {notice}
          </Text>
        )}
        {proposals.map((p) => (
          <View key={p.id} style={[s.card, { padding: 18, gap: 12 }]}>
            <Text style={s.h2}>{p.proposal.title}</Text>
            <Text style={s.body}>
              {t(
                "Change proposal",
                "Предложение изменения",
                "Dəyişiklik təklifi",
              )}{" "}
              · v{p.draft_version} · {p.state}
            </Text>
            <Button
              outline
              onPress={() =>
                router.push({
                  pathname: "/trip/proposal",
                  params: { id, proposal: p.id },
                })
              }
            >
              {t("Review proposal", "Посмотреть предложение", "Təklifə bax")}
            </Button>
          </View>
        ))}
        {rows.map((r) => (
          <View key={r.id} style={[s.card, { padding: 18, gap: 9 }]}>
            <Text style={s.body}>
              {r.kind === "CANCEL"
                ? t("Cancellation", "Отмена", "Ləğv")
                : t("Change", "Изменение", "Dəyişiklik")}{" "}
              · {r.status}
            </Text>
            <Text style={s.muted}>{r.message}</Text>
            {!!r.response && <Text style={s.body}>{r.response}</Text>}
          </View>
        ))}
        {pending ? (
          <Text style={s.body}>
            {t(
              "An open request is being reviewed. Payments may be paused until it is resolved.",
              "Открытый запрос рассматривается. Оплаты могут быть приостановлены.",
              "Açıq sorğu yoxlanılır. Həll olunana qədər ödəniş dayandırıla bilər.",
            )}
          </Text>
        ) : (
          context &&
          !["CANCELLED", "REJECTED"].includes(context.bookingStatus) && (
            <>
              <Tabs
                items={[
                  t("Change journey", "Изменить поездку", "Səfəri dəyiş"),
                  t("Cancel services", "Отменить услуги", "Xidmətləri ləğv et"),
                ]}
                value={tab}
                onChange={setTab}
              />
              {tab === 1 && (
                <>
                  <Text style={s.muted}>
                    {t(
                      "Each service has its own supplier and time-based cancellation policy. Selecting a service does not instantly cancel it or promise a refund.",
                      "У каждой услуги свои условия поставщика и сроки. Выбор не отменяет её немедленно и не гарантирует возврат.",
                      "Hər xidmətin təchizatçı və vaxta görə ayrıca siyasəti var. Seçmək dərhal ləğv və ya geri ödəniş vədi deyil.",
                    )}
                  </Text>
                  {context.services.map((x) => (
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{
                        checked: selection.includes(x.key),
                      }}
                      key={x.key}
                      onPress={() =>
                        setSelection(
                          selection.includes(x.key)
                            ? selection.filter((k) => k !== x.key)
                            : [...selection, x.key],
                        )
                      }
                      style={[s.card, { padding: 18, gap: 9 }]}
                    >
                      <Text style={s.body}>
                        {selection.includes(x.key) ? "☑" : "☐"} {x.name} ·{" "}
                        {money(x.total, context.offer.currency, locale)}
                      </Text>
                      <Text style={s.muted}>
                        {x.policy ||
                          t(
                            "The office will confirm the supplier terms.",
                            "Офис уточнит условия поставщика.",
                            "Ofis təchizatçı şərtlərini yoxlayacaq.",
                          )}
                      </Text>
                    </Pressable>
                  ))}
                  {!context.contractId && (
                    <Text style={s.muted}>
                      {t(
                        "Before a contract is accepted, cancellation applies to the whole request. Select all services.",
                        "До принятия договора отмена относится ко всему запросу. Выберите все услуги.",
                        "Müqavilə təsdiqindən əvvəl ləğv bütün sorğuya aiddir. Bütün xidmətləri seçin.",
                      )}
                    </Text>
                  )}
                  <Field
                    label={t(
                      "Cancellation reason",
                      "Причина отмены",
                      "Ləğv səbəbi",
                    )}
                    value={reason}
                    onChangeText={setReason}
                    maxLength={200}
                  />
                </>
              )}
              <Field
                label={t(
                  "Tell us what should change",
                  "Опишите пожелания",
                  "İstəklərinizi yazın",
                )}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={1500}
              />
              <Button
                disabled={
                  busy ||
                  a.offline ||
                  !a.customer?.emailVerified ||
                  message.trim().length < 5 ||
                  (tab === 1 &&
                    (!reason.trim() ||
                      !selection.length ||
                      (!context.contractId &&
                        selection.length !== context.services.length)))
                }
                onPress={() => void send()}
              >
                {t(
                  "Send for operator review",
                  "Отправить оператору",
                  "Operator yoxlamasına göndər",
                )}
              </Button>
            </>
          )
        )}
        <Button outline disabled={busy} onPress={() => void load()}>
          {t("Refresh", "Обновить", "Yenilə")}
        </Button>
      </SignedIn>
    </Page>
  );
}
