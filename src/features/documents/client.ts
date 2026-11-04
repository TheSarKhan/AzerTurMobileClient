import { digest, CryptoDigestAlgorithm } from "expo-crypto";
import { apiBase, ApiError } from "../../api/client";
export async function protectedBytes(
  path: string,
  token: string,
  hash?: string,
) {
  const abort = new AbortController(),
    timer = setTimeout(() => abort.abort(), 20000);
  try {
    const r = await fetch(apiBase + "/api/v1/" + path, {
      headers: { Authorization: "Bearer " + token },
      cache: "no-store",
      signal: abort.signal,
    });
    if (!r.ok) throw new ApiError(r.status, "DOCUMENT_UNAVAILABLE");
    const bytes = new Uint8Array(await r.arrayBuffer());
    if (bytes.length > 10_000_000) throw Error("DOCUMENT_TOO_LARGE");
    if (hash) {
      const actual = Array.from(
        new Uint8Array(
          await digest(CryptoDigestAlgorithm.SHA256, new Uint8Array(bytes)),
        ),
      )
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("");
      if (actual !== hash) throw Error("DOCUMENT_HASH_MISMATCH");
    }
    return bytes;
  } finally {
    clearTimeout(timer);
  }
}
