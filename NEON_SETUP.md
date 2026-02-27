# Neon Database Setup Guide

This document outlines the Neon PostgreSQL database setup for Scroll Souls, replacing the previous Supabase-based storage.

## Overview

Scroll Souls has been configured to use **Neon**, a serverless PostgreSQL database, to store all application data including:

- User profiles and authentication
- Emotional check-ins and journal entries
- Community mood wall posts and reactions
- Organizations and team management
- Therapist profiles and bookings
- Challenges and gamification data
- Badges and user achievements

## Environment Variables

You need to set the following environment variable in your Vercel project:

```env
DATABASE_URL=postgresql://user:password@ep-xxxx.us-east-1.neon.tech/dbname?sslmode=require
```

This is provided by Neon when you create your database. You can obtain it from your Neon project dashboard.

## Database Schema

### Core Tables

1. **profiles** - User information and gamification stats
   - id, email, display_name, avatar_url
   - current_level, total_xp, streak_days
   - Timestamps for tracking

2. **emotions** - Reference table for 8 core emotions
   - id (joy, sadness, anger, fear, stress, peace, love, tired)
   - name, color_primary, color_secondary, emoji

3. **check_ins** - Daily emotional tracking
   - user_id, emotion_id, intensity (1-5)
   - triggers (array), org_id (for organization-specific tracking)

4. **journal_entries** - Personal reflection entries
   - user_id, emotion_id, title, content
   - check_in_id (optional link to check-in), is_favorite

### Community Tables

5. **mood_posts** - Anonymous emotional sharing on mood wall
   - user_id, emotion_id, content, intensity
   - is_anonymous, org_id (organization-specific posts)
   - reaction_count (JSONB tracking support/relate/uplift)

6. **post_reactions** - User reactions to mood posts
   - post_id, user_id, reaction_type (support/relate/uplift)

7. **post_comments** - Comments on mood posts
   - post_id, user_id, content, is_anonymous

### Organization Tables

8. **organizations** - Team/workspace management
   - name, description, owner_id, access_code

9. **organization_members** - Team membership
   - org_id, user_id, role (owner/therapist/member)

### Therapist System Tables

10. **therapists** - Registered therapist profiles
    - user_id, full_name, email, license_number
    - specialization, years_of_experience, bio
    - status (pending/approved/rejected)

11. **therapist_bookings** - Therapy session bookings
    - therapist_id, user_id, session_date
    - session_type (video/audio/chat/in-person)
    - status (pending/confirmed/completed/cancelled)

12. **therapist_messages** - Chat between therapist and user
    - therapist_id, user_id, sender_type, message

### Gamification Tables

13. **badges** - Achievement definitions
    - id, name, description, icon, requirement_type, requirement_value

14. **user_badges** - Earned achievements
    - user_id, badge_id, earned_at

15. **challenges** - Active challenges/goals
    - title, description, emotion_id
    - target_count, reward_points, date range

16. **user_challenges** - Challenge progress
    - user_id, challenge_id, progress, completed_at

### Social Tables

17. **friendships** - Social connections
    - user_id, friend_id, status (pending/accepted)

18. **mood_insights** - Daily emotional analytics
    - user_id, insight_date
    - dominant_emotion_id, total_check_ins, emotional_variety

## Database Functions

### `update_user_streak(p_user_id TEXT)`

Updates the user's check-in streak based on consistency.

```sql
SELECT update_user_streak(user_id)
```

Returns: streak count and level_up status

### `add_user_xp(p_user_id TEXT, p_xp_amount INT)`

Adds XP to a user and potentially levels them up.

```sql
SELECT add_user_xp(user_id, 10)
```

Returns: new XP total and level_up status

### `update_post_reaction_count()`

Automatically triggered when reactions are added/removed to update the mood_posts reaction_count JSONB field.

## Server Actions

### Check-in Operations (`app/actions/neon-check-in.ts`)

- `saveCheckInNeon(data)` - Create a new check-in
- `getCheckIns(userId, limit)` - Fetch user's check-ins
- `deleteCheckIn(checkInId, userId)` - Delete a check-in

### Journal Operations (`app/actions/neon-journal.ts`)

