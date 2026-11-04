import { documentStatus, documentKind } from "../features/documents/labels";
import React, { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Page, s, Button } from "../design/ui";
import { useAccount } from "../state/account";
import { useDiscovery } from "../state/discovery";
import {
  SignedIn,
  ErrorNotice,
  useProblem,
} from "../features/account/components";
import { ApiError } from "../api/client";
import type { TravelDocument } from "../features/documents/types";
import {
  actionable,
  effectiveDocumentStatus,
} from "../features/documents/types";
import { protectedBytes } from "../features/documents/client";
import {
  cachedDocuments,
  cachedBytes,
  cacheDocument,
  syncMetadata,
  offlineSupported,
  exportFile,
} from "../features/documents/vault";
import SecurePreview from "../features/documents/SecurePreview";
import { colors } from "../design/theme";
export default function Document() {
  const { booking, id } = useLocalSearchParams<{
      booking: string;
      id: string;
    }>(),
    a = useAccount(),
    { t, locale } = useDiscovery(),
    problem = useProblem();
  const [doc, setDoc] = useState<TravelDocument | null>(null),
    [bytes, setBytes] = useState<Uint8Array | null>(null),
    [offline, setOffline] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const path = "bookings/" + booking + "/documents";
  const load = useCallback(async () => {
    if (!a.token || !a.customer) return;
    setBusy(true);
    setError("");
    setBytes(null);
    setDoc(null);
    try {
      const docs = await a.call<TravelDocument[]>(path);
      await syncMetadata(a.customer.id, booking, docs);
      const d = docs.find((x) => x.id === id);
      if (!d) throw new ApiError(404, "DOCUMENT_UNAVAILABLE");
      const content = await protectedBytes(
        path + "/" + id + "/file",
        a.token,
        d.sha256,
      );
      setDoc({ ...d, status: effectiveDocumentStatus(d) });
      setBytes(content);
      setOffline(false);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) await a.forget();
        setError(problem());
      } else {
        try {
          const cached = (await cachedDocuments(a.customer.id)).find(
            (x) => x.id === id && x.booking_id === booking,
          );
          const data = cached ? await cachedBytes(a.customer.id, id) : null;
          if (!cached || !data) throw Error();
          setDoc({ ...cached, status: effectiveDocumentStatus(cached) });
          setBytes(data);
          setOffline(true);
        } catch {
          setError(problem());
        }
      }
    } finally {
      setBusy(false);
    }
  }, [booking, id, a.token, a.customer?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        setDoc(null);
        setBytes(null);
      };
    }, [load]),
  );
  return (
    <Page
      back
      title={t("Original document", "Оригинал документа", "Orijinal sənəd")}
    >
      <SignedIn>
        <ErrorNotice message={error} />
        {doc && (
          <>
            <Text style={s.title}>{doc.title}</Text>
            <Text style={s.body}>
              {documentKind(doc.kind, t)} · v{doc.version}
            </Text>
            {!actionable(doc) && (
              <View style={[s.card, { padding: 18, gap: 12 }]}>
                <Text
                  accessibilityRole="alert"
                  style={[s.h2, { color: colors.accent }]}
                >
                  {t(
                    "Archived — not valid for use",
                    "Архив — не использовать",
                    "Arxiv — istifadə üçün etibarsızdır",
                  )}
                </Text>
                <Text style={s.body}>{documentStatus(doc.status, t)}</Text>
                {doc.replacementId && (
                  <Button
                    outline
                    onPress={() =>
                      router.replace({
                        pathname: "/document",
                        params: { booking, id: doc.replacementId! },
                      })
                    }
                  >
                    {t(
                      "Open current version",
                      "Открыть текущую версию",
                      "Cari versiyaya bax",
                    )}
                  </Button>
                )}
              </View>
            )}
            <Text style={s.body}>
              {new Date(doc.starts_at).toLocaleString(locale, {
                timeZone: doc.timezone,
              })}
              {"\n"}
              {new Date(doc.ends_at).toLocaleString(locale, {
                timeZone: doc.timezone,
              })}{" "}
              · {doc.timezone}
            </Text>
            <Text style={s.muted}>
              {t("Last checked", "Последняя проверка", "Son yoxlanma")}:{" "}
              {new Date(doc.verifiedAt).toLocaleString(locale)}
            </Text>
            {offline && (
              <Text
                accessibilityRole="alert"
                style={[s.body, { color: colors.accent }]}
              >
                {t(
                  "Offline copy — it may have been replaced or revoked since this check. Reconnect before relying on it.",
                  "Офлайн-копия могла быть заменена или отозвана. Подключитесь для проверки.",
                  "Oflayn nüsxə sonradan dəyişdirilmiş və ya geri götürülmüş ola bilər. İstifadədən əvvəl onlayn yoxlayın.",
                )}
              </Text>
            )}
            {!!doc.instructions && (
              <Text style={s.body}>{doc.instructions}</Text>
            )}
            {bytes && (
              <SecurePreview
                bytes={bytes}
                mime={doc.mime}
                onLoad={() => {}}
                onError={() => setError(problem())}
              />
            )}
            <Text style={s.muted}>
              {t(
                "The original supplier file is shown unchanged, including any original barcode or QR.",
                "Оригинал поставщика показан без изменений, включая исходный QR или штрихкод.",
                "Təchizatçının faylı, orijinal QR və ya barkod daxil olmaqla dəyişdirilmədən göstərilir.",
              )}
            </Text>
            {bytes && (
              <>
                <Button
                  outline
                  disabled={busy || offline || !offlineSupported}
                  onPress={async () => {
                    if (!a.customer) return;
                    setBusy(true);
                    setError("");
                    try {
                      await cacheDocument(a.customer.id, doc, bytes);
                      setMessage(
                        t(
                          "Protected offline copy saved.",
                          "Защищённая офлайн-копия сохранена.",
                          "Qorunan oflayn nüsxə saxlanıldı.",
                        ),
                      );
                    } catch {
                      setError(problem());
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {t(
                    "Save protected offline copy",
                    "Сохранить защищённую копию",
                    "Qorunan oflayn nüsxəni saxla",
                  )}
                </Button>
                {!offlineSupported && (
                  <Text style={s.muted}>
                    {t(
                      "Protected offline storage is available in the native mobile app.",
                      "Защищённое офлайн-хранилище доступно в мобильном приложении.",
                      "Qorunan oflayn yaddaş mobil tətbiqdə mövcuddur.",
                    )}
                  </Text>
                )}
                <Button
                  outline
                  disabled={busy}
                  onPress={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      await exportFile(bytes, doc.mime, doc.filename);
                    } catch {
                      setError(problem());
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {t(
                    "Download / Share original",
                    "Скачать / Поделиться оригиналом",
                    "Orijinalı yüklə / paylaş",
                  )}
                </Button>
                <Text style={s.muted}>
                  {t(
                    "Exported copies leave protected app storage and may become outdated.",
                    "Экспортированные копии вне защищённого хранилища могут устареть.",
                    "Yüklənmiş nüsxələr qorunan yaddaşdan kənara çıxır və köhnələ bilər.",
                  )}
                </Text>
              </>
            )}
            {!!message && (
              <Text accessibilityLiveRegion="polite" style={s.body}>
                {message}
              </Text>
            )}
          </>
        )}
        <Button outline disabled={busy} onPress={() => void load()}>
          {busy
            ? t("Loading…", "Загрузка…", "Yüklənir…")
            : t(
                "Check latest version",
                "Проверить версию",
                "Son versiyanı yoxla",
              )}
        </Button>
      </SignedIn>
    </Page>
  );
}
