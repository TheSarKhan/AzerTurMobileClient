const { Buffer } = require("node:buffer");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const crypto = require("node:crypto");
function fixture() {
  const files = new Map(),
    dirs = new Set(),
    keys = new Map();
  const uri = (...parts) =>
    parts.map((x) => (typeof x === "string" ? x : x.uri)).join("/");
  class Directory {
    constructor(...parts) {
      this.uri = uri(...parts);
    }
    get exists() {
      return dirs.has(this.uri);
    }
    create() {
      dirs.add(this.uri);
    }
    delete() {
      for (const path of files.keys())
        if (path.startsWith(this.uri + "/")) files.delete(path);
      dirs.delete(this.uri);
    }
  }
  class File {
    constructor(...parts) {
      this.uri = uri(...parts);
    }
    get exists() {
      return files.has(this.uri);
    }
    async write(bytes) {
      files.set(this.uri, new Uint8Array(bytes));
    }
    async bytes() {
      return files.get(this.uri);
    }
    delete() {
      files.delete(this.uri);
    }
  }
  class Key {
    constructor(value) {
      this.value = value;
    }
    static async generate() {
      return new Key(crypto.randomBytes(32));
    }
    static async import(hex) {
      return new Key(Buffer.from(hex, "hex"));
    }
    async encoded() {
      return this.value.toString("hex");
    }
  }
  const aes = {
    AESEncryptionKey: Key,
    AESSealedData: { fromCombined: (x) => x },
    randomUUID: crypto.randomUUID,
    async aesEncryptAsync(bytes, key) {
      const iv = crypto.randomBytes(12),
        cipher = crypto.createCipheriv("aes-256-gcm", key.value, iv);
      const data = Buffer.concat([
        iv,
        cipher.update(bytes),
        cipher.final(),
        cipher.getAuthTag(),
      ]);
      return { combined: async () => data };
    },
    async aesDecryptAsync(data, key) {
      const buf = Buffer.from(data),
        dec = crypto.createDecipheriv(
          "aes-256-gcm",
          key.value,
          buf.subarray(0, 12),
        );
      dec.setAuthTag(buf.subarray(-16));
      return new Uint8Array(
        Buffer.concat([dec.update(buf.subarray(12, -16)), dec.final()]),
      );
    },
  };
  const modules = {
    "expo-file-system": {
      Directory,
      File,
      Paths: { document: "private", cache: "temporary" },
    },
    "expo-crypto": aes,
    "expo-secure-store": {
      WHEN_UNLOCKED_THIS_DEVICE_ONLY: "device-only",
      getItemAsync: async (k) => keys.get(k) || null,
      setItemAsync: async (k, v) => {
        keys.set(k, v);
      },
      deleteItemAsync: async (k) => {
        keys.delete(k);
      },
    },
    "expo-sharing": {
      isAvailableAsync: async () => true,
      shareAsync: async () => {},
    },
  };
  const js = ts.transpileModule(
    fs.readFileSync("src/features/documents/vault.native.ts", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", js)(
    (name) => {
      if (!modules[name]) throw Error(name);
      return modules[name];
    },
    module,
    module.exports,
  );
  return { vault: module.exports, files, keys };
}
const id = "a1b2c3d4-1234-5678-9012-123456789abc",
  owner = "one";
const doc = {
  id,
  booking_id: "booking",
  sha256: "hash",
  status: "UPCOMING",
  title: "Private passenger name",
  verifiedAt: "2026-11-04T00:00:00Z",
};
test("Native vault encrypts both file bytes and private metadata; exact originals decrypt", async () => {
  const { vault, files } = fixture();
  const original = new TextEncoder().encode("PRIVATE ORIGINAL PDF");
  await vault.cacheDocument(owner, doc, original);
  for (const data of files.values()) {
    const text = new TextDecoder().decode(data);
    assert(!text.includes("PRIVATE ORIGINAL PDF"));
    assert(!text.includes("Private passenger name"));
  }
  assert.deepEqual(await vault.cachedBytes(owner, id), original);
  assert.deepEqual(await vault.cachedDocuments(owner), [doc]);
});
test("Another owner cannot read the vault; logout destroys key, files and previews", async () => {
  const { vault, files, keys } = fixture();
  await vault.cacheDocument(owner, doc, new Uint8Array([1, 2]));
  await assert.rejects(vault.cachedDocuments("other"));
  await vault.previewFile(new Uint8Array([1]), "image/png");
  await vault.clearVault();
  assert.equal(keys.size, 0);
  assert.equal(files.size, 0);
  assert.deepEqual(await vault.cachedDocuments(owner), []);
});
test("Ciphertext tampering is detected by authenticated encryption", async () => {
  const { vault, files } = fixture();
  await vault.cacheDocument(owner, doc, new Uint8Array([1, 2, 3]));
  const file = [...files.keys()].find((x) => x.endsWith(id + ".enc"));
  files.get(file)[15] ^= 1;
  await assert.rejects(vault.cachedBytes(owner, id));
});
test("Online metadata replaces cached status and removes missing versions", async () => {
  const { vault } = fixture();
  await vault.cacheDocument(owner, doc, new Uint8Array([1, 2]));
  await vault.syncMetadata(owner, "booking", [
    { ...doc, status: "SUPERSEDED" },
  ]);
  assert.equal((await vault.cachedDocuments(owner))[0].status, "SUPERSEDED");
  await vault.syncMetadata(owner, "booking", []);
  assert.equal(await vault.cachedBytes(owner, id), null);
  assert.deepEqual(await vault.cachedDocuments(owner), []);
});
test("Concurrent saves serialize manifest writes and logout wins over in-flight writes", async () => {
  const { vault, keys, files } = fixture();
  await Promise.all([
    vault.cacheDocument(owner, doc, new Uint8Array([1])),
    vault.cacheDocument(
      owner,
      { ...doc, id: "b1b2c3d4-1234-5678-9012-123456789abc" },
      new Uint8Array([2]),
    ),
  ]);
  assert.equal((await vault.cachedDocuments(owner)).length, 2);
  const save = vault.cacheDocument(owner, doc, new Uint8Array([3]));
  const clear = vault.clearVault();
  await Promise.allSettled([save, clear]);
  assert.equal(keys.size, 0);
  assert.equal(files.size, 0);
});
