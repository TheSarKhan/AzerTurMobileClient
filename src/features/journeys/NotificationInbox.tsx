import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { request, type Locale } from "../../api/client";
type Notice = {
  id: string;
  booking_id: string | null;
  event: string;
  read_at: string | null;
  created_at: string;
};
export default function NotificationInbox({
  token,
  locale: l,
}: {
  token: string;
  locale: Locale;
}) {
  const t = (en: string, ru: string, az: string) =>
    l === "az" ? az : l === "ru" ? ru : en;
  const [rows, setRows] = useState<Notice[]>([]),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [push, setPush] = useState<string | null>(null);
  const projectId =
    Constants.easConfig?.projectId ||
    Constants.expoConfig?.extra?.eas?.projectId ||
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  async function load() {
    try {
      setRows(
        (
          await request<{ items: Notice[] }>(
            "bookings/notifications",
            undefined,
            token,
          )
        ).items,
      );
    } catch {
      setMessage(
        t(
          "Could not load notifications.",
          "Не удалось загрузить уведомления.",
          "Bildirişlər yüklənmədi.",
        ),
      );
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
  const labels: Record<string, string> = {
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
  return (
    <View style={s.box}>
      <Text style={s.title}>
        {t("Notifications", "Уведомления", "Bildirişlər")}
      </Text>
      <Pressable
        accessibilityRole="button"
        style={s.button}
        disabled={busy}
        onPress={() => void load()}
      >
        <Text>{t("Refresh updates", "Обновить", "Yenilikləri yenilə")}</Text>
      </Pressable>
      {message && <Text accessibilityRole="alert">{message}</Text>}
      {rows.slice(0, 20).map((n) => (
        <Pressable
          accessibilityRole="button"
          key={n.id}
          style={[s.item, !n.read_at && s.unread]}
          disabled={busy}
          onPress={async () => {
            setBusy(true);
            try {
              await request(
                "bookings/notifications/" + n.id + "/read",
                {},
                token,
              );
              await load();
            } catch {
              setMessage(
                t(
                  "Could not mark as read.",
                  "Не удалось отметить прочитанным.",
                  "Oxunmuş kimi qeyd edilmədi.",
                ),
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <Text style={s.label}>
            {labels[n.event] ||
              t(
                "Your journey has an update",
                "Поездка обновлена",
                "Səfərinizdə yenilik var",
              )}
          </Text>
          <Text>
            {new Date(n.created_at).toLocaleString(l)} · #
            {n.booking_id?.slice(0, 8)}
          </Text>
          <Text>
            {n.read_at
              ? t("Read", "Прочитано", "Oxunub")
              : t(
                  "Tap to mark as read",
                  "Нажмите, чтобы прочитать",
                  "Oxunmuş etmək üçün toxunun",
                )}
          </Text>
        </Pressable>
      ))}
      {!rows.length && (
        <Text>
          {t(
            "Your journey updates will appear here.",
            "Здесь появятся обновления поездок.",
            "Səfər yenilikləri burada görünəcək.",
          )}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        style={s.button}
        disabled={busy || !projectId || Platform.OS === "web"}
        onPress={async () => {
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
            const value = (
              await Notifications.getExpoPushTokenAsync({ projectId })
            ).data;
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
        }}
      >
        <Text>
          {push
            ? t(
                "Disable push notifications",
                "Отключить push",
                "Push bildirişlərini bağla",
              )
            : t(
                "Enable push notifications",
                "Включить push",
                "Push bildirişlərini aktivləşdir",
              )}
        </Text>
      </Pressable>
      {!projectId && (
        <Text>
          {t(
            "Push notifications are not available yet. In-app updates work here.",
            "Push пока недоступны. Обновления внутри приложения работают.",
            "Push hələ aktiv deyil. Tətbiqdaxili bildirişlər burada işləyir.",
          )}
        </Text>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  box: { gap: 12, paddingVertical: 20 },
  title: { fontSize: 22, fontWeight: "700", color: "#1b392a" },
  button: {
    padding: 13,
    borderWidth: 1,
    borderColor: "#cbd6c7",
    borderRadius: 4,
    alignItems: "center",
  },
  item: { padding: 14, borderBottomWidth: 1, borderColor: "#d7dfd1", gap: 8 },
  unread: { backgroundColor: "#edf3e8" },
  label: { fontWeight: "600", fontSize: 15 },
});
