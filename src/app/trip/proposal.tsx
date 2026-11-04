import React, { useCallback, useState } from "react";
import { Text, View, Pressable } from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { Page, s, Button } from "../../design/ui";
import { useAccount } from "../../state/account";
import { useDiscovery } from "../../state/discovery";
import {
  SignedIn,
  ErrorNotice,
  Field,
  useProblem,
} from "../../features/account/components";
import type { Amendment } from "../../features/trips/changes";
import { money } from "../../features/trips/model";
import { protectedBytes } from "../../features/documents/client";
import SecurePreview from "../../features/documents/SecurePreview";
export default function Proposal() {
  const { id, proposal } = useLocalSearchParams<{
      id: string;
      proposal: string;
    }>(),
    a = useAccount(),
    { t, locale } = useDiscovery(),
    problem = useProblem();
  const [item, setItem] = useState<Amendment | null>(null),
    [bytes, setBytes] = useState<Uint8Array | null>(null),
    [loaded, setLoaded] = useState(false),
    [checked, setChecked] = useState(false),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const path = "bookings/" + id + "/amendments";
  const load = useCallback(async () => {
    setChecked(false);
    setLoaded(false);
    setBytes(null);
    setError("");
    if (!a.token) return;
    setBusy(true);
    try {
      const p =
        (await a.call<Amendment[]>(path)).find((x) => x.id === proposal) ||
        null;
      setItem(p);
      if (p)
        setBytes(
          await protectedBytes(
            path + "/" + p.id + "/pdf",
            a.token,
            p.pdf_sha256,
          ),
        );
    } catch {
      setError(problem());
    } finally {
      setBusy(false);
    }
  }, [id, proposal, a.token]); // eslint-disable-line react-hooks/exhaustive-deps
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        setBytes(null);
        setChecked(false);
        setLoaded(false);
      };
    }, [load]),
  );
  async function act(accept: boolean) {
    if (!item || busy) return;
    setBusy(true);
    setError("");
    try {
      await a.call(path + (accept ? "/accept" : "/decline"), {
        amendmentId: item.id,
        version: item.draft_version,
        ...(accept ? { sha256: item.pdf_sha256 } : { message }),
      });
      await load();
    } catch {
      setChecked(false);
      setLoaded(false);
      setError(problem());
    } finally {
      setBusy(false);
    }
  }
  const p = item?.proposal;
  return (
    <Page back title={t("Review changes", "Изменения", "Dəyişikliklərə baxış")}>
      <SignedIn>
        <ErrorNotice message={error} />
        {item && p && (
          <>
            <Text style={s.title}>{p.title}</Text>
            <Text style={s.body}>
              {p.date} · {p.travelers} {t("travelers", "гостей", "nəfər")} ·{" "}
              {item.state}
            </Text>
            <Text style={s.body}>{p.message}</Text>
            {p.services.map((x) => (
              <View key={x.key} style={{ gap: 8 }}>
                <Text style={s.h2}>
                  {x.name} · {money(x.total, p.currency, locale)}
                </Text>
                <Text style={s.muted}>{x.policy}</Text>
              </View>
            ))}
            {[
              [
                t("Previously paid", "Ранее оплачено", "Əvvəl ödənilib"),
                p.paidMinor,
              ],
              [
                t("Supplier fees", "Сборы поставщика", "Təchizatçı xərcləri"),
                p.retainedMinor,
              ],
              [t("Refund", "Возврат", "Geri ödəniş"), p.refundMinor],
              [
                t("Carried funds", "Перенесённые средства", "Keçirilən vəsait"),
                p.appliedMinor,
              ],
              [t("New total", "Новая сумма", "Yeni məbləğ"), p.totalMinor],
              [t("Remaining", "Остаток", "Qalıq"), p.remainingMinor],
            ].map(([label, n]) => (
              <View key={String(label)} style={s.between}>
                <Text style={[s.body, { flex: 1 }]}>{label}</Text>
                <Text style={s.body}>
                  {money(Number(n) / 100, p.currency, locale)}
                </Text>
              </View>
            ))}
            {bytes && (
              <SecurePreview
                bytes={bytes}
                mime="application/pdf"
                onLoad={() => setLoaded(true)}
                onError={() => {
                  setLoaded(false);
                  setChecked(false);
                  setError(problem());
                }}
              />
            )}
            {item.canAccept ? (
              <>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked, disabled: !loaded }}
                  disabled={!loaded || busy}
                  style={s.row}
                  onPress={() => setChecked(!checked)}
                >
                  <Text style={s.h2}>{checked ? "☑" : "☐"}</Text>
                  <Text style={[s.body, { flex: 1 }]}>
                    {t(
                      "I reviewed this revised PDF, amounts and service terms.",
                      "Я прочитал обновлённый PDF, суммы и условия.",
                      "Yenilənmiş PDF, məbləğ və xidmət şərtlərini oxudum.",
                    )}
                  </Text>
                </Pressable>
                <Button
                  disabled={
                    !loaded ||
                    !checked ||
                    busy ||
                    a.offline ||
                    !a.customer?.emailVerified
                  }
                  onPress={() => void act(true)}
                >
                  {t(
                    "Accept this version",
                    "Принять эту версию",
                    "Bu versiyanı təsdiqlə",
                  )}
                </Button>
                <Field
                  label={t(
                    "Message if declining (optional)",
                    "Сообщение при отказе",
                    "İmtina mesajı (istəyə görə)",
                  )}
                  value={message}
                  onChangeText={setMessage}
                  maxLength={1000}
                />
                <Button
                  outline
                  disabled={busy || a.offline || !a.customer?.emailVerified}
                  onPress={() => void act(false)}
                >
                  {t(
                    "Decline proposal",
                    "Отклонить предложение",
                    "Təklifdən imtina et",
                  )}
                </Button>
              </>
            ) : (
              <Text style={s.muted}>
                {t(
                  "This version is closed or no longer current. Refresh to check the latest proposal.",
                  "Версия закрыта или устарела. Обновите данные.",
                  "Bu versiya bağlanıb və ya artıq cari deyil. Son təklifi yeniləyin.",
                )}
              </Text>
            )}
          </>
        )}
        <Button outline disabled={busy} onPress={() => void load()}>
          {t(
            "Refresh latest proposal",
            "Обновить предложение",
            "Son təklifi yenilə",
          )}
        </Button>
      </SignedIn>
    </Page>
  );
}
