# Neon Implementation Examples

Complete examples for using the Neon database with Scroll Souls components.

## 1. Check-in Component Example

### Component Usage
```typescript
// components/emotion-check-in.tsx
'use client'

import { useState } from 'react'
import { saveCheckInNeon } from '@/app/actions/neon-check-in'
import { useAuth } from '@/hooks/use-auth' // Your auth hook

export function EmotionCheckIn() {
  const { user } = useAuth()
  const [selectedEmotion, setSelectedEmotion] = useState('')
  const [intensity, setIntensity] = useState(3)
  const [triggers, setTriggers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const emotions = [
    { id: 'joy', name: 'Joy', emoji: '😊' },
    { id: 'sadness', name: 'Sadness', emoji: '😢' },
    { id: 'anger', name: 'Anger', emoji: '😠' },
    { id: 'fear', name: 'Fear', emoji: '😨' },
    { id: 'stress', name: 'Stress', emoji: '😰' },
    { id: 'peace', name: 'Peace', emoji: '😌' },
    { id: 'love', name: 'Love', emoji: '❤️' },
    { id: 'tired', name: 'Tired', emoji: '😴' },
  ]

  async function handleCheckIn() {
    if (!selectedEmotion || !user) return

    setLoading(true)
    try {
      const result = await saveCheckInNeon({
        userId: user.id,
        emotionId: selectedEmotion,
        intensity,
        triggers,
      })

      if (result.success) {
        // Show success message
        setSelectedEmotion('')
        setIntensity(3)
        setTriggers([])
        // Optionally show toast
      } else {
        console.error('[v0] Check-in failed:', result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {emotions.map((emotion) => (
          <button
            key={emotion.id}
            onClick={() => setSelectedEmotion(emotion.id)}
            className={`p-4 rounded-lg text-center ${
              selectedEmotion === emotion.id
                ? 'ring-2 ring-primary'
                : 'border border-gray-200'
            }`}
          >
            <div className="text-3xl">{emotion.emoji}</div>
            <div className="text-sm">{emotion.name}</div>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <label>Intensity: {intensity}</label>
        <input
          type="range"
          min="1"
          max="5"
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
        />
      </div>

      <button
        onClick={handleCheckIn}
        disabled={!selectedEmotion || loading}
        className="w-full bg-primary text-white py-2 rounded-lg"
      >
        {loading ? 'Saving...' : 'Check In'}
      </button>
    </div>
  )
}
```

## 2. Journal Entry Component Example

### Component Usage
```typescript
// components/journal-entry-form.tsx
'use client'

import { useState } from 'react'
import { saveJournalEntryNeon } from '@/app/actions/neon-journal'
import { useAuth } from '@/hooks/use-auth'

export function JournalEntryForm() {
  const { user } = useAuth()
  const [emotion, setEmotion] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!emotion || !content || !user) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await saveJournalEntryNeon({
        userId: user.id,
        emotionId: emotion,
        title: title || `Entry on ${new Date().toLocaleDateString()}`,
        content,
      })

      if (result.success) {
        // Reset form
        setEmotion('')
        setTitle('')
        setContent('')
        // Show success message
      } else {
        setError(result.error || 'Failed to save entry')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="text-red-500">{error}</div>}

      <div>
        <label>Select Emotion</label>
        <select
          value={emotion}
          onChange={(e) => setEmotion(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Choose an emotion...</option>
          <option value="joy">Joy 😊</option>
          <option value="sadness">Sadness 😢</option>
          <option value="anger">Anger 😠</option>
          <option value="fear">Fear 😨</option>
          <option value="stress">Stress 😰</option>
          <option value="peace">Peace 😌</option>
          <option value="love">Love ❤️</option>
          <option value="tired">Tired 😴</option>
        </select>
      </div>

      <div>
        <label>Title (Optional)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your entry a title..."
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label>Write your thoughts</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="How are you feeling today?..."
          rows={6}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !emotion || !content}
        className="w-full bg-primary text-white py-2 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Entry'}
      </button>
    </div>
  )
}
```

## 3. Fetching Journal Entries

