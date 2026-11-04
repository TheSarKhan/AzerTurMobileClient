import React from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { Page, s, Button } from "../design/ui";
import { useDiscovery } from "../state/discovery";
export default function Help() {
  const { t } = useDiscovery();
  return (
    <Page back title={t("Help & contact", "Помощь", "Kömək və əlaqə")}>
      <Text style={s.title}>
        {t(
          "Here for your journey.",
          "Рядом в вашей поездке.",
          "Səfərinizdə yanınızdayıq.",
        )}
      </Text>
      <Text style={s.body}>
        {t(
          "For changes, open your journey and send a request to the office. Each service has its own cancellation terms.",
          "Для изменений откройте поездку и отправьте запрос в офис. У каждой услуги свои условия отмены.",
          "Dəyişiklik üçün səfərinizi açıb ofisə sorğu göndərin. Hər xidmətin ayrıca ləğv şərtləri var.",
        )}
      </Text>
      <Button onPress={() => router.push("/trips")}>
        {t("Open my trips", "Мои поездки", "Səfərlərimə bax")}
      </Button>
      <Text style={s.muted}>
        {t(
          "Supplier instructions and available contact details are shown with the original travel document.",
          "Инструкции и доступные контакты поставщика указаны в оригинале документа.",
          "Təchizatçının təlimatları və mövcud əlaqə məlumatları orijinal sənəddədir.",
        )}
      </Text>
    </Page>
  );
}
