import React, { useState } from "react";
import { Text, View, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Page, s, Button } from "../design/ui";
import { useDiscovery } from "../state/discovery";
import { useAccount } from "../state/account";
import { Field, ErrorNotice } from "../features/account/components";
import { ApiError, request } from "../api/client";
export default function Auth() {
  const { t, locale } = useDiscovery(),
    a = useAccount();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [register, setRegister] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [sent, setSent] = useState(false);
  const recover = mode === "recover";
  async function submit() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (recover) {
        await request("auth/forgot-password", { email: email.trim() });
        setSent(true);
      } else {
        await a.authenticate(register ? "register" : "login", {
          email: email.trim(),
          password,
          ...(register ? { name: name.trim(), locale } : {}),
        });
        router.replace("/account");
      }
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 429
          ? t(
              "Please wait before trying again.",
              "Подождите перед повторной попыткой.",
              "Yenidən cəhd etməzdən əvvəl gözləyin.",
            )
          : t(
              "Check your email and password. Registration needs a name and 12–72 character password.",
              "Проверьте email и пароль. Для регистрации нужны имя и пароль 12–72 символа.",
              "Email və şifrəni yoxlayın. Qeydiyyat üçün ad və 12–72 simvolluq şifrə lazımdır.",
            ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page back title={t("Your account", "Ваш аккаунт", "Hesabınız")}>
      <Text style={s.title}>
        {recover
          ? t("A fresh start.", "Начните заново.", "Yeni başlanğıc.")
          : register
            ? t(
                "Let the journey begin.",
                "Путешествие начинается.",
                "Səyahət başlasın.",
              )
            : t("Welcome back.", "С возвращением.", "Yenidən xoş gəldiniz.")}
      </Text>
      {mode === "reset-success" && (
        <Text accessibilityLiveRegion="polite" style={s.body}>
          {t(
            "Password updated. Sign in with your new password.",
            "Пароль обновлён. Войдите с новым паролем.",
            "Şifrə yeniləndi. Yeni şifrə ilə daxil olun.",
          )}
        </Text>
      )}
      <Text style={s.muted}>
        {recover
          ? t(
              "We will email you a secure password reset link.",
              "Мы отправим ссылку для сброса пароля.",
              "Şifrəni yeniləmək üçün təhlükəsiz keçid göndərəcəyik.",
            )
          : t(
              "Your Azerbaijan, all in one place.",
              "Ваш Азербайджан — в одном месте.",
              "Azərbaycan səyahətiniz bir yerdə.",
            )}
      </Text>
      {sent ? (
        <Text accessibilityLiveRegion="polite" style={s.body}>
          {t(
            "If this address has an account, a reset link will arrive by email. Check your spam folder too.",
            "Если аккаунт существует, ссылка придёт на почту. Проверьте спам.",
            "Bu ünvanda hesab varsa, yeniləmə keçidi emailə gələcək. Spam qovluğunu da yoxlayın.",
          )}
        </Text>
      ) : (
        <>
          <View style={{ gap: 18 }}>
            {register && !recover && (
              <Field
                label={t("Full name", "Имя и фамилия", "Ad və soyad")}
                value={name}
                onChangeText={setName}
                maxLength={100}
                autoComplete="name"
              />
            )}
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              maxLength={254}
            />
            {!recover && (
              <Field
                label={t("Password", "Пароль", "Şifrə")}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete={register ? "new-password" : "current-password"}
                maxLength={72}
              />
            )}
          </View>
          <ErrorNotice message={error} />
          <Button
            disabled={
              busy ||
              !email.trim() ||
              (!recover &&
                (!password ||
                  (register &&
                    (password.length < 12 || name.trim().length < 2))))
            }
            onPress={() => void submit()}
          >
            {busy
              ? t("Please wait…", "Подождите…", "Gözləyin…")
              : recover
                ? t(
                    "Send reset link",
                    "Отправить ссылку",
                    "Yeniləmə keçidi göndər",
                  )
                : register
                  ? t("Create account", "Создать аккаунт", "Hesab yarat")
                  : t("Sign in", "Войти", "Daxil ol")}
          </Button>
        </>
      )}
      {!recover && (
        <>
          <Button
            outline
            onPress={() => {
              setRegister(!register);
              setError("");
            }}
          >
            {register
              ? t(
                  "Already have an account? Sign in",
                  "Уже есть аккаунт? Войти",
                  "Hesabınız var? Daxil olun",
                )
              : t(
                  "New here? Create account",
                  "Впервые здесь? Регистрация",
                  "Yenisiniz? Hesab yaradın",
                )}
          </Button>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: "/auth", params: { mode: "recover" } })
            }
          >
            <Text
              style={[
                s.body,
                { textAlign: "center", textDecorationLine: "underline" },
              ]}
            >
              {t("Forgot password?", "Забыли пароль?", "Şifrəni unutmusunuz?")}
            </Text>
          </Pressable>
        </>
      )}
    </Page>
  );
}
