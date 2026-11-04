import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, heading } from "../../design/theme";
import { request, type Customer, type Locale } from "../../api/client";
type Session = {
  id: string;
  device: string;
  last_seen_at: string;
  current: boolean;
};
export default function AccountSecurity({
  token,
  customer,
  locale: l,
  onSignedOut,
}: {
  token: string;
  customer: Customer;
  locale: Locale;
  onSignedOut: () => Promise<void>;
}) {
  const t = (en: string, ru: string, az: string) =>
    l === "az" ? az : l === "ru" ? ru : en;
  const [sessions, setSessions] = useState<Session[]>([]),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const load = () =>
    request<Session[]>("auth/sessions", undefined, token).then(setSessions);
  useEffect(() => {
    load().catch(() =>
      setError(
        t(
          "Could not load sessions.",
          "Сеансы не загружены.",
          "Sessiyalar yüklənmədi.",
        ),
      ),
    );
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps
  async function act(path: string) {
    setBusy(true);
    setError("");
    try {
      await request(path, {}, token);
      if (path === "auth/logout-all") await onSignedOut();
      else {
        await load();
        setNotice(
          path.includes("verification")
            ? t(
                "Check your email and spam folder, then refresh your account.",
                "Проверьте почту и спам, затем обновите аккаунт.",
                "Email və spam qovluğunu yoxla, sonra hesabı yenilə.",
              )
            : t(
                "Sessions updated.",
                "Сеансы обновлены.",
                "Sessiyalar yeniləndi.",
              ),
        );
      }
    } catch {
      setError(
        t(
          "Action unavailable. Try again later.",
          "Не удалось. Повторите позже.",
          "Əməliyyat alınmadı. Sonra yenidən yoxla.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  const button = (label: string, fn: () => void) => (
    <Pressable
      accessibilityRole="button"
      disabled={busy}
      style={s.button}
      onPress={fn}
    >
      <Text style={s.buttonText}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={s.card}>
      <Text style={s.title}>
        {t("Account security", "Безопасность аккаунта", "Hesab təhlükəsizliyi")}
      </Text>
      <Text>
        {customer.emailVerified
          ? t("Email verified", "Email подтверждён", "Email təsdiqlənib")
          : t(
              "Verify email before sending requests or accepting proposals.",
              "Подтвердите email для запросов и согласования.",
              "Sorğu və təklifləri təsdiqləmək üçün emaili təsdiqlə.",
            )}
      </Text>
      {!customer.emailVerified &&
        button(
          t(
            "Send verification email",
            "Отправить письмо",
            "Təsdiq emaili göndər",
          ),
          () => void act("auth/email-verification/request"),
        )}
      <Text style={s.title}>{t("Password", "Пароль", "Şifrə")}</Text>
      {button(
        t(
          "Send password reset link",
          "Отправить ссылку сброса",
          "Şifrə yeniləmə keçidi göndər",
        ),
        () =>
          void (async () => {
            setBusy(true);
            setError("");
            try {
              await request("auth/forgot-password", { email: customer.email });
              setNotice(
                t(
                  "Check your email. Resetting your password signs out all devices.",
                  "Проверьте почту. Сброс пароля завершит все сеансы.",
                  "Emailinizi yoxlayın. Şifrə yenilənəndə bütün cihazlardan çıxış edilir.",
                ),
              );
            } catch {
              setError(
                t(
                  "Try again later.",
                  "Повторите позже.",
                  "Sonra yenidən yoxlayın.",
                ),
              );
            } finally {
              setBusy(false);
            }
          })(),
      )}
      <Text style={s.title}>
        {t("Active sessions", "Активные сеансы", "Aktiv sessiyalar")}
      </Text>
      {sessions.map((x) => (
        <View style={s.session} key={x.id}>
          <Text>
            {x.device}{" "}
            {x.current
              ? t("· This device", "· Это устройство", "· Bu cihaz")
              : ""}
          </Text>
          <Text>{new Date(x.last_seen_at).toLocaleString(l)}</Text>
          {!x.current &&
            button(
              t("Revoke session", "Завершить сеанс", "Sessiyanı bağla"),
              () => void act("auth/sessions/" + x.id + "/revoke"),
            )}
        </View>
      ))}
      {button(
        t(
          "Sign out other devices",
          "Выйти на других устройствах",
          "Digər cihazlardan çıx",
        ),
        () => void act("auth/sessions/revoke-others"),
      )}
      {button(
        t("Sign out everywhere", "Выйти везде", "Bütün cihazlardan çıx"),
        () => void act("auth/logout-all"),
      )}
      {!!notice && <Text accessibilityLiveRegion="polite">{notice}</Text>}
      {!!error && <Text accessibilityRole="alert">{error}</Text>}
    </View>
  );
}
const s = StyleSheet.create({
  card: { gap: 16, marginTop: 24 },
  title: {
    fontSize: 27,
    fontFamily: heading,
    fontWeight: "600",
    color: colors.ink,
  },
  button: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#a7bbb2",
    borderRadius: 9,
    marginVertical: 8,
  },
  buttonText: { color: colors.ink, fontFamily: "InterSemi", fontWeight: "600" },
  session: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#dfe5df",
    gap: 8,
  },
});
