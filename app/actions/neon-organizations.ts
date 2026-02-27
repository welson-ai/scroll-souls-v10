'use server'

import { sql } from '@/lib/neon/client'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

interface CreateOrgData {
  name: string
  description?: string
  ownerId: string
}

export async function createOrganizationNeon(data: CreateOrgData) {
  try {
    // Generate unique access code
    const accessCode = crypto.randomBytes(8).toString('hex').toUpperCase()

    const result = await sql`
      INSERT INTO organizations (name, description, owner_id, access_code)
      VALUES (${data.name}, ${data.description || null}, ${data.ownerId}, ${accessCode})
      RETURNING id, name, access_code, created_at
    `

    if (!result || result.length === 0) {
      return { success: false, error: 'Failed to create organization' }
    }

    const org = result[0]

    // Add owner as member
    await sql`
      INSERT INTO organization_members (org_id, user_id, role)
      VALUES (${org.id}, ${data.ownerId}, 'owner')
    `

    revalidatePath('/organizations')

    return {
      success: true,
      organization: org,
    }
  } catch (error) {
    console.error('[v0] Error creating organization:', error)
    return { success: false, error: 'Failed to create organization' }
  }
}

export async function joinOrganizationNeon(accessCode: string, userId: string) {
  try {
    // Find organization by access code
    const orgResult = await sql`
      SELECT id FROM organizations WHERE access_code = ${accessCode}
    `

    if (!orgResult || orgResult.length === 0) {
      return { success: false, error: 'Invalid access code' }
    }

    const orgId = orgResult[0].id

    // Check if user is already a member
    const memberCheck = await sql`
      SELECT id FROM organization_members
      WHERE org_id = ${orgId} AND user_id = ${userId}
    `

    if (memberCheck && memberCheck.length > 0) {
      return { success: false, error: 'You are already a member of this organization' }
    }

    // Add user as member
    const result = await sql`
      INSERT INTO organization_members (org_id, user_id, role)
      VALUES (${orgId}, ${userId}, 'member')
      RETURNING org_id, joined_at
    `

    revalidatePath('/organizations')

    return {
      success: true,
      orgId: result[0].org_id,
    }
  } catch (error) {
    console.error('[v0] Error joining organization:', error)
    return { success: false, error: 'Failed to join organization' }
  }
}

export async function getOrganizationsNeon(userId: string) {
  try {
    const result = await sql`
      SELECT 
        o.id,
        o.name,
        o.description,
        o.owner_id,
        o.created_at,
        om.role,
        om.joined_at,
        (SELECT COUNT(*) FROM organization_members WHERE org_id = o.id)::INT as member_count
      FROM organizations o
      JOIN organization_members om ON o.id = om.org_id
      WHERE om.user_id = ${userId}
      ORDER BY o.created_at DESC
    `

    return { success: true, data: result }
  } catch (error) {
    console.error('[v0] Error fetching organizations:', error)
    return { success: false, error: 'Failed to fetch organizations' }
  }
}

export async function getOrganizationNeon(orgId: string, userId: string) {
  try {
    // Check if user is a member
    const memberCheck = await sql`
      SELECT role FROM organization_members
      WHERE org_id = ${orgId} AND user_id = ${userId}
    `

    if (!memberCheck || memberCheck.length === 0) {
      return { success: false, error: 'You do not have access to this organization' }
    }

    const result = await sql`
      SELECT 
        o.id,
        o.name,
        o.description,
        o.owner_id,
        o.access_code,
        o.created_at,
        (SELECT COUNT(*) FROM organization_members WHERE org_id = o.id)::INT as member_count
      FROM organizations o
      WHERE o.id = ${orgId}
    `

    if (!result || result.length === 0) {
      return { success: false, error: 'Organization not found' }
    }

    return {
      success: true,
      data: {
        ...result[0],
        userRole: memberCheck[0].role,
      },
    }
  } catch (error) {
    console.error('[v0] Error fetching organization:', error)
    return { success: false, error: 'Failed to fetch organization' }
  }
}

export async function getOrganizationMembersNeon(orgId: string, userId: string) {
  try {
    // Check if user is a member
    const memberCheck = await sql`
      SELECT role FROM organization_members
      WHERE org_id = ${orgId} AND user_id = ${userId}
    `

    if (!memberCheck || memberCheck.length === 0) {
      return { success: false, error: 'You do not have access to this organization' }
    }

    const result = await sql`
      SELECT 
        om.id,
        om.user_id,
        om.role,
        om.joined_at,
        p.display_name,
        p.avatar_url
      FROM organization_members om
      JOIN profiles p ON om.user_id = p.id
      WHERE om.org_id = ${orgId}
      ORDER BY om.joined_at ASC
    `

    return { success: true, data: result }
  } catch (error) {
    console.error('[v0] Error fetching organization members:', error)
    return { success: false, error: 'Failed to fetch organization members' }
  }
}

export async function updateOrganizationNeon(orgId: string, userId: string, data: Partial<CreateOrgData>) {
  try {
    // Check if user is owner
    const ownerCheck = await sql`
      SELECT role FROM organization_members
      WHERE org_id = ${orgId} AND user_id = ${userId} AND role = 'owner'
    `

    if (!ownerCheck || ownerCheck.length === 0) {
      return { success: false, error: 'Only organization owners can update the organization' }
    }

    const result = await sql`
      UPDATE organizations
      SET 
        name = COALESCE(${data.name || null}, name),
        description = COALESCE(${data.description || null}, description),
        updated_at = NOW()
      WHERE id = ${orgId}
      RETURNING id, name, description, updated_at
    `

    if (!result || result.length === 0) {
      return { success: false, error: 'Organization not found' }
    }

    revalidatePath('/organizations')

    return { success: true, data: result[0] }
  } catch (error) {
    console.error('[v0] Error updating organization:', error)
    return { success: false, error: 'Failed to update organization' }
  }
}

export async function removeOrganizationMemberNeon(orgId: string, memberId: string, userId: string) {
  try {
    // Check if user is owner
    const ownerCheck = await sql`
      SELECT role FROM organization_members
      WHERE org_id = ${orgId} AND user_id = ${userId} AND role = 'owner'
    `

    if (!ownerCheck || ownerCheck.length === 0) {
      return { success: false, error: 'Only organization owners can remove members' }
    }

    // Prevent removing owner
    const memberCheck = await sql`
      SELECT role FROM organization_members
      WHERE org_id = ${orgId} AND user_id = ${memberId}
    `

    if (memberCheck && memberCheck.length > 0 && memberCheck[0].role === 'owner') {
      return { success: false, error: 'Cannot remove organization owner' }
    }

    const result = await sql`
      DELETE FROM organization_members
      WHERE org_id = ${orgId} AND user_id = ${memberId}
      RETURNING org_id
    `

    if (!result || result.length === 0) {
      return { success: false, error: 'Member not found' }
    }

    revalidatePath('/organizations')

    return { success: true }
  } catch (error) {
    console.error('[v0] Error removing member:', error)
    return { success: false, error: 'Failed to remove member' }
  }
}
