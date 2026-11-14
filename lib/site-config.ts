// Public contact address shown on Support/Privacy. Set NEXT_PUBLIC_SUPPORT_EMAIL
// in Vercel to show it; when unset, pages point people to the in-app help instead.
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || ""
// Where "Download for Android" points. A GitHub release asset is served as a file download,
// and /releases/latest/ always resolves to the newest release, so the link never needs editing.
export const ANDROID_APK_URL =
  process.env.NEXT_PUBLIC_ANDROID_APK_URL || "https://github.com/TanoojVardhan/sloth/releases/latest/download/SlothPlanner.apk"
export const LAST_UPDATED = "November 13, 2026"
