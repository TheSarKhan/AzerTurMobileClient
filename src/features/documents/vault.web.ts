import type { TravelDocument } from "./types";
// Web previews have no persistent private storage. Explicit exports are user initiated.
export const offlineSupported = false;
export async function clearVault() {}
export async function cachedDocuments(
  _owner: string,
): Promise<TravelDocument[]> {
  return [];
}
export async function cacheDocument(
  _owner: string,
  _doc: TravelDocument,
  _bytes: Uint8Array,
) {
  throw Error("OFFLINE_NATIVE_ONLY");
}
export async function cachedBytes(
  _owner: string,
  _id: string,
): Promise<Uint8Array | null> {
  return null;
}
export async function syncMetadata(
  _owner: string,
  _booking: string,
  _docs: TravelDocument[],
) {}
export async function previewFile(bytes: Uint8Array, mime: string) {
  return URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: mime }));
}
export async function deletePreview(uri: string) {
  URL.revokeObjectURL(uri);
}
export async function clearPreviews() {}
export async function exportFile(
  bytes: Uint8Array,
  mime: string,
  name: string,
) {
  const url = await previewFile(bytes, mime);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
