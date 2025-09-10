import { NextRequest } from "next/server"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/lib/db"

// Create Better Auth instance for Next.js
const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  database: drizzleAdapter(db, {
    provider: "sqlite",
    usePlural: true,
  }),
  secret: process.env.BETTER_AUTH_SECRET || "your-secret-key-change-in-production",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  logger: {
    level: process.env.NODE_ENV === "development" ? "debug" : "info"
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  cookies: {
    sessionToken: {
      name: "better-auth.session_token",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    },
  },
})

export async function GET(request: NextRequest) {
  try {
    return auth.handler(request)
  } catch (error) {
    console.error("Auth GET error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    return auth.handler(request)
  } catch (error) {
    console.error("Auth POST error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
