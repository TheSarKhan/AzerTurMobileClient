import React, { useState } from "react";
import { View, Text } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { Page, s, Button } from "../../design/ui";
import { colors } from "../../design/theme";
import { useAccount } from "../../state/account";
import { useDiscovery } from "../../state/discovery";
import {
  SignedIn,
  Menu,
  Nav,
  Row,
  ErrorNotice,
} from "../../features/account/components";
export default function Account() {
  const a = useAccount(),
    { t, locale } = useDiscovery();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Page title={t("Your account", "Ваш аккаунт", "Hesabınız")}>
      <SignedIn>
        {a.customer && (
          <>
            <View style={[s.row, { paddingVertical: 14 }]}>
              <Feather name="user" size={45} color={colors.ink} />
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={s.h2}>{a.customer.name}</Text>
                <Text style={s.body}>{a.customer.email}</Text>
                <Text
                  style={[
                    s.body,
                    {
                      color: a.customer.emailVerified
                        ? colors.ink
                        : colors.accent,
                    },
                  ]}
                >
                  {a.customer.emailVerified
                    ? t(
                        "✓ Email verified",
                        "✓ Email подтверждён",
                        "✓ Email təsdiqlənib",
                      )
                    : t(
                        "Email verification needed",
                        "Подтвердите email",
                        "Email təsdiqi lazımdır",
                      )}
                </Text>
              </View>
            </View>
            {!a.customer.emailVerified && (
              <Button onPress={() => router.push("/verify-email")}>
                {t("Verify email", "Подтвердить email", "Emaili təsdiqlə")}
              </Button>
            )}
            <Menu>
              <Nav
                to="/documents"
                label={t(
                  "Tickets & documents",
                  "Билеты и документы",
                  "Biletlər və sənədlər",
                )}
              />
              <Nav
                to="/profile"
                label={t(
                  "Personal details",
                  "Личные данные",
                  "Şəxsi məlumatlar",
                )}
              />
              <Nav
                to="/security"
                label={t(
                  "Security & sessions",
                  "Безопасность и сеансы",
                  "Təhlükəsizlik və sessiyalar",
                )}
              />
              <Nav
                to="/notifications"
                label={t("Notifications", "Уведомления", "Bildirişlər")}
              />
            </Menu>
            <Menu>
              <Row
                label={t("Language", "Язык", "Dil")}
                value={
                  { en: "English", ru: "Русский", az: "Azərbaycanca" }[locale]
                }
                onPress={() => router.push("/preferences")}
              />
              <Nav
                to="/preferences"
                label={t("Currency preferences", "Валюта", "Valyuta seçimi")}
              />
            </Menu>
            <Menu>
              <Nav
                to="/help"
                label={t(
                  "Help & contact",
                  "Помощь и контакты",
                  "Kömək və əlaqə",
                )}
              />
              <Nav
                to="/privacy"
                label={t(
                  "Privacy & terms",
                  "Условия и конфиденциальность",
                  "Məxfilik və şərtlər",
                )}
              />
            </Menu>
            <ErrorNotice message={error} />
            <Button
              outline
              disabled={busy}
              onPress={async () => {
                setBusy(true);
                try {
                  await a.signOut();
                } catch {
                  setError(
                    t(
                      "Signed out on this device. Server sign-out could not be confirmed.",
                      "Вы вышли на этом устройстве. Серверный выход не подтверждён.",
                      "Bu cihazdan çıxış edildi. Serverdə çıxış təsdiqlənmədi.",
                    ),
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t("Sign out", "Выйти", "Çıxış")}
            </Button>
          </>
        )}
      </SignedIn>
    </Page>
  );
}
