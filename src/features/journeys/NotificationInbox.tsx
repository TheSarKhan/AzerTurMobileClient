import React, { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { colors, heading } from "../../design/theme";
import { request, type Locale } from "../../api/client";
import NoticeCard from "./NoticeCard";
import { ago, dayGroup, type Group } from "./notice-meta";
import { useReducedMotion } from "./useReducedMotion";

type Notice = {
  id: string;
  booking_id: string | null;
  event: string;
  read_at: string | null;
  created_at: string;
};
const native = Platform.OS !== "web";

/** Round icon button for the actions in the header. */
function IconButton({
  icon,
  label,
  onPress,
  disabled,
  spinning,
  reduced,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  spinning?: boolean;
  reduced: boolean;
}) {
  const turn = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    if (!spinning || reduced) {
      turn.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(turn, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: native,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spinning, reduced, turn]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconButton,
        pressed && styles.iconPressed,
        disabled && styles.iconOff,
      ]}
    >
      <Animated.View
        style={{
          transform: [
            {
              rotate: turn.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "360deg"],
              }),
            },
          ],
        }}
      >
        <Ionicons name={icon as never} size={22} color={colors.ink} />
      </Animated.View>
    </Pressable>
  );
}

/** Placeholder rows while the first load runs. */
function Skeleton({ reduced }: { reduced: boolean }) {
  const pulse = useState(() => new Animated.Value(0.55))[0];
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: native,
        }),
        Animated.timing(pulse, {
          toValue: 0.55,
          duration: 700,
          useNativeDriver: native,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, pulse]);
  return (
    <View style={{ gap: 12 }}>
      {[0, 1, 2].map((k) => (
        <Animated.View key={k} style={[styles.skeleton, { opacity: pulse }]}>
          <View style={styles.skeletonIcon} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={[styles.skeletonLine, { width: "70%" }]} />
            <View style={[styles.skeletonLine, { width: "40%", height: 10 }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

/** A large icon that bobs gently, for the empty states. */
function Floating({ icon, reduced }: { icon: string; reduced: boolean }) {
  const bob = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: native,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: native,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, bob]);
  return (
    <Animated.View
      style={[
        styles.emptyIcon,
        {
          transform: [
            {
              translateY: bob.interpolate({
                inputRange: [0, 1],
                outputRange: [4, -6],
              }),
            },
          ],
        },
      ]}
    >
      <Ionicons name={icon as never} size={44} color={colors.ink} />
    </Animated.View>
  );
}

export default function NotificationInbox({
  token,
  locale: l,
}: {
  token: string;
  locale: Locale;
}) {
  const t = (en: string, ru: string, az: string) =>
    l === "az" ? az : l === "ru" ? ru : en;
  const reduced = useReducedMotion();
  const [rows, setRows] = useState<Notice[] | null>(null),
    [onlyUnread, setOnlyUnread] = useState(false),
    [loading, setLoading] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [push, setPush] = useState<string | null>(null),
    [segmentWidth, setSegmentWidth] = useState(0);
  const slide = useState(() => new Animated.Value(0))[0];
  const projectId =
    Constants.easConfig?.projectId ||
    Constants.expoConfig?.extra?.eas?.projectId ||
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  async function load() {
    setLoading(true);
    try {
      const items = (
        await request<{ items: Notice[] }>(
          "bookings/notifications",
          undefined,
          token,
        )
      ).items;
      setRows(items.sort((a, b) => b.created_at.localeCompare(a.created_at)));
      setMessage("");
    } catch {
      setRows((old) => old ?? []);
      setMessage(
        t(
          "Could not load notifications.",
          "Не удалось загрузить уведомления.",
          "Bildirişlər yüklənmədi.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(
    () => {
      void Promise.resolve().then(load);
      SecureStore.getItemAsync("azertur_push_session")
        .then((raw) => {
          if (raw) {
            const stored = JSON.parse(raw);
            if (stored.session === token) setPush(stored.expo);
          }
        })
        .catch(() => {});
    },
    // The token change restores this authenticated session; refresh handles subsequent reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token],
  );
  useEffect(() => {
    Animated.spring(slide, {
      toValue: onlyUnread ? 1 : 0,
      friction: 9,
      tension: 140,
      useNativeDriver: native,
    }).start();
  }, [onlyUnread, slide]);
  const labels: Record<string, string> = {
    TRAVEL_DOCUMENT_PUBLISHED: t(
      "Your original travel document is ready",
      "Оригинал документа готов",
      "Orijinal səfər sənədiniz hazırdır",
    ),
    AMENDMENT_SENT: t(
      "A change proposal is ready",
      "Предложение изменения готово",
      "Dəyişiklik təklifi hazırdır",
    ),
    AMENDMENT_ACCEPTED: t(
      "Changes accepted",
      "Изменения приняты",
      "Dəyişikliklər təsdiqlənib",
    ),
    AMENDMENT_DECLINED: t(
      "Proposal declined",
      "Предложение отклонено",
      "Təklif rədd edilib",
    ),
    AMENDMENT_REFUND_UPDATED: t(
      "Refund tracking updated",
      "Статус возврата обновлён",
      "Geri ödəniş vəziyyəti yenilənib",
    ),
    OFFER_SENT: t(
      "Your offer is ready",
      "Предложение готово",
      "Təklifiniz hazırdır",
    ),
    CONTRACT_SENT: t(
      "Review your contract",
      "Просмотрите договор",
      "Müqaviləyə baxın",
    ),
    PAYMENT_REQUESTED: t(
      "Payment requested",
      "Запрошена оплата",
      "Ödəniş tələb edilib",
    ),
    PAYMENT_RECEIVED: t(
      "Payment received",
      "Платёж получен",
      "Ödəniş qəbul edildi",
    ),
    REVISED_PLAN_SENT: t(
      "Your payment plan was revised",
      "План оплаты обновлён",
      "Ödəniş planınız yenilənib",
    ),
    REFUND_UPDATED: t(
      "Refund status updated",
      "Статус возврата обновлён",
      "Geri ödəniş yenilənib",
    ),
  };
  const list = rows ?? [];
  const unread = list.filter((n) => !n.read_at).length;
  const shown = list.filter((n) => !onlyUnread || !n.read_at).slice(0, 200);
  const when = (iso: string) => {
    const x = ago(iso);
    if (x.unit === "now") return t("Just now", "Только что", "İndicə");
    if (x.unit === "min")
      return t(x.n + " min ago", x.n + " мин назад", x.n + " dəq əvvəl");
    if (x.unit === "hour")
      return t(x.n + " h ago", x.n + " ч назад", x.n + " saat əvvəl");
    return new Date(iso).toLocaleDateString(l, {
      day: "numeric",
      month: "short",
    });
  };
  const groupName: Record<Group, string> = {
    today: t("Today", "Сегодня", "Bu gün"),
    yesterday: t("Yesterday", "Вчера", "Dünən"),
    earlier: t("Earlier", "Ранее", "Əvvəl"),
  };
  const groups = (["today", "yesterday", "earlier"] as Group[])
    .map((g) => ({
      g,
      items: shown.filter((n) => dayGroup(n.created_at) === g),
    }))
    .filter((x) => x.items.length);

  function target(n: Notice) {
    const id = n.booking_id!;
    return n.event === "TRAVEL_DOCUMENT_PUBLISHED"
      ? { pathname: "/documents" as const, params: { booking: id } }
      : n.event.includes("CONTRACT")
        ? { pathname: "/trip/contract" as const, params: { id } }
        : n.event.includes("AMENDMENT")
          ? { pathname: "/trip/changes" as const, params: { id } }
          : n.event.includes("REFUND")
            ? { pathname: "/trip/refunds" as const, params: { id } }
            : n.event.includes("PAYMENT")
              ? { pathname: "/trip/payments" as const, params: { id } }
              : { pathname: "/trip/[id]" as const, params: { id } };
  }
  // Marks it read at once on screen and goes to the journey; the server catches up in the background.
  async function open(n: Notice) {
    if (!n.read_at)
      setRows((old) =>
        (old ?? []).map((x) =>
          x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x,
        ),
      );
    if (n.booking_id) router.push(target(n));
    if (n.read_at) return;
    try {
      await request("bookings/notifications/" + n.id + "/read", {}, token);
    } catch {
      setMessage(
        t(
          "Could not mark as read.",
          "Не удалось отметить прочитанным.",
          "Oxunmuş kimi qeyd edilmədi.",
        ),
      );
      void load();
    }
  }
  async function markAll() {
    setBusy(true);
    setRows((old) =>
      (old ?? []).map((x) => ({
        ...x,
        read_at: x.read_at ?? new Date().toISOString(),
      })),
    );
    try {
      await request("bookings/notifications/read-all", {}, token);
    } catch {
      setMessage(
        t(
          "Could not update notifications.",
          "Не удалось обновить.",
          "Bildirişlər yenilənmədi.",
        ),
      );
      void load();
    } finally {
      setBusy(false);
    }
  }
  async function togglePush() {
    setBusy(true);
    setMessage("");
    try {
      const Notifications = await import("expo-notifications");
      if (push) {
        await request(
          "bookings/notifications/push-token",
          { token: push, enabled: false },
          token,
        );
        setPush(null);
        await SecureStore.deleteItemAsync("azertur_push_session");
        setMessage(
          t(
            "Push notifications disabled.",
            "Push отключены.",
            "Push bildirişləri bağlanıb.",
          ),
        );
        return;
      }
      if (Platform.OS === "android")
        await Notifications.setNotificationChannelAsync("default", {
          name: "Journey updates",
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      const permission = await Notifications.requestPermissionsAsync();
      if (!permission.granted) {
        setMessage(
          t(
            "Notification permission was not granted.",
            "Разрешение не предоставлено.",
            "Bildiriş icazəsi verilməyib.",
          ),
        );
        return;
      }
      const value = (await Notifications.getExpoPushTokenAsync({ projectId }))
        .data;
      await request(
        "bookings/notifications/push-token",
        { token: value, enabled: true },
        token,
      );
      setPush(value);
      await SecureStore.setItemAsync(
        "azertur_push_session",
        JSON.stringify({ session: token, expo: value }),
      );
      setMessage(
        t(
          "Push notifications enabled for this session.",
          "Push включены для этой сессии.",
          "Bu sessiya üçün push bildirişləri aktivdir.",
        ),
      );
    } catch {
      setMessage(
        t(
          "Push could not be enabled. Try again or contact our team.",
          "Не удалось включить push. Повторите попытку или свяжитесь с нами.",
          "Push aktiv olmadı. Yenidən yoxlayın və ya komandamızla əlaqə saxlayın.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  const pushOff = busy || !projectId || Platform.OS === "web";
  const half = Math.max(0, (segmentWidth - 8) / 2);
  return (
    <View style={styles.box}>
      <View style={styles.head}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.title}>
            {t("Notifications", "Уведомления", "Bildirişlər")}
          </Text>
          <Text style={styles.sub}>
            {unread
              ? t(unread + " new", unread + " новых", unread + " yeni")
              : t("You are all caught up", "Всё прочитано", "Hamısı oxunub")}
          </Text>
        </View>
        <IconButton
          icon="refresh"
          label={t("Refresh updates", "Обновить", "Yenilikləri yenilə")}
          onPress={() => void load()}
          disabled={loading}
          spinning={loading}
          reduced={reduced}
        />
        <IconButton
          icon="checkmark-done"
          label={t("Mark all read", "Прочитать все", "Hamısını oxunmuş et")}
          onPress={() => void markAll()}
          disabled={busy || !unread}
          reduced={reduced}
        />
      </View>

      <View
        style={styles.segment}
        onLayout={(e) => setSegmentWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View
          style={[
            styles.pill,
            {
              width: half,
              transform: [
                {
                  translateX: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, half],
                  }),
                },
              ],
            },
          ]}
        />
        {(
          [
            [false, t("All", "Все", "Hamısı"), list.length],
            [true, t("Unread", "Непрочитанные", "Oxunmamış"), unread],
          ] as [boolean, string, number][]
        ).map(([only, label, count]) => (
          <Pressable
            key={String(only)}
            accessibilityRole="tab"
            accessibilityState={{ selected: onlyUnread === only }}
            onPress={() => setOnlyUnread(only)}
            style={styles.segmentItem}
          >
            <Text
              style={[
                styles.segmentText,
                onlyUnread === only && styles.segmentOn,
              ]}
            >
              {label} {count}
            </Text>
          </Pressable>
        ))}
      </View>

      {!!message && (
        <View accessibilityRole="alert" style={styles.notice}>
          <Ionicons
            name="alert-circle-outline"
            size={20}
            color={colors.danger}
          />
          <Text style={styles.noticeText}>{message}</Text>
        </View>
      )}

      {rows === null && <Skeleton reduced={reduced} />}

      {groups.map(({ g, items }) => (
        <View key={g} style={{ gap: 10 }}>
          <Text style={styles.group}>{groupName[g]}</Text>
          {items.map((n, i) => (
            <NoticeCard
              key={n.id}
              event={n.event}
              title={
                labels[n.event] ||
                t(
                  "Your journey has an update",
                  "Поездка обновлена",
                  "Səfərinizdə yenilik var",
                )
              }
              meta={
                when(n.created_at) +
                (n.booking_id ? ", #" + n.booking_id.slice(0, 8) : "")
              }
              read={!!n.read_at}
              index={i}
              reduced={reduced}
              disabled={busy}
              onPress={() => void open(n)}
            />
          ))}
        </View>
      ))}

      {rows !== null && !shown.length && (
        <View style={styles.empty}>
          <Floating
            icon={
              onlyUnread && list.length
                ? "checkmark-done-circle-outline"
                : "notifications-outline"
            }
            reduced={reduced}
          />
          <Text style={styles.emptyTitle}>
            {onlyUnread && list.length
              ? t("Nothing unread", "Нет непрочитанных", "Oxunmamış yoxdur")
              : t(
                  "Nothing new yet",
                  "Пока ничего нового",
                  "Hələ yenilik yoxdur",
                )}
          </Text>
          <Text style={styles.emptyText}>
            {onlyUnread && list.length
              ? t(
                  "You have read everything. Nice and tidy.",
                  "Вы прочитали всё.",
                  "Hamısını oxumusan.",
                )
              : t(
                  "Your journey updates will appear here.",
                  "Здесь появятся обновления поездок.",
                  "Səfər yenilikləri burada görünəcək.",
                )}
          </Text>
          {!list.length && (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/")}
              style={styles.emptyButton}
            >
              <Ionicons name="compass-outline" size={20} color={colors.white} />
              <Text style={styles.emptyButtonText}>
                {t("Explore journeys", "Смотреть поездки", "Səfərlərə bax")}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      <View style={styles.pushCard}>
        <View style={[styles.pushIcon, push && { backgroundColor: "#E1F1E7" }]}>
          <Ionicons
            name={
              (push ? "notifications" : "notifications-off-outline") as never
            }
            size={22}
            color={push ? "#2F7A4F" : colors.ink}
          />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.pushTitle}>
            {t("Push notifications", "Push-уведомления", "Push bildirişləri")}
          </Text>
          <Text style={styles.pushText}>
            {Platform.OS === "web"
              ? t(
                  "Available in the phone app.",
                  "Доступно в приложении на телефоне.",
                  "Telefon tətbiqində mövcuddur.",
                )
              : !projectId
                ? t(
                    "Not available yet. Updates here still work.",
                    "Пока недоступно. Обновления здесь работают.",
                    "Hələ aktiv deyil. Yeniliklər burada işləyir.",
                  )
                : push
                  ? t(
                      "On for this session",
                      "Включены для этой сессии",
                      "Bu sessiya üçün aktivdir",
                    )
                  : t(
                      "Get journey updates on your phone",
                      "Обновления поездок на телефон",
                      "Səfər yeniliklərini telefonuna al",
                    )}
          </Text>
        </View>
        <Switch
          accessibilityLabel={
            push
              ? t(
                  "Disable push notifications",
                  "Отключить push",
                  "Push bildirişlərini bağla",
                )
              : t(
                  "Enable push notifications",
                  "Включить push",
                  "Push bildirişlərini aktivləşdir",
                )
          }
          value={!!push}
          disabled={pushOff}
          onValueChange={() => void togglePush()}
          trackColor={{ false: "#D8DDD5", true: colors.ink }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 18, paddingVertical: 8 },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontFamily: heading,
    fontWeight: "700",
    color: colors.ink,
  },
  sub: { fontFamily: "Inter", fontSize: 14, color: colors.muted },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  iconPressed: { backgroundColor: "#EAF0EA" },
  iconOff: { opacity: 0.4 },
  segment: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 24,
    backgroundColor: "#ECEFE8",
  },
  pill: {
    position: "absolute",
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: 20,
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  segmentItem: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentText: { fontFamily: "Inter", fontSize: 14, color: colors.muted },
  segmentOn: { fontFamily: "InterSemi", color: colors.ink },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#F6E0DB",
  },
  noticeText: {
    flex: 1,
    fontFamily: "Inter",
    fontSize: 14,
    color: colors.danger,
  },
  group: {
    fontFamily: "InterSemi",
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.muted,
  },
  skeleton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  skeletonIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E6EBE4",
  },
  skeletonLine: { height: 14, borderRadius: 7, backgroundColor: "#E6EBE4" },
  empty: { alignItems: "center", gap: 10, paddingVertical: 28 },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6EEE8",
  },
  emptyTitle: {
    fontFamily: "InterSemi",
    fontSize: 20,
    color: colors.ink,
    marginTop: 6,
  },
  emptyText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    maxWidth: 280,
  },
  emptyButton: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 22,
    borderRadius: 24,
    backgroundColor: colors.ink,
  },
  emptyButtonText: {
    fontFamily: "InterSemi",
    fontSize: 15,
    color: colors.white,
  },
  pushCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  pushIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6EEE8",
  },
  pushTitle: { fontFamily: "InterSemi", fontSize: 15, color: colors.ink },
  pushText: { fontFamily: "Inter", fontSize: 13, color: colors.muted },
});
