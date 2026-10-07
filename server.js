// DEPRECATED — unused.
//
// This custom server (for a persistent WebSocket relay) was replaced by the
// ephemeral-token approach in app/api/ai/live-token/route.ts, because this
// app deploys to Vercel, whose serverless functions can't hold a long-lived
// WebSocket connection. The browser now connects to Gemini's Live API
// directly using a short-lived token minted by that route; see
// hooks/use-live-transcribe.ts. package.json's scripts go back to plain
// `next dev` / `next start`, so this file is never run. Safe to delete.
