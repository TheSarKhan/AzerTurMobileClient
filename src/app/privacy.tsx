import React from "react";
import { Text } from "react-native";
import { Page, s } from "../design/ui";
import { useDiscovery } from "../state/discovery";
export default function Privacy() {
  const { t } = useDiscovery();
  return (
    <Page
      back
      title={t(
        "Privacy & terms",
        "Условия и конфиденциальность",
        "Məxfilik və şərtlər",
      )}
    >
      <Text style={s.title}>
        {t("Your information.", "Ваши данные.", "Məlumatlarınız.")}
      </Text>
      <Text style={s.body}>
        {t(
          "Your signed-in account gives access to your own journeys and documents. Optional offline documents are encrypted on this device and removed on sign-out. Exported or shared copies leave the app’s protected storage.",
          "Аккаунт открывает ваши поездки и документы. Офлайн-копии зашифрованы и удаляются при выходе. Экспортированные копии находятся вне защищённого хранилища приложения.",
          "Hesabınız yalnız öz səfər və sənədlərinizə giriş verir. Oflayn nüsxələr cihazda şifrələnir və çıxışda silinir. Paylaşılmış nüsxələr tətbiqin qorunan yaddaşından kənara çıxır.",
        )}
      </Text>
      <Text style={s.muted}>
        {t(
          "The current journey contract contains the specific service, payment and cancellation terms. The office will provide the full company privacy policy before public release.",
          "Условия услуг, оплаты и отмены указаны в договоре. Полная политика конфиденциальности будет предоставлена офисом до запуска.",
          "Xidmət, ödəniş və ləğv şərtləri cari səfər müqaviləsindədir. Tam məxfilik siyasətini ofis açıq istifadədən əvvəl təqdim edəcək.",
        )}
      </Text>
    </Page>
  );
}
