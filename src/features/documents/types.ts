export type TravelDocument = {
  id: string;
  booking_id: string;
  service_key: string;
  kind: string;
  version: number;
  title: string;
  filename: string;
  mime: string;
  sha256: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  instructions: string;
  state: string;
  status: string;
  verifiedAt: string;
  size: number;
  replacementId: string | null;
};
export function effectiveDocumentStatus(d: TravelDocument, now = Date.now()) {
  if (
    (d.status === "UPCOMING" || d.status === "ACTIVE") &&
    Date.parse(d.ends_at) <= now
  )
    return "EXPIRED";
  return d.status;
}
export function actionable(d: TravelDocument, now = Date.now()) {
  const status = effectiveDocumentStatus(d, now);
  return status === "UPCOMING" || status === "ACTIVE";
}
