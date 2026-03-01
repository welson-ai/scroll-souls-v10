'use server'

import { neon } from '@neondatabase/serverless'
import * as bcryptjs from 'bcryptjs'
import { cookies } from 'next/headers'

const sql = neon(process.env.DATABASE_URL!)

export async function signUpWithNeon({
  email,
  password,
  displayName,
}: {
  email: string
  password: string
  displayName: string
}) {
  try {
    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM profiles WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return { success: false, error: 'Email already registered' }
    }

    // Hash password
    const salt = await bcryptjs.genSalt(10)
    const hashedPassword = await bcryptjs.hash(password, salt)

    // Create user profile
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const result = await sql`
      INSERT INTO profiles (
        id,
        email,
        display_name,
        password_hash,
        email_verified,
        created_at,
        updated_at
      ) VALUES (
        ${userId},
        ${email},
        ${displayName},
        ${hashedPassword},
        false,
        NOW(),
        NOW()
      )
      RETURNING id, email, display_name
    `

    if (result.length === 0) {
      return { success: false, error: 'Failed to create account' }
    }

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('auth_session', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return { success: true, user: result[0] }
  } catch (error) {
    console.error('[v0] Sign up error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

export async function loginWithNeon(email: string, password: string) {
  try {
    // Get user
    const users = await sql`
      SELECT id, password_hash, display_name FROM profiles WHERE email = ${email}
    `

    if (users.length === 0) {
      return { success: false, error: 'Invalid email or password' }
    }

    const user = users[0]

    // Verify password
    const isValid = await bcryptjs.compare(password, user.password_hash)
    if (!isValid) {
      return { success: false, error: 'Invalid email or password' }
    }

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('auth_session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return { success: true, user: { id: user.id, email, display_name: user.display_name } }
  } catch (error) {
    console.error('[v0] Login error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

export async function logoutUser() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('auth_session')
    return { success: true }
  } catch (error) {
    console.error('[v0] Logout error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' }
  }
}
