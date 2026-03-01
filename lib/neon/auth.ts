import { neon } from "@neondatabase/serverless"
import { cookies } from "next/headers"

const sql = neon(process.env.DATABASE_URL!)

export interface UserSession {
  id: string
  email: string
  display_name: string
  avatar_url?: string
  total_xp?: number
  current_level?: number
  streak_days?: number
}

/**
 * Get current user from session cookie
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("auth_session")?.value

    if (!userId) {
      console.log("[v0] No auth session found")
      return null
    }

    const result = await sql`
      SELECT id, email, display_name, avatar_url, total_xp, current_level, streak_days
      FROM profiles
      WHERE id = ${userId}
    `

    if (result.length === 0) {
      console.log("[v0] User not found in database")
      return null
    }

    return result[0] as UserSession
  } catch (error) {
    console.error("[v0] Error getting current user:", error)
    return null
  }
}

/**
 * Get user profile from database
 */
export async function getUserProfile(userId: string) {
  try {
    const result = await sql`
      SELECT id, email, display_name, current_level, total_xp, streak_days, avatar_url, created_at
      FROM profiles
      WHERE id = ${userId}
    `
    return result[0] || null
  } catch (error) {
    console.error("[v0] Error fetching user profile:", error)
    return null
  }
}