### Server Component
```typescript
// app/journal/page.tsx
import { sql } from '@/lib/neon/client'
import { JournalEntryList } from '@/components/journal-entry-list'
import { getSession } from '@/lib/auth' // Your auth function

export default async function JournalPage() {
  const session = await getSession()

  if (!session?.user) {
    return <div>Please log in to view your journal</div>
  }

  const entries = await sql`
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
    WHERE je.user_id = ${session.user.id}
    ORDER BY je.created_at DESC
    LIMIT 50
  `

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">My Journal</h1>
      <JournalEntryList entries={entries} />
    </div>
  )
}
```

## 4. Mood Wall Posts Example

### Create Post Component
```typescript
// components/create-mood-post-button.tsx
'use client'

import { useState } from 'react'
import { createMoodPostNeon } from '@/app/actions/neon-mood-wall'
import { useAuth } from '@/hooks/use-auth'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function CreateMoodPostButton() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [emotion, setEmotion] = useState('')
  const [content, setContent] = useState('')
  const [intensity, setIntensity] = useState(3)
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [loading, setLoading] = useState(false)

  async function handleCreatePost() {
    if (!emotion || !content || !user) return

    setLoading(true)
    try {
      const result = await createMoodPostNeon({
        userId: user.id,
        emotionId: emotion,
        content,
        intensity,
        isAnonymous,
      })

      if (result.success) {
        // Reset and close
        setOpen(false)
        setEmotion('')
        setContent('')
        setIntensity(3)
        setIsAnonymous(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-primary">
        Share Your Mood
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share on Mood Wall</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <select
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select emotion...</option>
              <option value="joy">Joy 😊</option>
              <option value="sadness">Sadness 😢</option>
              <option value="anger">Anger 😠</option>
              <option value="fear">Fear 😨</option>
              <option value="stress">Stress 😰</option>
              <option value="peace">Peace 😌</option>
              <option value="love">Love ❤️</option>
              <option value="tired">Tired 😴</option>
            </select>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your feelings..."
              rows={4}
              className="w-full border rounded px-3 py-2"
            />

            <div>
              <label>Intensity: {intensity}</label>
              <input
                type="range"
                min="1"
                max="5"
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
              />
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              Post anonymously
            </label>

            <button
              onClick={handleCreatePost}
              disabled={!emotion || !content || loading}
              className="w-full bg-primary text-white py-2 rounded-lg"
            >
              {loading ? 'Posting...' : 'Post to Mood Wall'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

## 5. Organization Management Example

### Create Organization Component
```typescript
// components/create-organization-modal.tsx
'use client'

import { useState } from 'react'
import { createOrganizationNeon } from '@/app/actions/neon-organizations'
import { useAuth } from '@/hooks/use-auth'

