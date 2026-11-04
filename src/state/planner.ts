import type { Quote, Currency, Locale } from "../api/client";
/** In-memory public itinerary draft survives authentication; no passenger data or tokens. */
export type PlannerDraft = {
  slug: string;
  mode: number;
  date: string;
  pax: string;
  cities: string[];
  currency: Currency;
  hotel: string;
  guideLanguage: Locale;
  services: {
    driver: boolean;
    stay: boolean;
    guide: boolean;
    transfer: boolean;
    activity: boolean;
  };
  quote: Quote | null;
  step: number;
};
