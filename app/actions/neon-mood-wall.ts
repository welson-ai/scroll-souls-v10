'use server'

import { sql } from '@/lib/neon/client'
import { revalidatePath } from 'next/cache'

interface MoodPostData {
  userId: string
  emotionId: string
  content: string
  intensity: number
  isAnonymous?: boolean
  orgId?: string
}

export async function createMoodPostNeon(data: MoodPostData) {
  try {
    const postResult = await sql`
      INSERT INTO mood_posts (user_id, emotion_id, content, intensity, is_anonymous, org_id)
      VALUES (${data.userId}, ${data.emotionId}, ${data.content}, ${data.intensity}, ${data.isAnonymous ?? true}, ${data.orgId || null})
      RETURNING id, created_at
    `

    if (!postResult || postResult.length === 0) {
      return { success: false, error: 'Failed to create mood post' }
    }

    revalidatePath('/mood-wall')

    return {
      success: true,
      postId: postResult[0].id,
      createdAt: postResult[0].created_at,
    }
  } catch (error) {
    console.error('[v0] Error creating mood post:', error)
    return { success: false, error: 'Failed to create mood post' }
  }
}

export async function getMoodPostsNeon(limit = 50, offset = 0, orgId?: string) {
  try {
    const result = await sql`
      SELECT 
        mp.id,
        mp.user_id,
        mp.emotion_id,
        mp.content,
        mp.intensity,
        mp.is_anonymous,
        mp.reaction_count,
        mp.created_at,
        mp.updated_at,
        e.name as emotion_name,
        e.emoji,
        e.color_primary
      FROM mood_posts mp
      JOIN emotions e ON mp.emotion_id = e.id
      ${orgId ? sql`WHERE mp.org_id = ${orgId}` : sql`WHERE mp.org_id IS NULL`}
      ORDER BY mp.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    return { success: true, data: result }
  } catch (error) {
    console.error('[v0] Error fetching mood posts:', error)
    return { success: false, error: 'Failed to fetch mood posts' }
  }
}

export async function addReactionNeon(postId: string, userId: string, reactionType: 'support' | 'relate' | 'uplift') {
  try {
    // Check if reaction already exists
    const existingReaction = await sql`
      SELECT id FROM post_reactions
      WHERE post_id = ${postId} AND user_id = ${userId}
    `

    if (existingReaction && existingReaction.length > 0) {
      // Update existing reaction
      await sql`
        UPDATE post_reactions
        SET reaction_type = ${reactionType}
        WHERE post_id = ${postId} AND user_id = ${userId}
      `
    } else {
      // Insert new reaction
      await sql`
        INSERT INTO post_reactions (post_id, user_id, reaction_type)
        VALUES (${postId}, ${userId}, ${reactionType})
      `
    }

    revalidatePath('/mood-wall')

    return { success: true }
  } catch (error) {
    console.error('[v0] Error adding reaction:', error)
    return { success: false, error: 'Failed to add reaction' }
  }
}

export async function removeReactionNeon(postId: string, userId: string) {
  try {
    await sql`
      DELETE FROM post_reactions
      WHERE post_id = ${postId} AND user_id = ${userId}
    `

    revalidatePath('/mood-wall')

    return { success: true }
  } catch (error) {
    console.error('[v0] Error removing reaction:', error)
    return { success: false, error: 'Failed to remove reaction' }
  }
}

export async function createCommentNeon(postId: string, userId: string, content: string, isAnonymous = true) {
  try {
    const commentResult = await sql`
      INSERT INTO post_comments (post_id, user_id, content, is_anonymous)
      VALUES (${postId}, ${userId}, ${content}, ${isAnonymous})
      RETURNING id, created_at
    `

    if (!commentResult || commentResult.length === 0) {
      return { success: false, error: 'Failed to create comment' }
    }

    revalidatePath('/mood-wall')

    return {
      success: true,
      commentId: commentResult[0].id,
    }
  } catch (error) {
    console.error('[v0] Error creating comment:', error)
    return { success: false, error: 'Failed to create comment' }
  }
}

export async function getCommentsNeon(postId: string, limit = 20) {
  try {
    const result = await sql`
      SELECT 
        id,
        post_id,
        user_id,
        content,
        is_anonymous,
        created_at
      FROM post_comments
      WHERE post_id = ${postId}
      ORDER BY created_at ASC
      LIMIT ${limit}
    `

    return { success: true, data: result }
  } catch (error) {
    console.error('[v0] Error fetching comments:', error)
    return { success: false, error: 'Failed to fetch comments' }
  }
}

export async function deleteMoodPostNeon(postId: string, userId: string) {
  try {
    const result = await sql`
      DELETE FROM mood_posts
      WHERE id = ${postId} AND user_id = ${userId}
      RETURNING id
    `

    if (!result || result.length === 0) {
      return { success: false, error: 'Mood post not found' }
    }

    revalidatePath('/mood-wall')

    return { success: true }
  } catch (error) {
    console.error('[v0] Error deleting mood post:', error)
    return { success: false, error: 'Failed to delete mood post' }
  }
}
