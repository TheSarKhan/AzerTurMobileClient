import { Platform } from "react-native";
export type Locale = "en" | "ru" | "az";
export type Currency = "EUR" | "USD" | "AZN";
const base = (
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  (Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080")
).replace(/\/$/, "");
export interface Customer {
  id: string;
  email: string;
  name: string;
  locale: Locale;
}
export interface Session {
  token: string;
  expires: string;
  customer: Customer;
}
export interface Tour {
  slug: string;
  titleEn: string;
  titleRu: string;
  titleAz: string;
  region: string;
  days: number;
  fromPriceEur: number;
  image: string;
}
export interface Quote {
  id: string;
  currency: Currency;
  total: number;
  deposit: number;
  balance: number;
  due: string;
  expires: string;
  demo: boolean;
  lines: { label: string; amount: number }[];
}
export interface Booking {
  id: string;
  status: string;
  currency: Currency;
  total: number;
  deposit: number;
  paid: number;
  departure: string;
  title: string;
  quotePayload: string;
  operatorNote: string;
  createdAt: string;
}
export interface BookingRequest {
  id: string;
  bookingId: string;
  kind: string;
  message: string;
  status: string;
  response: string;
}
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}
export async function request<T>(
  path: string,
  body?: unknown,
  token?: string,
  key?: string,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const r = await fetch(base + "/api/v1/" + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
        ...(key ? { "Idempotency-Key": key } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    if (!r.ok) {
      const data = await r.json().catch(() => ({ error: "REQUEST_FAILED" }));
      throw new ApiError(r.status, data.error || "REQUEST_FAILED");
    }
    if (r.status === 204 || r.headers.get("content-length") === "0")
      return undefined as T;
    return await r.json();
  } finally {
    clearTimeout(timeout);
  }
}
export const getTours = () => request<Tour[]>("tours");
export const createQuote = (
  tour: Tour,
  date: string,
  pax: number,
  currency: Currency,
  guideLanguage: Locale,
) =>
  request<Quote>("quotes", {
    slug: tour.slug,
    date,
    pax,
    hotel: "comfort",
    driver: true,
    stay: true,
    guide: true,
    guideLanguage,
    transfer: false,
    activity: false,
    currency,
  });
