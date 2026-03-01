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
    console.log('[v0] Sign up started for email:', email)
    
    // Validate inputs
    if (!email || !password || !displayName) {
      return { success: false, error: 'Please fill in all fields' }
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' }
    }

    console.log('[v0] Checking if user already exists...')
    
    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM profiles WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      console.log('[v0] User already exists:', email)
      return { success: false, error: 'Email already registered' }
    }

    console.log('[v0] Hashing password...')
    
    // Hash password
    const salt = await bcryptjs.genSalt(10)
    const hashedPassword = await bcryptjs.hash(password, salt)

    // Create user profile
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    console.log('[v0] Creating profile with ID:', userId)
    
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
      console.log('[v0] Failed to insert profile')
      return { success: false, error: 'Failed to create account' }
    }

    console.log('[v0] Profile created, setting session cookie')

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('auth_session', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    console.log('[v0] Sign up successful for:', email)
    return { success: true, user: result[0] }
  } catch (error) {
    console.error('[v0] Sign up error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign up'
    console.error('[v0] Error details:', errorMessage)
    return { success: false, error: errorMessage }
  }
}

export async function loginWithNeon(email: string, password: string) {
  try {
    console.log('[v0] Login attempt for email:', email)
    
    if (!email || !password) {
      return { success: false, error: 'Please fill in all fields' }
    }

    console.log('[v0] Fetching user from database...')
    
    // Get user
    const users = await sql`
      SELECT id, password_hash, display_name FROM profiles WHERE email = ${email}
    `

    if (users.length === 0) {
      console.log('[v0] User not found:', email)
      return { success: false, error: 'Invalid email or password' }
    }

    const user = users[0]

    console.log('[v0] User found, verifying password...')

    // Verify password
    const isValid = await bcryptjs.compare(password, user.password_hash)
    if (!isValid) {
      console.log('[v0] Password verification failed')
      return { success: false, error: 'Invalid email or password' }
    }

    console.log('[v0] Password verified, setting session cookie...')

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('auth_session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    console.log('[v0] Login successful for:', email)
    return { success: true, user: { id: user.id, email, display_name: user.display_name } }
  } catch (error) {
    console.error('[v0] Login error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred during login'
    console.error('[v0] Error details:', errorMessage)
    return { success: false, error: errorMessage }
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
