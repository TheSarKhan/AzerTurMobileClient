import { effectiveDocumentStatus } from "../features/documents/types";
import { documentStatus } from "../features/documents/labels";
import React, { useCallback, useState } from "react";
import { Text, View, Pressable, ActivityIndicator } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Page, s, Button } from "../design/ui";
import { colors } from "../design/theme";
import { useAccount } from "../state/account";
import { useDiscovery } from "../state/discovery";
import {
  SignedIn,
  Tabs,
  ErrorNotice,
  useProblem,
} from "../features/account/components";
import { type Booking, ApiError } from "../api/client";
import type { TravelDocument } from "../features/documents/types";
import { cachedDocuments, syncMetadata } from "../features/documents/vault";
export default function Documents() {
  const { booking } = useLocalSearchParams<{ booking?: string }>(),
    a = useAccount(),
    { t, locale } = useDiscovery(),
    problem = useProblem();
  const [rows, setRows] = useState<TravelDocument[]>([]),
    [offline, setOffline] = useState(false),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [tab, setTab] = useState(0);
  const load = useCallback(async () => {
    if (!a.customer || !a.token) return;
    setLoading(true);
    setError("");
    try {
      const ids = booking
        ? [booking]
        : (await a.call<Booking[]>("bookings")).map((x) => x.id);
      const collections = await Promise.all(
        ids.map((id) =>
          a.call<TravelDocument[]>("bookings/" + id + "/documents"),
        ),
      );
      const docs = collections.flat();
      for (let i = 0; i < ids.length; i++)
        await syncMetadata(a.customer.id, ids[i], collections[i]);
      setRows(docs);
      setOffline(false);
    } catch (e) {
      if (e instanceof ApiError) {
        setRows([]);
        setError(problem());
      } else {
        const cached = await cachedDocuments(a.customer.id).catch(() => []);
        setRows(cached.filter((x) => !booking || x.booking_id === booking));
        setOffline(true);
        if (!cached.length) setError(problem());
      }
    } finally {
      setLoading(false);
    }
  }, [booking, a.token, a.customer?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => setRows([]);
    }, [load]),
  );
  const ordered = rows
    .map((d) => ({ ...d, status: effectiveDocumentStatus(d) }))
    .sort((x, y) => {
      const priority = (d: TravelDocument) =>
        d.status === "UPCOMING" ? 0 : d.status === "ACTIVE" ? 1 : 2;
      return (
        priority(x) - priority(y) ||
        new Date(x.starts_at).getTime() - new Date(y.starts_at).getTime()
      );
    })
    .filter(
      (x) =>
        tab === 0 ||
        (tab === 1 && x.status === "UPCOMING") ||
        (tab === 2 && x.status === "ACTIVE") ||
        (tab === 3 && !["ACTIVE", "UPCOMING"].includes(x.status)),
    );
  return (
    <Page
      back
      title={t(
        "Tickets & documents",
        "Билеты и документы",
        "Biletlər və sənədlər",
      )}
    >
      <SignedIn>
        <Text style={s.title}>
          {t("Ready when you are.", "Готовы к путешествию.", "Səfərə hazır.")}
        </Text>
        <Text style={s.muted}>
          {t(
            "Upcoming and active tickets, together. Original documents are published by our office.",
            "Предстоящие и активные билеты вместе. Оригиналы публикует офис.",
            "Yaxınlaşan və aktiv biletlər bir yerdə. Orijinalları ofis yayımlayır.",
          )}
        </Text>
        {offline && (
          <Text
            accessibilityRole="alert"
            style={[s.body, { color: colors.accent }]}
          >
            {t(
              "Offline copies. Status reflects the last check, not live supplier validation.",
              "Офлайн-копии. Статус на момент последней проверки, без проверки поставщика онлайн.",
              "Oflayn nüsxələr. Vəziyyət son yoxlamaya aiddir, təchizatçının canlı təsdiqi deyil.",
            )}
          </Text>
        )}
        <Tabs
          items={[
            t("All", "Все", "Hamısı"),
            t("Upcoming", "Предстоящие", "Yaxınlaşan"),
            t("Active", "Активные", "Aktiv"),
            t("Past", "Архив", "Keçmiş"),
          ]}
          value={tab}
          onChange={setTab}
        />
        <ErrorNotice message={error} />
        {loading && <ActivityIndicator color={colors.ink} />}
        {ordered.map((d) => (
          <Pressable
            key={d.id}
            accessibilityRole="button"
            style={[s.card, { padding: 19, gap: 12 }]}
            onPress={() =>
              router.push({
                pathname: "/document",
                params: { booking: d.booking_id, id: d.id },
              })
            }
          >
            <View style={s.row}>
              <Feather
                name={
                  d.service_key === "flight"
                    ? "send"
                    : d.service_key === "hotel"
                      ? "home"
                      : "file-text"
                }
                color={colors.ink}
                size={25}
              />
              <Text style={[s.h2, { flex: 1 }]}>{d.title}</Text>
            </View>
            <Text style={s.body}>
              {new Date(d.starts_at).toLocaleString(locale, {
                timeZone: d.timezone,
              })}{" "}
              · {d.timezone}
            </Text>
            <Text
              style={[
                s.body,
                {
                  color: ["UPCOMING", "ACTIVE"].includes(d.status)
                    ? colors.ink
                    : colors.accent,
                },
              ]}
            >
              {documentStatus(d.status, t)} · v{d.version}
            </Text>
            <Text style={s.muted}>
              {t("Last checked", "Последняя проверка", "Son yoxlanma")}:{" "}
              {new Date(d.verifiedAt).toLocaleString(locale)}
            </Text>
            <View style={s.divider} />
            <Text style={s.body}>
              {t("Open original →", "Открыть оригинал →", "Orijinala bax →")}
            </Text>
          </Pressable>
        ))}
        {!loading && !error && !ordered.length && (
          <View style={{ gap: 15, paddingVertical: 24 }}>
            <Feather name="file-text" size={40} color={colors.ink} />
            <Text style={s.h2}>
              {t(
                "Your documents will be here.",
                "Документы появятся здесь.",
                "Sənədləriniz burada olacaq.",
              )}
            </Text>
            <Text style={s.muted}>
              {t(
                "A booking does not mean a boarding pass is issued. We show the original when the supplier provides it and our office publishes it.",
                "Бронирование не означает выпуск посадочного талона. Оригинал появится после получения и публикации офисом.",
                "Rezervasiya minik talonunun verildiyi demək deyil. Təchizatçı verdikdən və ofis yayımladıqdan sonra orijinal görünəcək.",
              )}
            </Text>
          </View>
        )}
        <Button outline disabled={loading} onPress={() => void load()}>
          {t("Check for updates", "Проверить обновления", "Yenilikləri yoxla")}
        </Button>
      </SignedIn>
    </Page>
  );
}
