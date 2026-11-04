export function documentStatus(
  status: string,
  t: (en: string, ru: string, az: string) => string,
) {
  return (
    {
      UPCOMING: t("Upcoming", "Предстоящий", "Yaxınlaşan"),
      ACTIVE: t("Active", "Активный", "Aktiv"),
      EXPIRED: t("Expired", "Истёк срок", "Müddəti bitib"),
      SUPERSEDED: t(
        "Replaced — invalid",
        "Заменён — недействителен",
        "Əvəz edilib — etibarsızdır",
      ),
      REVOKED: t(
        "Revoked — invalid",
        "Отозван — недействителен",
        "Geri götürülüb — etibarsızdır",
      ),
      CANCELLED: t("Cancelled", "Отменён", "Ləğv edilib"),
      REQUIRES_REVIEW: t(
        "Journey changed — office review needed",
        "Поездка изменена — нужна проверка офиса",
        "Səfər dəyişib — ofis yoxlaması lazımdır",
      ),
      DRAFT: t("Draft", "Черновик", "Qaralama"),
    }[status] ||
    t("Check with the office", "Уточните в офисе", "Ofislə dəqiqləşdirin")
  );
}
export function documentKind(
  kind: string,
  t: (en: string, ru: string, az: string) => string,
) {
  return (
    {
      E_TICKET: t("E-ticket", "Электронный билет", "Elektron bilet"),
      BOARDING_PASS: t("Boarding pass", "Посадочный талон", "Minik talonu"),
      HOTEL_VOUCHER: t("Hotel voucher", "Ваучер отеля", "Otel vauçeri"),
      TRANSFER_VOUCHER: t(
        "Transfer voucher",
        "Ваучер трансфера",
        "Transfer vauçeri",
      ),
      TOUR_VOUCHER: t("Tour voucher", "Ваучер тура", "Tur vauçeri"),
      OTHER: t("Travel document", "Проездной документ", "Səfər sənədi"),
    }[kind] || t("Travel document", "Проездной документ", "Səfər sənədi")
  );
}
