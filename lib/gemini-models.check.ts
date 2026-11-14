// Self-check for model filtering and ordering. Run: bun lib/gemini-models.check.ts
import assert from "node:assert/strict"
import { orderChain, textModels } from "./gemini-models"

const gen = ["generateContent"]
const listed = [
  { name: "models/gemini-3.8-flash", supportedGenerationMethods: gen },
  { name: "models/gemini-3.5-flash-lite", supportedGenerationMethods: gen },
  { name: "models/gemini-2.5-pro", supportedGenerationMethods: gen },
  { name: "models/gemini-3.8-flash-tts", supportedGenerationMethods: gen },
  { name: "models/gemini-3.1-flash-image", supportedGenerationMethods: gen },
  { name: "models/gemini-embedding-001", supportedGenerationMethods: ["embedContent"] },
  { name: "models/lyria-3.5", supportedGenerationMethods: gen },
]
const text = textModels(listed)
assert.deepEqual(text, ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-2.5-pro"])

// Preferred models that exist come first in their own order; a retired one is dropped; the rest follow, newest first.
assert.deepEqual(orderChain(text, ["gemini-3.5-flash-lite", "gemini-2.5-flash"]), ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-2.5-pro"])
// The configured model goes first and is not repeated.
assert.deepEqual(orderChain(text, ["gemini-3.5-flash-lite"], "gemini-2.5-pro"), ["gemini-2.5-pro", "gemini-3.5-flash-lite", "gemini-3.8-flash"])

console.log("gemini model chain check passed")
