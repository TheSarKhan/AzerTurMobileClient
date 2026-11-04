import React from "react";
import { Text } from "react-native";
import { Page, s } from "../design/ui";
import { useAccount } from "../state/account";
import { useDiscovery } from "../state/discovery";
import { SignedIn, Menu } from "../features/account/components";
export default function Profile() {
  const { customer } = useAccount(),
    { t } = useDiscovery();
  return (
    <Page
      back
      title={t("Personal details", "Личные данные", "Şəxsi məlumatlar")}
    >
      <SignedIn>
        <Text style={s.title}>
          {t("Your details.", "Ваши данные.", "Məlumatlarınız.")}
        </Text>
        <Menu>
          <Text style={[s.body, { padding: 20 }]}>
            {customer?.name}
            {"\n"}
            {customer?.email}
          </Text>
        </Menu>
        <Text style={s.muted}>
          {t(
            "Contact the office if your details need correcting. Passenger details must match the original travel document.",
            "Для исправления данных обратитесь в офис. Данные пассажира должны совпадать с документом.",
            "Düzəliş üçün ofislə əlaqə saxlayın. Sərnişin məlumatları orijinal sənədlə uyğun olmalıdır.",
          )}
        </Text>
      </SignedIn>
    </Page>
  );
}
