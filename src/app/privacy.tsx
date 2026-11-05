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
      <Text style={s.body}>
        {t(
          'Events: if you tap "Near me", the app asks for your approximate location, rounds it to about 1 km and sends it only to find nearby events. We do not store it or link it to your account. You can pick a city instead.',
          "События: если нажать «Рядом со мной», приложение запросит примерное местоположение, округлит его до ~1 км и отправит только для поиска событий. Мы не сохраняем его и не связываем с аккаунтом. Можно выбрать город.",
          "Tədbirlər: «Yaxınlıqda» düyməsini bassanız, tətbiq təxmini məkanı soruşur, ~1 km-ə yuvarlaqlaşdırır və yalnız yaxın tədbirləri tapmaq üçün göndərir. Onu saxlamırıq və hesabınıza bağlamırıq. Şəhər də seçə bilərsiniz.",
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
