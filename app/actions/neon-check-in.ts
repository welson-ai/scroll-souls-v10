'use server'

import { sql } from '@/lib/neon/client'
import { revalidatePath } from 'next/cache'

interface CheckInData {
  userId: string
  emotionId: string
  intensity: number
  triggers: string[]
  isAnonymous?: boolean
  orgId?: string
}

export async function saveCheckInNeon(data: CheckInData) {
  try {
    // Insert check-in
    const checkInResult = await sql`
      INSERT INTO check_ins (user_id, emotion_id, intensity, triggers, org_id)
      VALUES (${data.userId}, ${data.emotionId}, ${data.intensity}, ${data.triggers}, ${data.orgId || null})
      RETURNING id, created_at
    `

    if (!checkInResult || checkInResult.length === 0) {
      return { success: false, error: 'Failed to create check-in' }
    }

    const checkInId = checkInResult[0].id

    if (!data.isAnonymous) {
      try {
        // Update user streak
        await sql`
          SELECT update_user_streak(${data.userId})
        `

        // Add XP
        await sql`
          SELECT add_user_xp(${data.userId}, 10)
        `
      } catch (error) {
        console.error('[v0] Error updating user stats:', error)
      }

      revalidatePath('/check-in')
      revalidatePath('/analytics')
      revalidatePath('/profile')
    } else {
      revalidatePath('/check-in')
    }

    return {
      success: true,
      checkInId,
      newBadges: [],
      levelUp: false,
    }
  } catch (error) {
    console.error('[v0] Error in saveCheckInNeon:', error)
    return { success: false, error: 'Failed to save check-in' }
  }
}

export async function getCheckIns(userId: string, limit = 30) {
  try {
    const result = await sql`
      SELECT 
        ci.id,
        ci.user_id,
        ci.emotion_id,
        ci.intensity,
        ci.triggers,
        ci.created_at,
        e.name as emotion_name,
        e.emoji,
        e.color_primary
      FROM check_ins ci
      JOIN emotions e ON ci.emotion_id = e.id
      WHERE ci.user_id = ${userId}
      ORDER BY ci.created_at DESC
      LIMIT ${limit}
    `

    return { success: true, data: result }
  } catch (error) {
    console.error('[v0] Error fetching check-ins:', error)
    return { success: false, error: 'Failed to fetch check-ins' }
  }
}

export async function deleteCheckIn(checkInId: string, userId: string) {
  try {
    const result = await sql`
      DELETE FROM check_ins
      WHERE id = ${checkInId} AND user_id = ${userId}
      RETURNING id
    `

    if (!result || result.length === 0) {
      return { success: false, error: 'Check-in not found' }
    }

    revalidatePath('/check-in')
    revalidatePath('/analytics')

    return { success: true }
  } catch (error) {
    console.error('[v0] Error deleting check-in:', error)
    return { success: false, error: 'Failed to delete check-in' }
  }
}
