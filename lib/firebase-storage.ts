import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { storage } from "@/lib/firebase"

const MAX_AVATAR_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]

/**
 * Uploads a profile picture to Firebase Storage (free Spark-tier usage — no
 * billing plan needed) at `avatars/{userId}/{timestamp}-{filename}` and
 * returns its public download URL. Each upload gets a unique path rather
 * than overwriting in place, so a stale cached image never lingers.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Please choose a PNG, JPEG, WEBP, or GIF image.")
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Image is too large — please choose one under 5MB.")
  }

  const path = `avatars/${userId}/${Date.now()}-${file.name}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file, { contentType: file.type })
  return getDownloadURL(storageRef)
}

/** Best-effort cleanup of a previous avatar file when it was one of ours. */
export async function deleteAvatarByUrl(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url)
    await deleteObject(storageRef)
  } catch {
    // Not fatal — e.g. the URL wasn't a Storage ref, or it's already gone.
  }
}
