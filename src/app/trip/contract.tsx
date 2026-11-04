import React, { useCallback, useState } from "react";
import { Text, Pressable } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Page, s, Button } from "../../design/ui";
import { useAccount } from "../../state/account";
import { useDiscovery } from "../../state/discovery";
import {
  SignedIn,
  ErrorNotice,
  useProblem,
} from "../../features/account/components";
import type { Contract } from "../../features/trips/model";
import { protectedBytes } from "../../features/documents/client";
import SecurePreview from "../../features/documents/SecurePreview";
export default function ContractReview() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    a = useAccount(),
    { t } = useDiscovery(),
    problem = useProblem();
  const [doc, setDoc] = useState<Contract | null>(null),
    [bytes, setBytes] = useState<Uint8Array | null>(null),
    [reviewed, setReviewed] = useState(false),
    [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const path = "bookings/" + id + "/contract";
  const load = useCallback(async () => {
    setBytes(null);
    setDoc(null);
    setReviewed(false);
    setLoaded(false);
    setError("");
    if (!a.token) return;
    setBusy(true);
    try {
      const d = await a.call<Contract | null>(path);
      setDoc(d);
      if (d)
        setBytes(
          await protectedBytes(path + "/" + d.id + "/pdf", a.token, d.sha256),
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
      return () => {
        setBytes(null);
        setReviewed(false);
        setLoaded(false);
      };
    }, [load]),
  );
  async function accept() {
    if (!doc || !reviewed || !loaded || busy) return;
    setBusy(true);
    setError("");
    try {
      const fresh = await a.call<Contract | null>(path);
      if (!fresh || fresh.id !== doc.id || fresh.sha256 !== doc.sha256)
        throw Error("CHANGED");
      await a.call(path + "/" + doc.id + "/accept", { sha256: doc.sha256 });
      await load();
    } catch {
      setReviewed(false);
      setLoaded(false);
      setError(problem());
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      back
      title={t("Contract review", "Проверка договора", "Müqaviləyə baxış")}
    >
      <SignedIn>
        <Text style={s.title}>
          {t(
            "Read. Review. Confirm.",
            "Прочтите. Проверьте. Подтвердите.",
            "Oxuyun. Yoxlayın. Təsdiqləyin.",
          )}
        </Text>
        <ErrorNotice message={error} />
        {doc ? (
          <>
            <Text style={s.body}>
              {doc.filename} · {t("Version", "Версия", "Versiya")} {doc.version}
            </Text>
            <Text style={s.muted}>
              {t(
                "Review the complete PDF and all service, payment and cancellation terms. Confirmation does not charge money.",
                "Прочитайте весь PDF и условия услуг, оплаты и отмены. Подтверждение не списывает деньги.",
                "Tam PDF-i, xidmət, ödəniş və ləğv şərtlərini oxuyun. Təsdiq pul tutmur.",
              )}
            </Text>
            {bytes && (
              <SecurePreview
                bytes={bytes}
                mime="application/pdf"
                onLoad={() => setLoaded(true)}
                onError={() => {
                  setLoaded(false);
                  setReviewed(false);
                  setError(problem());
                }}
              />
            )}
            {doc.state === "ACCEPTED" ? (
              <Text accessibilityLiveRegion="polite" style={s.h2}>
                {t(
                  "✓ This version is accepted",
                  "✓ Эта версия принята",
                  "✓ Bu versiya təsdiqlənib",
                )}
              </Text>
            ) : (
              <>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: reviewed, disabled: !loaded }}
                  disabled={!loaded || busy}
                  onPress={() => setReviewed(!reviewed)}
                  style={[s.row, { paddingVertical: 14 }]}
                >
                  <Text style={s.h2}>{reviewed ? "☑" : "☐"}</Text>
                  <Text style={[s.body, { flex: 1 }]}>
                    {t(
                      "I reviewed this PDF and agree to this contract version.",
                      "Я прочитал PDF и согласен с этой версией договора.",
                      "Bu PDF-i oxudum və müqavilənin bu versiyası ilə razıyam.",
                    )}
                  </Text>
                </Pressable>
                <Button
                  disabled={
                    !loaded ||
                    !reviewed ||
                    busy ||
                    !a.customer?.emailVerified ||
                    a.offline
                  }
                  onPress={() => void accept()}
                >
                  {t(
                    "Confirm this contract",
                    "Подтвердить договор",
                    "Bu müqaviləni təsdiqlə",
                  )}
                </Button>
              </>
            )}
          </>
        ) : (
          <Text style={s.muted}>
            {busy
              ? t("Loading…", "Загрузка…", "Yüklənir…")
              : t(
                  "The office has not published a current contract yet.",
                  "Офис ещё не опубликовал актуальный договор.",
                  "Ofis hələ cari müqavilə yayımlamayıb.",
                )}
          </Text>
        )}
        <Button outline disabled={busy} onPress={() => void load()}>
          {t(
            "Refresh latest version",
            "Обновить версию",
            "Son versiyanı yenilə",
          )}
        </Button>
      </SignedIn>
    </Page>
  );
}
