# Neon Migration Guide

This guide explains how to migrate your components from Supabase to Neon.

## Quick Comparison

### Before (Supabase)
```typescript
import { createClient } from "@/lib/supabase/server"

export async function saveCheckIn(data) {
  const supabase = await createClient()
  const { data: checkIn, error } = await supabase
    .from("check_ins")
    .insert(...)
    .select()
    .single()
}
```

### After (Neon)
```typescript
import { sql } from '@/lib/neon/client'

export async function saveCheckInNeon(data) {
  const result = await sql`
    INSERT INTO check_ins (...)
    VALUES (...)
    RETURNING *
  `
}
```

## Migration Steps by Feature

### 1. Check-in Components

**Old (Supabase):**
```typescript
import { saveCheckIn } from '@/app/actions/check-in'

const result = await saveCheckIn({
  userId: user.id,
  emotionId: emotion,
  intensity: 5,
  triggers: [],
})
```

**New (Neon):**
```typescript
import { saveCheckInNeon } from '@/app/actions/neon-check-in'

const result = await saveCheckInNeon({
  userId: user.id,
  emotionId: emotion,
  intensity: 5,
  triggers: [],
})
```

### 2. Journal Entry Components

**Old (Supabase):**
```typescript
import { saveJournalEntry } from '@/app/actions/journal'

await saveJournalEntry({
  userId,
  emotionId,
  title,
  content,
})
```

**New (Neon):**
```typescript
import { saveJournalEntryNeon } from '@/app/actions/neon-journal'

await saveJournalEntryNeon({
  userId,
  emotionId,
  title,
  content,
})
```

### 3. Mood Wall Components

**Old (Supabase):**
```typescript
import { saveMoodPost } from '@/app/actions/mood-wall'

await saveMoodPost({
  userId,
  emotionId,
  content,
  intensity,
})
```

**New (Neon):**
```typescript
import { createMoodPostNeon } from '@/app/actions/neon-mood-wall'

await createMoodPostNeon({
  userId,
  emotionId,
  content,
  intensity,
})
```

### 4. Organization Components

**Old (Supabase):**
```typescript
import { createOrganization } from '@/app/actions/organizations'

await createOrganization({
  name,
  description,
  ownerId: user.id,
})
```

**New (Neon):**
```typescript
import { createOrganizationNeon } from '@/app/actions/neon-organizations'

await createOrganizationNeon({
  name,
  description,
  ownerId: user.id,
})
```

## Component Update Checklist

- [ ] emotion-check-in.tsx - Update check-in save calls
- [ ] check-in-modal.tsx - Update check-in modal imports
- [ ] journal-entry-form.tsx - Update journal entry save calls
- [ ] mood-post-card.tsx - Update mood post creation/deletion
- [ ] create-mood-post-button.tsx - Update mood post creation
- [ ] organization-card.tsx - Update organization actions
- [ ] create-organization-modal.tsx - Update organization creation
- [ ] therapist-registration-modal.tsx - Update therapist profile save
- [ ] analytics/page.tsx - Update emotion data fetching
- [ ] journal/page.tsx - Update journal entry fetching
- [ ] mood-wall/page.tsx - Update mood posts fetching
- [ ] organizations/page.tsx - Update organization fetching
- [ ] leaderboard/page.tsx - Update leaderboard data fetching
- [ ] profile/page.tsx - Update profile data and badge fetching

## Key Differences

### Data Types

| Supabase | Neon |
|----------|------|
| `auth.users(id)` | User ID as `TEXT` |
| `UUID` | `UUID` |
| RLS policies | Row-level filtering in queries |
| `.select()` | Native SQL `SELECT` |
| `.insert()` | Native SQL `INSERT` |
| `.update()` | Native SQL `UPDATE` |
| `.delete()` | Native SQL `DELETE` |

### Error Handling

**Supabase:**
```typescript
if (error) {
  return { success: false, error: error.message }
}
```

**Neon:**
```typescript
try {
  const result = await sql`...`
} catch (error) {
  return { success: false, error: error.message }
}
```

### Return Values

**Supabase:**
```typescript
const { data, error } = await supabase...
if (data) { ... }
```

**Neon:**
```typescript
const result = await sql`...`
if (result && result.length > 0) { ... }
```

## Authentication

The authentication flow remains the same. Users will still use Auth0, Google, or other providers configured in your app. The only change is the database storage layer:

- **Old:** Supabase handles auth + database
- **New:** Auth0/Google (or Clerk) handles auth, Neon stores data

Make sure to sync user data to the `profiles` table when users sign up:

```typescript
import { sql } from '@/lib/neon/client'

export async function createUserProfile(userId, email, displayName) {
  return await sql`
    INSERT INTO profiles (id, email, display_name)
    VALUES (${userId}, ${email}, ${displayName})
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      display_name = EXCLUDED.display_name
    RETURNING *
  `
}
```

## Testing

Before deploying, test:

1. **Check-ins**: Create and retrieve check-ins
2. **Journal**: Save and fetch journal entries
3. **Mood Wall**: Create posts, add reactions, comment
4. **Organizations**: Create org, join, manage members
5. **Therapists**: Register and book therapists
6. **Analytics**: Load emotion charts and insights
7. **Badges**: Earn and display badges

## Common Issues & Solutions

### Issue: "Column does not exist"
**Solution:** Ensure column names match schema exactly (check NEON_SETUP.md)

### Issue: "Null value in not null column"
**Solution:** Provide all required fields when inserting

### Issue: "Access denied"
**Solution:** Remember Neon has no RLS - implement authorization in your server actions

### Issue: "Timeout"
**Solution:** Check Neon dashboard for active queries, optimize large queries with LIMIT/OFFSET

## Data Migration (Optional)

To migrate existing data from Supabase to Neon:

1. Export tables from Supabase as CSV/JSON
2. Transform data if needed (UUID conversions, etc.)
3. Import to Neon using `COPY` or INSERT statements
4. Verify data integrity
5. Update application code to use Neon

Example migration script can be created if needed.

## Rollback Plan

If you need to revert to Supabase:

1. Keep old Supabase actions in git history
2. Create feature branch for Neon migration
3. Keep Supabase client library installed
4. Revert imports and action calls if needed

## Performance Tips

1. **Use indexes** - All recommended indexes are in the schema
2. **Parameterized queries** - Always use `${variable}` syntax
3. **Batch operations** - Group multiple inserts when possible
4. **Pagination** - Use LIMIT/OFFSET for large result sets
5. **Connection pooling** - Neon handles this automatically

## Deployment Checklist

- [ ] DATABASE_URL added to Vercel environment variables
- [ ] Migration script run successfully
- [ ] All components updated to use Neon actions
- [ ] Old Supabase actions can be removed or kept for reference
- [ ] Tests pass locally and in Vercel preview
- [ ] Monitor Neon dashboard after deploy for performance
- [ ] Set up alerts for slow queries (Neon dashboard)

## Support Resources

- Full schema: See `NEON_SETUP.md`
- Server actions: See `app/actions/neon-*.ts` files
- Neon docs: https://neon.tech/docs
- Serverless driver: https://github.com/neondatabase/serverless
