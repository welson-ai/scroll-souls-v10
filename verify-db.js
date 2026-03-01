#!/usr/bin/env node

/**
 * Quick database verification script
 * Checks if all tables exist and profiles table has auth fields
 */

import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('[ERROR] DATABASE_URL environment variable is not set')
  console.error('[INFO] Set DATABASE_URL in your environment or .env.local file')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

async function verifyDatabase() {
  console.log('[v0] Starting database verification...\n')

  try {
    // Check if profiles table exists and has required columns
    const profilesCheck = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'profiles'
      ORDER BY column_name
    `

    console.log('✓ profiles table exists with columns:')
    profilesCheck.forEach(col => {
      console.log(`  - ${col.column_name}`)
    })

    // Check auth fields
    const authFields = ['id', 'email', 'password_hash', 'display_name', 'created_at', 'updated_at']
    const columnNames = profilesCheck.map(col => col.column_name)
    const missingFields = authFields.filter(field => !columnNames.includes(field))

    if (missingFields.length === 0) {
      console.log('\n✓ All required authentication fields exist!')
    } else {
      console.log('\n✗ Missing fields:', missingFields)
      process.exit(1)
    }

    // Count tables
    const tablesCheck = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    console.log(`\n✓ Found ${tablesCheck.length} tables:`)
    tablesCheck.forEach(table => {
      console.log(`  - ${table.table_name}`)
    })

    // Check for sample emotions
    const emotionsCheck = await sql`SELECT COUNT(*) as count FROM emotions`
    console.log(`\n✓ Emotions table has ${emotionsCheck[0].count} records`)

    console.log('\n[SUCCESS] Database is properly configured and ready for use!')
    console.log('[NEXT] Run: npm run dev')

  } catch (error) {
    console.error('[ERROR] Database verification failed:', error.message)
    console.error('[INFO] Check that:')
    console.error('  1. DATABASE_URL is correct')
    console.error('  2. Neon database is accessible')
    console.error('  3. Migration scripts have been executed')
    process.exit(1)
  }
}

verifyDatabase()