export function CreateOrganizationModal({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!name || !user) return

    setLoading(true)
    setError('')

    try {
      const result = await createOrganizationNeon({
        name,
        description,
        ownerId: user.id,
      })

      if (result.success) {
        setName('')
        setDescription('')
        setOpen(false)
        onSuccess?.()
      } else {
        setError(result.error || 'Failed to create organization')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn btn-primary"
      >
        Create Organization
      </button>

      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96 space-y-4">
            <h2 className="text-2xl font-bold">Create Organization</h2>

            {error && <div className="text-red-500">{error}</div>}

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Organization name"
              className="w-full border rounded px-3 py-2"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Organization description (optional)"
              rows={3}
              className="w-full border rounded px-3 py-2"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 border rounded px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name || loading}
                className="flex-1 bg-primary text-white rounded px-4 py-2"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

### Join Organization Component
```typescript
// components/join-organization-button.tsx
'use client'

import { useState } from 'react'
import { joinOrganizationNeon } from '@/app/actions/neon-organizations'
import { useAuth } from '@/hooks/use-auth'

export function JoinOrganizationButton() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin() {
    if (!accessCode || !user) return

    setLoading(true)
    setError('')

    try {
      const result = await joinOrganizationNeon(accessCode, user.id)

      if (result.success) {
        setAccessCode('')
        setOpen(false)
        // Show success
      } else {
        setError(result.error || 'Failed to join organization')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-secondary">
        Join Organization
      </button>

      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96 space-y-4">
            <h2 className="text-2xl font-bold">Join Organization</h2>
            <p className="text-gray-600">Enter the access code provided by the organization</p>

            {error && <div className="text-red-500">{error}</div>}

            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="Enter access code"
              maxLength={16}
              className="w-full border rounded px-3 py-2 uppercase tracking-widest"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 border rounded px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleJoin}
                disabled={!accessCode || loading}
                className="flex-1 bg-primary text-white rounded px-4 py-2"
              >
                {loading ? 'Joining...' : 'Join'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

## 6. Fetching Data on Server Components

### Emotion Analytics
```typescript
// app/analytics/page.tsx
import { sql } from '@/lib/neon/client'
import { getSession } from '@/lib/auth'
import { EmotionChart } from '@/components/emotion-chart'

export default async function AnalyticsPage() {
  const session = await getSession()

  if (!session?.user) {
    return <div>Please log in</div>
  }

  // Get emotion counts for the past 30 days
  const emotionStats = await sql`
    SELECT 
      e.id,
      e.name,
      e.emoji,
      e.color_primary,
      COUNT(*) as count,
      AVG(ci.intensity)::INT as avg_intensity
    FROM check_ins ci
    JOIN emotions e ON ci.emotion_id = e.id
    WHERE ci.user_id = ${session.user.id}
      AND ci.created_at > NOW() - INTERVAL '30 days'
    GROUP BY e.id, e.name, e.emoji, e.color_primary
    ORDER BY count DESC
  `

  // Get user stats
  const userStats = await sql`
    SELECT 
      current_level,
      total_xp,
      streak_days,
      last_check_in_date
    FROM profiles
    WHERE id = ${session.user.id}
  `

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Your Emotion Analytics</h1>

      {userStats.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Level</div>
            <div className="text-3xl font-bold">{userStats[0].current_level}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total XP</div>
            <div className="text-3xl font-bold">{userStats[0].total_xp}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Current Streak</div>
            <div className="text-3xl font-bold">{userStats[0].streak_days}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Last Check-in</div>
            <div className="text-lg font-bold">
              {userStats[0].last_check_in_date
                ? new Date(userStats[0].last_check_in_date).toLocaleDateString()
                : 'Never'}
            </div>
          </div>
        </div>
      )}

      <EmotionChart data={emotionStats} />
    </div>
  )
}
```

## 7. Error Handling Pattern

```typescript
// Standard error handling for all Neon operations
export async function safeNeonQuery<T>(
  queryFn: () => Promise<T>,
  errorMessage = 'Database operation failed'
) {
  try {
    const result = await queryFn()
    return { success: true, data: result }
  } catch (error) {
    console.error('[v0] Database error:', error)
    return { success: false, error: errorMessage }
  }
}

// Usage
const result = await safeNeonQuery(
  () => sql`SELECT * FROM profiles WHERE id = ${userId}`,
  'Failed to fetch user profile'
)

if (result.success) {
  // Use result.data
} else {
  // Handle error: result.error
}
```

## 8. Transaction Example

```typescript
// Complex operation with multiple queries
export async function transferCheck InToJournal(
  userId: string,
  checkInId: string,
  journalTitle: string,
  journalContent: string
) {
  try {
    // Fetch check-in
    const checkIn = await sql`
      SELECT * FROM check_ins WHERE id = ${checkInId} AND user_id = ${userId}
    `

    if (!checkIn || checkIn.length === 0) {
      return { success: false, error: 'Check-in not found' }
    }

    // Create journal entry from check-in
    const journalResult = await sql`
      INSERT INTO journal_entries (
        user_id, emotion_id, title, content, check_in_id
      )
      VALUES (
        ${userId},
        ${checkIn[0].emotion_id},
        ${journalTitle},
        ${journalContent},
        ${checkInId}
      )
      RETURNING id, created_at
    `

    // Add XP for journal entry
    await sql`
      SELECT add_user_xp(${userId}, 20)
    `

    return {
      success: true,
      journalId: journalResult[0].id,
    }
  } catch (error) {
    console.error('[v0] Transaction error:', error)
    return { success: false, error: 'Failed to create journal entry' }
  }
}
```

These examples cover the most common use cases. Adapt them to your specific needs!