- `saveJournalEntryNeon(data)` - Create journal entry
- `getJournalEntries(userId, limit)` - Fetch user's entries
- `getJournalEntry(entryId, userId)` - Get single entry
- `toggleFavoriteNeon(entryId, userId, isFavorite)` - Mark as favorite
- `deleteJournalEntryNeon(entryId, userId)` - Delete entry
- `updateJournalEntryNeon(entryId, userId, data)` - Update entry

### Mood Wall Operations (`app/actions/neon-mood-wall.ts`)

- `createMoodPostNeon(data)` - Create mood post
- `getMoodPostsNeon(limit, offset, orgId)` - Fetch mood posts
- `addReactionNeon(postId, userId, reactionType)` - Add reaction
- `removeReactionNeon(postId, userId)` - Remove reaction
- `createCommentNeon(postId, userId, content)` - Add comment
- `getCommentsNeon(postId, limit)` - Fetch comments
- `deleteMoodPostNeon(postId, userId)` - Delete post

### Organization Operations (`app/actions/neon-organizations.ts`)

- `createOrganizationNeon(data)` - Create organization
- `joinOrganizationNeon(accessCode, userId)` - Join via access code
- `getOrganizationsNeon(userId)` - Get user's organizations
- `getOrganizationNeon(orgId, userId)` - Get organization details
- `getOrganizationMembersNeon(orgId, userId)` - Get members list
- `updateOrganizationNeon(orgId, userId, data)` - Update organization
- `removeOrganizationMemberNeon(orgId, memberId, userId)` - Remove member

## Migration Steps

### 1. Create Neon Project

1. Go to [console.neon.tech](https://console.neon.tech)
2. Create a new project
3. Copy the connection string (DATABASE_URL)

### 2. Add Environment Variable

1. Go to Vercel Project Settings → Environment Variables
2. Add `DATABASE_URL` with your Neon connection string

### 3. Run Migration

Execute the migration script to set up the schema:

```bash
# Using psql
psql $DATABASE_URL < scripts/001_neon_setup.sql

# Or using the Neon SQL editor
# Copy and paste the contents of scripts/001_neon_setup.sql into the editor
```

### 4. Update Application Code

The new Neon-specific server actions are ready to use:

- Replace Supabase imports with Neon client imports
- Use the `neon-*` actions instead of the old Supabase actions
- Update component imports accordingly

## Using the Neon Client

Import and use the Neon client in server actions:

```typescript
import { sql } from '@/lib/neon/client'

// Query example
const users = await sql`
  SELECT * FROM profiles WHERE id = ${userId}
`

// Insert example
const result = await sql`
  INSERT INTO profiles (id, email, display_name)
  VALUES (${id}, ${email}, ${name})
  RETURNING id, created_at
`

// Parameterized queries prevent SQL injection
const records = await sql`
  SELECT * FROM journal_entries 
  WHERE user_id = ${userId} AND emotion_id = ${emotionId}
`
```

## Performance Considerations

### Indexes

The database includes optimized indexes for:
- User lookups (profiles, organization_members)
- Time-based queries (check_ins, journal_entries, mood_posts)
- Foreign key relationships (all tables)
- Common filters (emotion_id, org_id, status fields)

### Connection Pooling

Neon handles connection pooling automatically at the serverless layer. No additional configuration needed for Next.js applications.

## Troubleshooting

### Connection Issues

If you get "connection refused" errors:
1. Verify DATABASE_URL is set in Vercel environment variables
2. Check that the Neon project is active (not suspended)
3. Ensure the connection string includes `?sslmode=require`

### Query Errors

- Use parameterized queries (`${variable}`) to prevent SQL injection
- Check that table/column names match the schema exactly
- Verify user IDs are strings (not UUIDs) for the profiles table

### Performance Issues

- Check query execution times in Neon dashboard
- Ensure indexes are being used (check EXPLAIN plans)
- Consider query optimization for large datasets

## Next Steps

1. Migrate existing Supabase data to Neon (export/import scripts can be created)
2. Update all components to use new Neon server actions
3. Remove Supabase dependencies from package.json
4. Test all features with Neon database
5. Monitor performance in Neon dashboard

## Support

- Neon Docs: https://neon.tech/docs
- Neon API: https://api-docs.neon.tech
- Serverless Driver Docs: https://neon.tech/docs/serverless/serverless-driver
