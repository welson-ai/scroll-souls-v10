# Neon Quick Reference Card

## ⚡ Setup (5 minutes)

```bash
# 1. Add environment variable
DATABASE_URL=postgresql://...neon.tech/...?sslmode=require

# 2. Run migration
psql $DATABASE_URL < scripts/001_neon_setup.sql

# 3. Install dependency (already added to package.json)
npm install
```

## 📝 Using Neon Client

```typescript
import { sql } from '@/lib/neon/client'

// SELECT
const users = await sql`SELECT * FROM profiles WHERE id = ${userId}`

// INSERT
const result = await sql`
  INSERT INTO check_ins (user_id, emotion_id, intensity)
  VALUES (${userId}, ${emotionId}, 5)
  RETURNING id, created_at
`

// UPDATE
await sql`UPDATE profiles SET total_xp = total_xp + 10 WHERE id = ${userId}`

// DELETE
await sql`DELETE FROM journal_entries WHERE id = ${entryId}`

// Always use ${param} for parameterized queries
```

## 🎯 Server Actions Quick Guide

### Check-ins
```typescript
import { 
  saveCheckInNeon,
  getCheckIns,
  deleteCheckIn
} from '@/app/actions/neon-check-in'

// Save
await saveCheckInNeon({
  userId: user.id,
  emotionId: 'joy',
  intensity: 4,
  triggers: ['good weather', 'friends'],
})

// Get
const checkIns = await getCheckIns(userId, 30)

// Delete
await deleteCheckIn(checkInId, userId)
```

### Journal
```typescript
import {
  saveJournalEntryNeon,
  getJournalEntries,
  toggleFavoriteNeon,
  updateJournalEntryNeon,
  deleteJournalEntryNeon
} from '@/app/actions/neon-journal'

// Save
await saveJournalEntryNeon({
  userId: user.id,
  emotionId: 'peace',
  title: 'Today',
  content: 'Feeling calm...',
})

// Get
const entries = await getJournalEntries(userId, 50)

// Toggle favorite
await toggleFavoriteNeon(entryId, userId, true)

// Update
await updateJournalEntryNeon(entryId, userId, {
  content: 'Updated content',
})

// Delete
await deleteJournalEntryNeon(entryId, userId)
```

### Mood Wall
```typescript
import {
  createMoodPostNeon,
  getMoodPostsNeon,
  addReactionNeon,
  removeReactionNeon,
  createCommentNeon,
  getCommentsNeon,
  deleteMoodPostNeon
} from '@/app/actions/neon-mood-wall'

// Create post
await createMoodPostNeon({
  userId: user.id,
  emotionId: 'joy',
  content: 'Feeling amazing!',
  intensity: 5,
  isAnonymous: true,
})

// Get posts
const posts = await getMoodPostsNeon(50, 0) // limit, offset

// Add reaction
await addReactionNeon(postId, userId, 'support') // or 'relate', 'uplift'

// Remove reaction
await removeReactionNeon(postId, userId)

// Comment
await createCommentNeon(postId, userId, 'This is how I feel too')

// Get comments
const comments = await getCommentsNeon(postId, 20)

// Delete post
await deleteMoodPostNeon(postId, userId)
```

### Organizations
```typescript
import {
  createOrganizationNeon,
  joinOrganizationNeon,
  getOrganizationsNeon,
  getOrganizationNeon,
  getOrganizationMembersNeon,
  updateOrganizationNeon,
  removeOrganizationMemberNeon
} from '@/app/actions/neon-organizations'

// Create
const org = await createOrganizationNeon({
  name: 'Company',
  description: 'Our team',
  ownerId: user.id,
})
// Returns: { success, organization } with access_code

// Join
await joinOrganizationNeon('ACCESSCODE123', userId)

// Get user's orgs
const orgs = await getOrganizationsNeon(userId)

// Get org details
const org = await getOrganizationNeon(orgId, userId)

// Get members
const members = await getOrganizationMembersNeon(orgId, userId)

// Update org
await updateOrganizationNeon(orgId, userId, {
  name: 'New Name',
  description: 'New desc',
})

// Remove member
await removeOrganizationMemberNeon(orgId, memberId, userId)
```

