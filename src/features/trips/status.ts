import type { Booking } from "../../api/client";

type Pick = (en: string, ru: string, az: string) => string;

/** The one-line state of a journey, the same words on My trips and on Explore. */
export function tripStatus(b: Booking, hasOffer: boolean, t: Pick) {
  if (hasOffer && b.status === "PENDING_REVIEW")
    return t(
      "Offer ready — open journey",
      "Предложение готово — откройте поездку",
      "Təklif hazırdır — səfərə baxın",
    );
  if (b.status === "PENDING_REVIEW")
    return t("Request under review", "Запрос на проверке", "Sorğu yoxlanılır");
  if (b.status === "CONFIRMED")
    return t("Confirmed journey", "Поездка подтверждена", "Səfər təsdiqlənib");
  if (b.status === "CANCELLED")
    return t("Cancelled", "Отменено", "Ləğv edilib");
  if (b.status === "REJECTED")
    return t("Not approved", "Не одобрено", "Təsdiqlənməyib");
  return t(
    "Open journey for the next step",
    "Откройте поездку",
    "Növbəti addım üçün səfərə baxın",
  );
}
