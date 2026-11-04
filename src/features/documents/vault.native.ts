import { Directory, File, Paths } from "expo-file-system";
import {
  AESEncryptionKey,
  AESSealedData,
  aesEncryptAsync,
  aesDecryptAsync,
  randomUUID,
} from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import * as Sharing from "expo-sharing";
import type { TravelDocument } from "./types";
export const offlineSupported = true;
const keyName = "azertur.documents.key.v1";
const root = () => new Directory(Paths.document, "private-travel-v1");
const temporary = () => new Directory(Paths.cache, "travel-preview-v1");
let generation = 0;
let queue = Promise.resolve();
function serial<T>(work: () => Promise<T>): Promise<T> {
  const next = queue.then(work);
  queue = next.then(
    () => {},
    () => {},
  );
  return next;
}
function ensure(dir: Directory) {
  dir.create({ idempotent: true, intermediates: true });
}
function validId(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw Error("INVALID_ID");
  return id;
}
async function key(owner: string, create = false) {
  let raw = await SecureStore.getItemAsync(keyName);
  if (raw) {
    const stored = JSON.parse(raw);
    if (stored.owner !== owner) throw Error("OWNER_CHANGED");
    return AESEncryptionKey.import(stored.key, "hex");
  }
  if (!create) return null;
  const k = await AESEncryptionKey.generate();
  await SecureStore.setItemAsync(
    keyName,
    JSON.stringify({ owner, key: await k.encoded("hex") }),
    { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
  );
  return k;
}
async function readManifest(k: AESEncryptionKey): Promise<TravelDocument[]> {
  const f = new File(root(), "index.enc");
  if (!f.exists) return [];
  const bytes = await aesDecryptAsync(
    AESSealedData.fromCombined(await f.bytes()),
    k,
  );
  return JSON.parse(new TextDecoder().decode(bytes));
}
async function writeManifest(k: AESEncryptionKey, docs: TravelDocument[]) {
  ensure(root());
  const f = new File(root(), "index.enc");
  const sealed = await aesEncryptAsync(
    new TextEncoder().encode(JSON.stringify(docs)),
    k,
  );
  await f.write(await sealed.combined());
}
export async function clearPreviews() {
  const d = temporary();
  if (d.exists) d.delete();
}
export async function clearVault() {
  generation++;
  await serial(async () => {
    await SecureStore.deleteItemAsync(keyName);
    if (root().exists) root().delete();
    await clearPreviews();
  });
}
export async function cachedDocuments(owner: string) {
  return serial(async () => {
    const k = await key(owner);
    return k ? readManifest(k) : [];
  });
}
export async function cacheDocument(
  owner: string,
  doc: TravelDocument,
  bytes: Uint8Array,
) {
  const current = generation;
  return serial(async () => {
    if (current !== generation) throw Error("SESSION_CHANGED");
    const k = await key(owner, true);
    if (!k) throw Error("KEY_MISSING");
    const old = await readManifest(k);
    const sealed = await aesEncryptAsync(bytes, k);
    if (current !== generation) throw Error("SESSION_CHANGED");
    ensure(root());
    await new File(root(), validId(doc.id) + ".enc").write(
      await sealed.combined(),
    );
    await writeManifest(k, [...old.filter((x) => x.id !== doc.id), doc]);
  });
}
export async function cachedBytes(owner: string, id: string) {
  return serial(async () => {
    const k = await key(owner),
      f = new File(root(), validId(id) + ".enc");
    return k && f.exists
      ? aesDecryptAsync(AESSealedData.fromCombined(await f.bytes()), k)
      : null;
  });
}
export async function syncMetadata(
  owner: string,
  booking: string,
  docs: TravelDocument[],
) {
  const current = generation;
  return serial(async () => {
    if (current !== generation) return;
    const k = await key(owner);
    if (!k) return;
    const old = await readManifest(k);
    const updated = old.filter((x) => x.booking_id !== booking);
    for (const d of docs)
      if (old.some((x) => x.id === d.id && x.sha256 === d.sha256))
        updated.push(d);
    for (const d of old.filter(
      (x) =>
        x.booking_id === booking &&
        !docs.some((n) => n.id === x.id && n.sha256 === x.sha256),
    )) {
      const f = new File(root(), validId(d.id) + ".enc");
      if (f.exists) f.delete();
    }
    await writeManifest(k, updated);
  });
}
export async function previewFile(bytes: Uint8Array, mime: string) {
  ensure(temporary());
  const ext =
    mime === "application/pdf" ? "pdf" : mime === "image/png" ? "png" : "jpg";
  const f = new File(temporary(), randomUUID() + "." + ext);
  await f.write(bytes);
  return f.uri;
}
export async function deletePreview(uri: string) {
  const f = new File(uri);
  if (f.exists) f.delete();
}
export async function exportFile(
  bytes: Uint8Array,
  mime: string,
  _name: string,
) {
  if (!(await Sharing.isAvailableAsync())) throw Error("SHARING_UNAVAILABLE");
  const uri = await previewFile(bytes, mime);
  try {
    await Sharing.shareAsync(uri, { mimeType: mime });
  } finally {
    await deletePreview(uri);
  }
}
