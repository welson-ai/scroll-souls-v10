'use server'

import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

const sql = neon(process.env.DATABASE_URL!)

export async function signUp(email: string, password: string, displayName: string) {
  try {
    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM profiles WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return { error: 'Email already registered' }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user profile
    const userId = Math.random().toString(36).substring(2, 15)
    const result = await sql`
      INSERT INTO profiles (
        id,
        email,
        display_name,
        password_hash,
        created_at,
        updated_at
      ) VALUES (
        ${userId},
        ${email},
        ${displayName},
        ${hashedPassword},
        NOW(),
        NOW()
      )
      RETURNING id, email, display_name
    `

    if (result.length === 0) {
      return { error: 'Failed to create account' }
    }

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('user_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return { success: true, user: result[0] }
  } catch (error) {
    console.error('[v0] Sign up error:', error)
    return { error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

export async function signIn(email: string, password: string) {
  try {
    // Get user
    const users = await sql`
      SELECT id, password_hash, display_name FROM profiles WHERE email = ${email}
    `

    if (users.length === 0) {
      return { error: 'Invalid email or password' }
    }

    const user = users[0]

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return { error: 'Invalid email or password' }
    }

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    })

    return { success: true, user: { id: user.id, email, display_name: user.display_name } }
  } catch (error) {
    console.error('[v0] Sign in error:', error)
    return { error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

export async function signOut() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('user_id')
    return { success: true }
  } catch (error) {
    console.error('[v0] Sign out error:', error)
    return { error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')?.value

    if (!userId) {
      return { user: null }
    }

    const users = await sql`
      SELECT id, email, display_name, avatar_url, total_xp, current_level, streak_days
      FROM profiles
      WHERE id = ${userId}
    `

    if (users.length === 0) {
      return { user: null }
    }

    return { user: users[0] }
  } catch (error) {
    console.error('[v0] Get current user error:', error)
    return { user: null }
  }
}
