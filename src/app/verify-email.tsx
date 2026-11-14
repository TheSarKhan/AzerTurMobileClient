import { useAccountLinkToken } from "../features/account/link-token";
import { ApiError, request } from "../api/client";
import React, { useState } from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";
import { Page, s, Button } from "../design/ui";
import { useAccount } from "../state/account";
import { useDiscovery } from "../state/discovery";
import {
  ErrorNotice,
  useProblem,
  useResendCooldown,
} from "../features/account/components";
export default function Verify() {
  const token = useAccountLinkToken();
  const a = useAccount(),
    { t } = useDiscovery(),
    problem = useProblem(),
    router = useRouter(),
    cooldown = useResendCooldown();
  const [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  return (
    <Page back>
      <>
        <Text style={s.title}>
          {t("Check your inbox.", "Проверьте почту.", "Emailinizi yoxlayın.")}
        </Text>
        <Text style={s.body}>{a.customer?.email}</Text>
        <Text style={s.muted}>
          {t(
            "Open the verification link in your email, then return and refresh. Check spam as well.",
            "Откройте ссылку из письма, затем вернитесь и обновите. Проверьте спам.",
            "Emaildəki təsdiq keçidini açın, sonra qayıdıb yeniləyin. Spamı da yoxlayın.",
          )}
        </Text>
        <Text accessibilityLiveRegion="polite" style={s.body}>
          {a.customer?.emailVerified
            ? t(
                "Email verified. You can now send requests.",
                "Email подтверждён. Теперь можно отправлять запросы.",
                "Email təsdiqlənib. Sorğu göndərə bilərsiniz.",
              )
            : message}
        </Text>
        <ErrorNotice message={error} />
        {token && !a.customer?.emailVerified && !done && (
          <Button
            disabled={busy}
            onPress={async () => {
              setBusy(true);
              setError("");
              try {
                await request("auth/verify-email", { token });
                setDone(true);
                setError("");
                if (a.customer) await a.refresh();
                setMessage(t("Email verified. Sign in to continue.", "Email подтверждён. Войдите, чтобы продолжить.", "Email təsdiqləndi. Davam etmək üçün daxil olun."));
              } catch {
                setError(problem());
              } finally {
                setBusy(false);
              }
            }}
          >
            {t(
              "Verify with email link",
              "Подтвердить по ссылке",
              "Email keçidi ilə təsdiqlə",
            )}
          </Button>
        )}
        {done && !a.customer && (
          <Button onPress={() => router.push("/account")}>
            {t("Sign in", "Войти", "Daxil ol")}
          </Button>
        )}
        {a.customer && !a.customer.emailVerified && <Button
          disabled={busy}
          onPress={async () => {
            setBusy(true);
            try {
              await a.refresh();
            } finally {
              setBusy(false);
            }
          }}
        >
          {t(
            "I verified — refresh",
            "Я подтвердил — обновить",
            "Təsdiqlədim — yenilə",
          )}
        </Button>}
        {a.customer && !a.customer.emailVerified && (
          <Button
            outline
            disabled={busy || cooldown.seconds > 0}
            onPress={async () => {
              setBusy(true);
              setError("");
              try {
                await a.call("auth/email-verification/request", {});
                cooldown.start();
                setMessage(
                  t(
                    "Verification email requested.",
                    "Письмо запрошено.",
                    "Təsdiq emaili istənildi.",
                  ),
                );
              } catch (e) {
                if (e instanceof ApiError && e.status === 429) {
                  cooldown.start();
                  setError(
                    t(
                      "A verification email was just sent. You can request another in a minute.",
                      "Письмо только что отправлено. Новое можно запросить через минуту.",
                      "Təsdiq emaili indicə göndərilib. Yenisini bir dəqiqədən sonra istəyə bilərsən.",
                    ),
                  );
                } else setError(problem());
              } finally {
                setBusy(false);
              }
            }}
          >
            {cooldown.seconds > 0
              ? t(
                  `Send again in ${cooldown.seconds} s`,
                  `Повторно через ${cooldown.seconds} с`,
                  `${cooldown.seconds} san. sonra yenidən göndər`,
                )
              : t("Resend email", "Отправить повторно", "Yenidən göndər")}
          </Button>
        )}
      </>
    </Page>
  );
}
