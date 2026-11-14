"use client"

import { useSyncExternalStore } from "react"
import { decryptJson, encryptJson, type Blob } from "./e2ee-core"

/**
 * Holds the unlocked data key for this tab and (optionally) a non-extractable
 * copy in IndexedDB so the passphrase isn't asked on every visit. The key can
 * be used by this origin's code but cannot be read out as bytes.
 */

export class LockedError extends Error {
  constructor() {
    super("Your data is locked. Enter your encryption passphrase to unlock it.")
    this.name = "LockedError"
  }
}

let key: CryptoKey | null = null
let activeUser: string | null = null
let ready = false // key present AND older data migrated
let plainUser = false // signed-in account has no passphrase: content is stored readable
let setup = false // the user asked to add a passphrase (from Settings)
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** True while the data key is available in this tab. */
export function useUnlocked(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => key !== null,
    () => false,
  )
}

export const isUnlocked = () => key !== null

/** The passphrase is optional. Accounts without one read and write plain documents. */
export function setPlainMode(on: boolean) {
  plainUser = on
}
export const isPlainMode = () => plainUser && key === null

/** True while the "add a passphrase" screens should replace the app. */
export function useSetupRequested(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => setup,
    () => false,
  )
}

export function requestSetup(on: boolean) {
  setup = on
  emit()
}

/** True once the key is loaded and any plaintext leftovers are sealed: data hooks may fetch. */
export function useDataReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => key !== null && ready,
    () => false,
  )
}

export function markReady(v: boolean) {
  ready = v
  emit()
}

export function setActiveKey(userId: string, k: CryptoKey) {
  key = k
  activeUser = userId
  emit()
}

export function dropActiveKey() {
  key = null
  activeUser = null
  ready = false
  plainUser = false
  setup = false
  emit()
}

// ---------- device cache (IndexedDB) ----------

const DB_NAME = "sloth-e2ee"
const STORE = "keys"
const REMEMBER_FLAG = "sloth.e2ee.remember"

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idb<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  try {
    const d = await openIdb()
    return await new Promise<T | undefined>((resolve) => {
      const req = run(d.transaction(STORE, mode).objectStore(STORE))
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(undefined)
    })
  } catch {
    return undefined
  }
}

export function rememberOnDevice(): boolean {
  try {
    return localStorage.getItem(REMEMBER_FLAG) !== "0"
  } catch {
    return true
  }
}

export function setRememberOnDevice(on: boolean) {
  try {
    localStorage.setItem(REMEMBER_FLAG, on ? "1" : "0")
  } catch {
    /* private mode: the key just stays in memory */
  }
}

export async function cacheKeyOnDevice(userId: string, k: CryptoKey) {
  if (rememberOnDevice()) await idb("readwrite", (s) => s.put(k, userId))
}

export async function restoreCachedKey(userId: string): Promise<boolean> {
  const cached = await idb<CryptoKey>("readonly", (s) => s.get(userId) as IDBRequest<CryptoKey>)
  if (cached) {
    setActiveKey(userId, cached)
    return true
  }
  return false
}

export async function forgetCachedKey(userId: string) {
  await idb("readwrite", (s) => s.delete(userId))
}

// ---------- documents ----------

function need(): { k: CryptoKey; uid: string } {
  if (!key || !activeUser) throw new LockedError()
  return { k: key, uid: activeUser }
}

/**
 * Turns plain fields into the stored form: { enc } only when the account has a
 * passphrase, the fields themselves when it doesn't. A key always wins, so an
 * account that has one can never write readable content by accident.
 */
export async function seal(fields: Record<string, unknown>): Promise<Record<string, unknown>> {
  const clean = JSON.parse(JSON.stringify(fields)) as Record<string, unknown> // drops undefined
  if (isPlainMode()) return clean
  const { k, uid } = need()
  return { enc: await encryptJson(k, uid, clean) }
}

const META_KEYS = new Set(["userId", "createdAt", "updatedAt", "enc"])

/**
 * Reads a stored document. Encrypted ones are opened; documents saved before
 * encryption was turned on come back as they are, until the migration seals them.
 */
export async function open(data: Record<string, unknown>): Promise<Record<string, unknown>> {
  const blob = data.enc as Blob | undefined
  if (!blob || typeof blob !== "object") return data
  const { k, uid } = need()
  const inner = await decryptJson<Record<string, unknown>>(k, uid, blob)
  const outer: Record<string, unknown> = {}
  for (const [name, v] of Object.entries(data)) if (name !== "enc") outer[name] = v
  return { ...outer, ...inner }
}

/** Splits an opened document into what goes inside the blob and what stays readable. */
export function splitMeta(data: Record<string, unknown>): { inner: Record<string, unknown> } {
  const inner: Record<string, unknown> = {}
  for (const [name, v] of Object.entries(data)) if (!META_KEYS.has(name)) inner[name] = v
  return { inner }
}
