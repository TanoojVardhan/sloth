// Lightweight Firebase ID-token check that does NOT depend on firebase-admin.
// firebase-admin/auth pulls in jwks-rsa -> jose (ESM-only), which crashes in
// Vercel's serverless runtime. Google's Identity Toolkit validates the token
// for us over plain HTTPS, so no extra packages or service account are needed.
export async function verifyIdTokenLite(
  idToken: string,
): Promise<{ success: true; uid: string; email?: string; emailVerified?: boolean } | { success: false }> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!apiKey || !idToken) return { success: false }
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
        cache: "no-store",
      },
    )
    if (!res.ok) return { success: false }
    const data = (await res.json()) as { users?: { localId?: string; email?: string; emailVerified?: boolean }[] }
    const user = data.users?.[0]
    return user?.localId ? { success: true, uid: user.localId, email: user.email, emailVerified: user.emailVerified } : { success: false }
  } catch {
    return { success: false }
  }
}
