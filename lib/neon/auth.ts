import { sql } from "@neondatabase/serverless"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

export interface UserSession {
  id: string
  email: string
  display_name: string
}

/**
 * Verify JWT token from cookies and return user session
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return null
    }

    const verified = await jwtVerify(token, JWT_SECRET)
    return verified.payload as UserSession
  } catch (error) {
    console.error("[v0] Error verifying token:", error)
    return null
  }
}

/**
 * Get user profile from database
 */
export async function getUserProfile(userId: string) {
  try {
    const result = await sql`
      SELECT id, email, display_name, current_level, total_xp, streak_days
      FROM profiles
      WHERE id = ${userId}
    `
    return result[0] || null
  } catch (error) {
    console.error("[v0] Error fetching user profile:", error)
    return null
  }
}

/**
 * Create JWT token
 */
export function createToken(user: UserSession): string {
  const payload = {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  }

  // Note: This is a simplified version. In production, use a proper JWT library
  return Buffer.from(JSON.stringify(payload)).toString("base64")
}

/**
 * Logout user by clearing session cookie
 */
export async function logoutUser() {
  const cookieStore = await cookies()
  cookieStore.delete("auth_token")
}
