import { google } from "googleapis"
import { adminDb } from "@/lib/firebase-admin"

const SCOPES = [
  "https://www.googleapis.com/auth/calendar", // full read/write, needed to list & edit any of the user's calendars (including subscribed holiday calendars)
]

export function getOAuthClient(redirectUri: string) {
  return new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, redirectUri)
}

export function getAuthUrl(redirectUri: string, state: string) {
  const oauth2Client = getOAuthClient(redirectUri)
  return oauth2Client.generateAuthUrl({
    access_type: "offline", // required to get a refresh_token
    prompt: "consent", // force the consent screen so a refresh_token is reliably issued every time
    scope: SCOPES,
    state,
  })
}

interface StoredTokens {
  accessToken: string
  refreshToken: string
  expiryDate?: number | null
}

/**
 * Builds an OAuth2 client authorized for this user, loading their stored
 * tokens from Firestore. If the access token is stale, googleapis will
 * refresh it automatically using the refresh token; we persist the
 * refreshed access token back to Firestore via the "tokens" event so future
 * requests don't have to refresh again.
 */
export async function getAuthorizedClientForUser(uid: string) {
  const tokenRef = adminDb.collection("userTokens").doc(uid)
  const tokenDoc = await tokenRef.get()

  if (!tokenDoc.exists) {
    return null
  }

  const data = tokenDoc.data() as StoredTokens
  if (!data.refreshToken) {
    return null
  }

  // redirectUri isn't used for refreshing, only for the initial code
  // exchange, so any value works here.
  const oauth2Client = getOAuthClient("postmessage")
  oauth2Client.setCredentials({
    access_token: data.accessToken,
    refresh_token: data.refreshToken,
    expiry_date: data.expiryDate ?? undefined,
  })

  oauth2Client.on("tokens", (tokens) => {
    const update: Record<string, unknown> = { updatedAt: new Date().toISOString() }
    if (tokens.access_token) update.accessToken = tokens.access_token
    if (tokens.refresh_token) update.refreshToken = tokens.refresh_token
    if (tokens.expiry_date) update.expiryDate = tokens.expiry_date
    tokenRef.set(update, { merge: true }).catch((err) => {
      console.error("Failed to persist refreshed Google tokens:", err)
    })
  })

  return oauth2Client
}

export function getCalendarClient(auth: InstanceType<typeof google.auth.OAuth2>) {
  return google.calendar({ version: "v3", auth })
}

export async function saveTokensForUser(
  uid: string,
  tokens: { accessToken: string; refreshToken?: string | null; expiryDate?: number | null }
) {
  const tokenRef = adminDb.collection("userTokens").doc(uid)
  const existing = await tokenRef.get()
  const existingRefresh = existing.exists ? (existing.data() as StoredTokens).refreshToken : undefined

  await tokenRef.set(
    {
      accessToken: tokens.accessToken,
      // Google only returns a refresh_token on the first consent; keep the
      // existing one on subsequent connects so we don't null it out.
      refreshToken: tokens.refreshToken || existingRefresh || null,
      expiryDate: tokens.expiryDate ?? null,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  )
}
