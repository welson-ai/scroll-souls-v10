'use server'

import { sql } from '@/lib/neon/client'
import { revalidatePath } from 'next/cache'

interface JournalEntryData {
  userId: string
  emotionId: string
  title: string
  content: string
  checkInId?: string
}

export async function saveJournalEntryNeon(data: JournalEntryData) {
  try {
    // Insert journal entry
    const entryResult = await sql`
      INSERT INTO journal_entries (user_id, emotion_id, title, content, check_in_id)
      VALUES (${data.userId}, ${data.emotionId}, ${data.title || null}, ${data.content}, ${data.checkInId || null})
      RETURNING id, created_at
    `

    if (!entryResult || entryResult.length === 0) {
      return { success: false, error: 'Failed to create journal entry' }
    }

    const entryId = entryResult[0].id

    try {
      // Add XP for journal entry (20 XP per entry)
      await sql`
        SELECT add_user_xp(${data.userId}, 20)
      `
    } catch (error) {
      console.error('[v0] Error adding XP:', error)
    }

    revalidatePath('/journal')
    revalidatePath('/profile')

    return { success: true, entryId }
  } catch (error) {
    console.error('[v0] Error in saveJournalEntryNeon:', error)
    return { success: false, error: 'Failed to save journal entry' }
  }
}

export async function getJournalEntries(userId: string, limit = 50) {
  try {
    const result = await sql`
      SELECT 
        je.id,
        je.user_id,
        je.emotion_id,
        je.title,
        je.content,
        je.is_favorite,
        je.created_at,
        je.updated_at,
        e.name as emotion_name,
        e.emoji,
        e.color_primary
      FROM journal_entries je
      JOIN emotions e ON je.emotion_id = e.id
      WHERE je.user_id = ${userId}
      ORDER BY je.created_at DESC
      LIMIT ${limit}
    `

    return { success: true, data: result }
  } catch (error) {
    console.error('[v0] Error fetching journal entries:', error)
    return { success: false, error: 'Failed to fetch journal entries' }
  }
}

export async function getJournalEntry(entryId: string, userId: string) {
  try {
    const result = await sql`
      SELECT 
        je.id,
        je.user_id,
        je.emotion_id,
        je.title,
        je.content,
        je.is_favorite,
        je.created_at,
        je.updated_at,
        e.name as emotion_name,
        e.emoji,
        e.color_primary
      FROM journal_entries je
      JOIN emotions e ON je.emotion_id = e.id
      WHERE je.id = ${entryId} AND je.user_id = ${userId}
    `

    if (!result || result.length === 0) {
      return { success: false, error: 'Journal entry not found' }
    }

    return { success: true, data: result[0] }
  } catch (error) {
    console.error('[v0] Error fetching journal entry:', error)
    return { success: false, error: 'Failed to fetch journal entry' }
  }
}

export async function toggleFavoriteNeon(entryId: string, userId: string, isFavorite: boolean) {
  try {
    const result = await sql`
      UPDATE journal_entries
      SET is_favorite = ${isFavorite}
      WHERE id = ${entryId} AND user_id = ${userId}
      RETURNING id
    `

    if (!result || result.length === 0) {
      return { success: false, error: 'Journal entry not found' }
    }

    revalidatePath('/journal')
    revalidatePath(`/journal/${entryId}`)

    return { success: true }
  } catch (error) {
    console.error('[v0] Error toggling favorite:', error)
    return { success: false }
  }
}

export async function deleteJournalEntryNeon(entryId: string, userId: string) {
  try {
    const result = await sql`
      DELETE FROM journal_entries
      WHERE id = ${entryId} AND user_id = ${userId}
      RETURNING id
    `

    if (!result || result.length === 0) {
      return { success: false, error: 'Journal entry not found' }
    }

    revalidatePath('/journal')

    return { success: true }
  } catch (error) {
    console.error('[v0] Error deleting entry:', error)
    return { success: false }
  }
}

export async function updateJournalEntryNeon(entryId: string, userId: string, data: Partial<JournalEntryData>) {
  try {
    const result = await sql`
      UPDATE journal_entries
      SET 
        title = COALESCE(${data.title || null}, title),
        content = COALESCE(${data.content || null}, content),
        emotion_id = COALESCE(${data.emotionId || null}, emotion_id),
        updated_at = NOW()
      WHERE id = ${entryId} AND user_id = ${userId}
      RETURNING id, updated_at
    `

    if (!result || result.length === 0) {
      return { success: false, error: 'Journal entry not found' }
    }

    revalidatePath('/journal')
    revalidatePath(`/journal/${entryId}`)

    return { success: true, data: result[0] }
  } catch (error) {
    console.error('[v0] Error updating journal entry:', error)
    return { success: false, error: 'Failed to update journal entry' }
  }
}
