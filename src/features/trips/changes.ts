import type { Currency } from "../../api/client";
export type Amendment = {
  id: string;
  draft_version: number;
  pdf_sha256: string;
  pdf_filename: string;
  state: string;
  canAccept: boolean;
  proposal: {
    title: string;
    currency: Currency;
    date: string;
    travelers: number;
    message: string;
    itinerary: { city: string; description: string }[];
    services: { key: string; name: string; total: number; policy: string }[];
    previousTerms: {
      serviceKey: string;
      policyText: string;
      retainedMinor: number;
      allocatedPaidMinor: number;
    }[];
    paidMinor: number;
    retainedMinor: number;
    refundMinor: number;
    appliedMinor: number;
    totalMinor: number;
    remainingMinor: number;
  };
  refundTracking: { state: string; customer_message: string } | null;
};
export type Cancellation = {
  contractId: string | null;
  services: { key: string; name: string; total: number; policy: string }[];
  offer: { currency: Currency };
  paidMinor: number;
  allocatableMinor: number;
  bookingStatus: string;
};
export type Refund = {
  id: string;
  message: string;
  status: string;
  currency?: Currency;
  refundMinor?: number;
  retainedMinor?: number;
  paidMinor?: number;
  refundStatus?: string;
  refundMessage?: string;
  customer_explanation?: string;
  lines?: {
    serviceKey: string;
    policyText: string;
    calculation: { retainedMinor: number; refundMinor: number };
  }[];
};
export type RevisedPlan = {
  id: string;
  version: number;
  state: string;
  payload: string;
};
