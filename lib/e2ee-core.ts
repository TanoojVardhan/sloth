/**
 * End-to-end encryption primitives (WebCrypto). No browser-only globals, so
 * the same code runs in tests. The Android app implements the identical
 * format in Kotlin (data/E2ee.kt); change both together.
 *
 *  - A random 256-bit data key (DEK) encrypts every document (AES-256-GCM).
 *  - The DEK is stored only in wrapped form: once under a key derived from the
 *    user's passphrase (PBKDF2-SHA256) and once under a key derived from a
 *    recovery key. Without one of the two secrets nobody can open the data,
 *    including the app's developer and Firebase.
 */

const te = new TextEncoder()
const td = new TextDecoder()

export const PASS_ITERATIONS = 600_000
export const RECOVERY_ITERATIONS = 100_000

export interface Blob {
  v: 1
  iv: string
  ct: string
}

export interface KeyMeta {
  v: 1
  iter: number
  salt: string
  wrapPass: Blob
  recIter: number
  recSalt: string
  wrapRec: Blob
}

const subtle = (): SubtleCrypto => globalThis.crypto.subtle

export function b64(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let s = ""
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i])
  return btoa(s)
}

export function unb64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s)
  const out = new Uint8Array(new ArrayBuffer(bin.length))
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function random(n: number): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(n))
  globalThis.crypto.getRandomValues(out)
  return out
}

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

/** 20 random bytes as 32 base32 characters in groups of four. */
export function newRecoveryKey(): string {
  const bytes = random(20)
  let bits = 0
  let value = 0
  let out = ""
  for (const b of bytes) {
    value = (value << 8) | b
    bits += 8
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  return out.match(/.{1,4}/g)!.join("-")
}

export const normalizeRecoveryKey = (s: string) => s.toUpperCase().replace(/[^A-Z2-7]/g, "")
const normalizePassphrase = (s: string) => s.normalize("NFKC")

async function deriveKek(secret: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<CryptoKey> {
  const base = await subtle().importKey("raw", te.encode(secret), "PBKDF2", false, ["deriveKey"])
  return subtle().deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["wrapKey", "unwrapKey"],
  )
}

async function wrap(dek: CryptoKey, kek: CryptoKey): Promise<Blob> {
  const iv = random(12)
  const ct = await subtle().wrapKey("raw", dek, kek, { name: "AES-GCM", iv })
  return { v: 1, iv: b64(iv), ct: b64(ct) }
}

async function unwrap(blob: Blob, kek: CryptoKey, extractable: boolean): Promise<CryptoKey> {
  return subtle().unwrapKey(
    "raw",
    unb64(blob.ct),
    kek,
    { name: "AES-GCM", iv: unb64(blob.iv) },
    { name: "AES-GCM", length: 256 },
    extractable,
    ["encrypt", "decrypt"],
  )
}

/** First-time setup: makes the data key and wraps it under the passphrase and a new recovery key. */
export async function createKeys(passphrase: string): Promise<{ meta: KeyMeta; key: CryptoKey; recoveryKey: string }> {
  const raw = random(32)
  const extractable = await subtle().importKey("raw", raw, "AES-GCM", true, ["encrypt", "decrypt"])
  const salt = random(16)
  const recSalt = random(16)
  const recoveryKey = newRecoveryKey()
  const kekPass = await deriveKek(normalizePassphrase(passphrase), salt, PASS_ITERATIONS)
  const kekRec = await deriveKek(normalizeRecoveryKey(recoveryKey), recSalt, RECOVERY_ITERATIONS)
  const meta: KeyMeta = {
    v: 1,
    iter: PASS_ITERATIONS,
    salt: b64(salt),
    wrapPass: await wrap(extractable, kekPass),
    recIter: RECOVERY_ITERATIONS,
    recSalt: b64(recSalt),
    wrapRec: await wrap(extractable, kekRec),
  }
  const key = await subtle().importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"])
  return { meta, key, recoveryKey }
}

export type Secret = { kind: "passphrase" | "recovery"; value: string }

/** Throws when the secret is wrong (AES-GCM authentication fails). */
export async function unlockKey(meta: KeyMeta, secret: Secret, extractable = false): Promise<CryptoKey> {
  if (secret.kind === "passphrase") {
    const kek = await deriveKek(normalizePassphrase(secret.value), unb64(meta.salt), meta.iter)
    return unwrap(meta.wrapPass, kek, extractable)
  }
  const kek = await deriveKek(normalizeRecoveryKey(secret.value), unb64(meta.recSalt), meta.recIter)
  return unwrap(meta.wrapRec, kek, extractable)
}

/** New passphrase for the same data key. Proves the old secret (passphrase or recovery key) first. */
export async function changePassphrase(meta: KeyMeta, proof: Secret, newPassphrase: string): Promise<KeyMeta> {
  const dek = await unlockKey(meta, proof, true)
  const salt = random(16)
  const kek = await deriveKek(normalizePassphrase(newPassphrase), salt, PASS_ITERATIONS)
  return { ...meta, iter: PASS_ITERATIONS, salt: b64(salt), wrapPass: await wrap(dek, kek) }
}

/** Makes a fresh recovery key for the same data key (the old one stops working). */
export async function renewRecoveryKey(meta: KeyMeta, proof: Secret): Promise<{ meta: KeyMeta; recoveryKey: string }> {
  const dek = await unlockKey(meta, proof, true)
  const recSalt = random(16)
  const recoveryKey = newRecoveryKey()
  const kek = await deriveKek(normalizeRecoveryKey(recoveryKey), recSalt, RECOVERY_ITERATIONS)
  return { meta: { ...meta, recIter: RECOVERY_ITERATIONS, recSalt: b64(recSalt), wrapRec: await wrap(dek, kek) }, recoveryKey }
}

/** The user id is bound in as additional data, so a document can't be moved to another account. */
export async function encryptJson(key: CryptoKey, userId: string, value: unknown): Promise<Blob> {
  const iv = random(12)
  const ct = await subtle().encrypt(
    { name: "AES-GCM", iv, additionalData: te.encode(userId) },
    key,
    te.encode(JSON.stringify(value ?? null)),
  )
  return { v: 1, iv: b64(iv), ct: b64(ct) }
}

export async function decryptJson<T = Record<string, unknown>>(key: CryptoKey, userId: string, blob: Blob): Promise<T> {
  const pt = await subtle().decrypt(
    { name: "AES-GCM", iv: unb64(blob.iv), additionalData: te.encode(userId) },
    key,
    unb64(blob.ct),
  )
  return JSON.parse(td.decode(pt)) as T
}
