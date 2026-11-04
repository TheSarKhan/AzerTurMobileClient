import React, { useState } from "react";
import { Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Page, s, Button } from "../design/ui";
import { Field, ErrorNotice, useProblem } from "../features/account/components";
import { useDiscovery } from "../state/discovery";
import { useAccount } from "../state/account";
import { request } from "../api/client";
export default function Reset() {
  const { token } = useLocalSearchParams<{ token?: string }>(),
    { t } = useDiscovery(),
    a = useAccount(),
    problem = useProblem();
  const [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [error, setError] = useState("");
  return (
    <Page back>
      <Text style={s.title}>
        {t("A new beginning.", "Новое начало.", "Yeni başlanğıc.")}
      </Text>
      {done ? (
        <>
          <Text style={s.body}>
            {t(
              "Password updated. All sessions were signed out. Sign in with your new password.",
              "Пароль обновлён. Все сеансы завершены. Войдите с новым паролем.",
              "Şifrə yeniləndi. Bütün sessiyalar bağlandı. Yeni şifrə ilə daxil olun.",
            )}
          </Text>
          <Button onPress={() => router.replace("/auth")}>
            {t("Sign in", "Войти", "Daxil ol")}
          </Button>
        </>
      ) : (
        <>
          <Text style={s.muted}>
            {t(
              "Use the secure reset link from your email. Password: 12–72 characters.",
              "Откройте ссылку из письма. Пароль: 12–72 символа.",
              "Emaildəki təhlükəsiz keçiddən istifadə edin. Şifrə: 12–72 simvol.",
            )}
          </Text>
          <Field
            label={t("New password", "Новый пароль", "Yeni şifrə")}
            secureTextEntry
            autoComplete="new-password"
            maxLength={72}
            value={password}
            onChangeText={setPassword}
          />
          <Field
            label={t(
              "Confirm password",
              "Повторите пароль",
              "Şifrəni təkrar yazın",
            )}
            secureTextEntry
            autoComplete="new-password"
            maxLength={72}
            value={confirmation}
            onChangeText={setConfirmation}
          />
          <ErrorNotice message={error} />
          <Button
            disabled={
              busy ||
              !token ||
              password.length < 12 ||
              password !== confirmation
            }
            onPress={async () => {
              setBusy(true);
              setError("");
              try {
                await request("auth/reset-password", {
                  token,
                  password,
                  confirmation,
                });
                await a.forget();
                router.replace({
                  pathname: "/auth",
                  params: { mode: "reset-success" },
                });
                setDone(true);
                setPassword("");
                setConfirmation("");
              } catch {
                setError(problem());
              } finally {
                setBusy(false);
              }
            }}
          >
            {t("Update password", "Обновить пароль", "Şifrəni yenilə")}
          </Button>
          {!token && (
            <Text style={s.muted}>
              {t(
                "Open this screen from the reset email.",
                "Откройте экран из письма.",
                "Bu ekranı yeniləmə emailindən açın.",
              )}
            </Text>
          )}
        </>
      )}
    </Page>
  );
}
