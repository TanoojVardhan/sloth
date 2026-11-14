// Self-check for the optional passphrase. Run: bun lib/e2ee.check.ts
import assert from "node:assert/strict"
import { createKeys } from "./e2ee-core"
import { dropActiveKey, isPlainMode, LockedError, open, seal, setActiveKey, setPlainMode } from "./e2ee"

const doc = { title: "Problem set 4", skip: undefined }

// Account with a passphrase but no key on this device: nothing can be written.
await assert.rejects(seal(doc), LockedError)

// Account without a passphrase: content is stored as it is and reads back unchanged.
setPlainMode(true)
assert.deepEqual(await seal(doc), { title: "Problem set 4" })
assert.deepEqual(await open({ userId: "u1", title: "Problem set 4" }), { userId: "u1", title: "Problem set 4" })

// A key always wins over plain mode, so a passphrase account never writes readable content.
const { key } = await createKeys("correct horse battery")
setActiveKey("u1", key)
assert.equal(isPlainMode(), false)
const sealed = await seal(doc)
assert.deepEqual(Object.keys(sealed), ["enc"])
assert.deepEqual(await open({ userId: "u1", ...sealed }), { userId: "u1", title: "Problem set 4" })

// Signing out clears both the key and plain mode.
dropActiveKey()
await assert.rejects(seal(doc), LockedError)

console.log("e2ee optional-passphrase check passed")
