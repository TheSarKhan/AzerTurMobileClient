import { useLocalSearchParams } from "expo-router";
import { request } from "../api/client";
import React, { useState } from "react";
import { Text } from "react-native";
import { Page, s, Button } from "../design/ui";
import { useAccount } from "../state/account";
import { useDiscovery } from "../state/discovery";
import {
  SignedIn,
  ErrorNotice,
  useProblem,
} from "../features/account/components";
export default function Verify() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const a = useAccount(),
    { t } = useDiscovery(),
    problem = useProblem();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  return (
    <Page back>
      <SignedIn>
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
        {token && !a.customer?.emailVerified && (
          <Button
            disabled={busy}
            onPress={async () => {
              setBusy(true);
              setError("");
              try {
                await request("auth/verify-email", { token });
                await a.refresh();
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
        <Button
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
        </Button>
        {!a.customer?.emailVerified && (
          <Button
            outline
            disabled={busy}
            onPress={async () => {
              setBusy(true);
              setError("");
              try {
                await a.call("auth/email-verification/request", {});
                setMessage(
                  t(
                    "Verification email requested.",
                    "Письмо запрошено.",
                    "Təsdiq emaili istənildi.",
                  ),
                );
              } catch {
                setError(problem());
              } finally {
                setBusy(false);
              }
            }}
          >
            {t("Resend email", "Отправить повторно", "Yenidən göndər")}
          </Button>
        )}
      </SignedIn>
    </Page>
  );
}
