import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { FirestoreAdapter } from "@auth/firebase-adapter"
import { getUserByEmail } from "./services/user-service"
import { auth } from "./firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import admin from "./firebase-admin" // Import our firebase-admin module

export const authOptions: NextAuthOptions = {
  adapter: FirestoreAdapter({
    credential: admin.credential,
  }),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Use Firebase Authentication
          const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password)

          const user = userCredential.user

          // Get additional user data from Firestore
          const userData = await getUserByEmail(credentials.email)

          if (!userData) {
            return null
          }

          return {
            id: user.uid,
            email: user.email,
            name: userData.name,
            image: userData.photoURL,
          }
        } catch (error) {
          console.error("Authentication error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.image = token.picture as string
      }

      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }

      // If we already have the token, just return it
      if (token.id) {
        return token
      }

      // If we don't have a user ID in the token but have an email, try to get the user from Firestore
      if (token.email) {
        const userData = await getUserByEmail(token.email as string)
        if (userData) {
          token.id = userData.id
          token.name = userData.name
          token.picture = userData.photoURL
        }
      }

      return token
    },
  },
}