## 📊 Database Tables Cheat Sheet

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `profiles` | Users | id, email, display_name, current_level, total_xp, streak_days |
| `check_ins` | Daily tracking | user_id, emotion_id, intensity, triggers |
| `journal_entries` | Reflections | user_id, emotion_id, title, content, is_favorite |
| `mood_posts` | Community | user_id, emotion_id, content, is_anonymous, org_id |
| `post_reactions` | Engagement | post_id, user_id, reaction_type |
| `emotions` | Reference | id, name, emoji, color_primary |
| `organizations` | Teams | name, owner_id, access_code |
| `organization_members` | Membership | org_id, user_id, role |
| `therapists` | Profiles | user_id, full_name, license_number, status |
| `badges` | Achievements | id, name, icon, requirement_type |
| `user_badges` | Earned | user_id, badge_id, earned_at |

## 🎨 Available Emotions

```
joy      → 😊  #FCD34D
sadness  → 😢  #60A5FA
anger    → 😠  #F87171
fear     → 😨  #A78BFA
stress   → 😰  #6EE7B7
peace    → 😌  #34D399
love     → ❤️   #F9A8D4
tired    → 😴  #D1D5DB
```

## 🔧 Error Handling Pattern

```typescript
// Always wrap in try-catch
try {
  const result = await saveCheckInNeon(data)
  if (result.success) {
    // Use result.checkInId or result data
  } else {
    console.error(result.error)
  }
} catch (error) {
  console.error('[v0] Error:', error)
}
```

## 📈 Database Functions

```typescript
// Update streak (called automatically in saveCheckInNeon)
await sql`SELECT update_user_streak(${userId})`

// Add XP (called automatically in journal/check-in actions)
await sql`SELECT add_user_xp(${userId}, ${xpAmount})`

// Update reaction count (automatic via trigger)
// No manual call needed - happens on INSERT/DELETE of post_reactions
```

## 🔐 Security Notes

✅ **Always use parameterized queries:** `${variable}`  
✅ **Prevent SQL injection:** Never concatenate strings  
✅ **Check user ownership:** Verify user_id in WHERE clause  
✅ **Validate roles:** Check organization member role  
✅ **Anonymize correctly:** Set is_anonymous = true  

❌ **DON'T:** Use template literals without parameters  
❌ **DON'T:** Trust client-sent user IDs without verification  
❌ **DON'T:** Skip authorization checks  

## 🧪 Testing Queries

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check row count
SELECT COUNT(*) FROM profiles;

-- Check specific user
SELECT * FROM profiles WHERE id = 'user-id';

-- Check emotions
SELECT id, name, emoji FROM emotions;

-- Check check-ins
SELECT ci.id, e.name, ci.intensity 
FROM check_ins ci 
JOIN emotions e ON ci.emotion_id = e.id 
LIMIT 10;
```

## 📚 Full Documentation

- **NEON_SETUP.md** - Complete schema details
- **NEON_MIGRATION_GUIDE.md** - Migrate from Supabase
- **NEON_EXAMPLES.md** - Full code examples
- **NEON_README.md** - Overview and setup

## 🚀 Common Tasks

### Get user's recent check-ins
```typescript
const checkIns = await getCheckIns(userId, 7)
```

### Get leaderboard (top users by XP)
```typescript
const leaderboard = await sql`
  SELECT id, display_name, total_xp, current_level
  FROM profiles
  WHERE total_xp > 0
  ORDER BY total_xp DESC
  LIMIT 10
`
```

### Get user's organization posts
```typescript
const posts = await getMoodPostsNeon(50, 0, orgId)
```

### Count user achievements
```typescript
const badges = await sql`
  SELECT COUNT(*) as badge_count
  FROM user_badges
  WHERE user_id = ${userId}
`
```

### Get active challenges
```typescript
const challenges = await sql`
  SELECT * FROM challenges
  WHERE is_active = true
  AND end_date > NOW()
`
```

## 📋 Deployment Checklist

- [ ] DATABASE_URL added to Vercel env vars
- [ ] Migration script executed
- [ ] All components updated with Neon imports
- [ ] Test check-ins work
- [ ] Test journal entries work
- [ ] Test mood wall works
- [ ] Test organizations work
- [ ] Verify analytics page loads
- [ ] Check Neon dashboard shows queries
- [ ] Set up alerts for slow queries

## 🆘 Quick Troubleshooting

| Error | Solution |
|-------|----------|
| `connection refused` | Check DATABASE_URL env var set |
| `relation does not exist` | Run migration script |
| `permission denied` | Check connection string |
| `timeout` | Check Neon project active |
| `null returned` | Query found no rows - handle gracefully |

---

**TL;DR:** Import actions, call them, handle results. See NEON_EXAMPLES.md for real code.
