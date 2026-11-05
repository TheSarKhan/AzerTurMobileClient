import { request } from "../../api/client";
export type EventView = {
  slug: string;
  titleEn: string;
  titleRu: string;
  titleAz: string;
  category: string;
  citySlug: string;
  cityNameEn: string;
  cityNameRu: string;
  cityNameAz: string;
  venueName: string;
  startsAt: string;
  endsAt: string;
  timeKnown: boolean;
  free: boolean;
  priceFromMinor: number | null;
  currency: string;
  image: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number | null;
};
export type EventDetail = {
  event: EventView;
  descriptionEn: string;
  descriptionRu: string;
  descriptionAz: string;
  address: string;
  ticketUrl: string | null;
};
export type City = {
  slug: string;
  nameEn: string;
  nameRu: string;
  nameAz: string;
};
export type EventPage = { items: EventView[]; total: number };
export const CATEGORIES = [
  "CONCERT",
  "FESTIVAL",
  "SPORT",
  "CULTURE",
  "MARKET",
  "FOOD",
  "FAMILY",
  "OTHER",
] as const;
export const getCities = () => request<City[]>("cities");
export const getEvents = (query: URLSearchParams) =>
  request<EventPage>("events?" + query.toString());
export const getEvent = (slug: string) =>
  request<EventDetail>("events/" + encodeURIComponent(slug));
type Pick3 = (en: string, ru: string, az: string) => string;
export function eventTitle(e: EventView, locale: "en" | "ru" | "az") {
  return locale === "ru" ? e.titleRu : locale === "az" ? e.titleAz : e.titleEn;
}
export function cityName(
  e: { cityNameEn: string; cityNameRu: string; cityNameAz: string },
  locale: "en" | "ru" | "az",
) {
  return locale === "ru"
    ? e.cityNameRu
    : locale === "az"
      ? e.cityNameAz
      : e.cityNameEn;
}
export function categoryLabels(t: Pick3): Record<string, string> {
  return {
    CONCERT: t("Concert", "Концерт", "Konsert"),
    FESTIVAL: t("Festival", "Фестиваль", "Festival"),
    SPORT: t("Sport", "Спорт", "İdman"),
    CULTURE: t("Culture", "Культура", "Mədəniyyət"),
    MARKET: t("Market", "Ярмарка", "Yarmarka"),
    FOOD: t("Food", "Еда", "Yemək"),
    FAMILY: t("Family", "Семье", "Ailə"),
    OTHER: t("Other", "Другое", "Digər"),
  };
}
