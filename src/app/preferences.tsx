import React from "react";
import { Text, View } from "react-native";
import { Page, s, Button } from "../design/ui";
import { useDiscovery } from "../state/discovery";
export default function Preferences() {
  const { t, locale, setLocale } = useDiscovery();
  return (
    <Page back title={t("Preferences", "Настройки", "Seçimlər")}>
      <Text style={s.title}>
        {t("Make it yours.", "По вашему вкусу.", "Sizə uyğun.")}
      </Text>
      <Text style={s.h2}>{t("Language", "Язык", "Dil")}</Text>
      <View style={{ gap: 10 }}>
        {(["en", "ru", "az"] as const).map((l) => (
          <Button key={l} outline={locale !== l} onPress={() => setLocale(l)}>
            {{ en: "English", ru: "Русский", az: "Azərbaycanca" }[l]}
          </Button>
        ))}
      </View>
      <Text style={s.h2}>{t("Currency", "Валюта", "Valyuta")}</Text>
      <Text style={s.body}>EUR · USD · AZN</Text>
      <Text style={s.muted}>
        {t(
          "Choose the estimate currency when planning a journey. Offers, payment requests and receipts retain their actual currency; changing language never converts a charge.",
          "Выберите валюту расчёта при планировании. Предложения и оплаты сохраняют исходную валюту.",
          "Səfər planında hesablamanın valyutasını seçin. Təklif və ödənişlər öz faktiki valyutasında qalır; dil seçimi məbləği çevirmir.",
        )}
      </Text>
    </Page>
  );
}
