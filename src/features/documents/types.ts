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
export function actionable(d: TravelDocument) {
  return d.status === "UPCOMING" || d.status === "ACTIVE";
}
