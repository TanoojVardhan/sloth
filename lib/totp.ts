import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

// RFC 6238 TOTP (SHA-1, 6 digits, 30 s): what Google Authenticator, Authy, 1Password etc. all speak.
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

/** 160 random bits as 32 base32 characters. */
export function newSecret(): string {
  let out = ""
  let bits = 0
  let acc = 0
  for (const byte of randomBytes(20)) {
    acc = ((acc << 8) | byte) & 0xfff
    bits += 8
    while (bits >= 5) {
      out += ALPHABET[(acc >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  return out
}

function decode(secret: string): Buffer {
  let bits = 0
  let acc = 0
  const bytes: number[] = []
  for (const ch of secret) {
    acc = ((acc << 5) | ALPHABET.indexOf(ch)) & 0xfff
    bits += 5
    if (bits >= 8) {
      bytes.push((acc >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

export function codeAt(secret: string, step: number): string {
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(step))
  const h = createHmac("sha1", decode(secret)).update(counter).digest()
  const o = h[19] & 15
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]
  return String(n % 1_000_000).padStart(6, "0")
}

/**
 * Returns the 30-second step the code matched (allowing one step of clock drift either way),
 * or null. Steps <= lastStep are refused so a code can't be used twice.
 */
export function checkTotp(secret: string, code: string, lastStep = 0, now = Date.now()): number | null {
  const given = Buffer.from(code.replace(/\s/g, ""))
  const current = Math.floor(now / 30000)
  for (const step of [current - 1, current, current + 1]) {
    const want = Buffer.from(codeAt(secret, step))
    if (step > lastStep && want.length === given.length && timingSafeEqual(want, given)) return step
  }
  return null
}
