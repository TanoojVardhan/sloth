import { NextResponse } from "next/server"

// Temporary diagnostic endpoint — lists which Gemini models this API key can
// actually use, so we're not guessing model names. Safe to delete later.
export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "No GEMINI_API_KEY set" }, { status: 200 })
  }
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  const data = await res.json()
  return NextResponse.json(data, { status: 200 })
}
