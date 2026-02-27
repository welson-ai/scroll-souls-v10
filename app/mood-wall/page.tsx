import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { redirect } from "next/navigation"
import BottomNav from "@/components/bottom-nav"
import Link from "next/link"
import MoodPostCard from "@/components/mood-post-card"
import CreateMoodPostButton from "@/components/create-mood-post-button"
import { getCurrentUser } from "@/lib/neon/auth"
import { sql } from "@neondatabase/serverless"

export default async function MoodWallPage() {
  const user = await getCurrentUser()

  if (!user) redirect("/auth/login")

  const posts = await sql`
    SELECT mp.id, mp.content, mp.intensity, mp.reaction_count, mp.created_at, 
           mp.emotion_id, mp.user_id, e.id as emotion_id, e.name, e.emoji, e.color_primary
    FROM mood_posts mp
    LEFT JOIN emotions e ON mp.emotion_id = e.id
    ORDER BY mp.created_at DESC
    LIMIT 50
  `

  console.log("[v0] Fetched mood posts:", posts?.length || 0)

  const userReactions = await sql`
    SELECT post_id, reaction_type
    FROM post_reactions
    WHERE user_id = ${user.id}
  `

  // Group reactions by post_id
  const userReactionMap = new Map<string, string[]>()
  userReactions?.forEach((r: any) => {
    const reactions = userReactionMap.get(r.post_id) || []
    reactions.push(r.reaction_type)
    userReactionMap.set(r.post_id, reactions)
  })

  const allComments = await sql`
    SELECT * FROM post_comments
    ORDER BY created_at ASC
  `

  // Group comments by post_id
  const commentsMap = new Map<string, any[]>()
  allComments?.forEach((comment: any) => {
    const comments = commentsMap.get(comment.post_id) || []
    comments.push(comment)
    commentsMap.set(comment.post_id, comments)
  })

  const emotions = await sql`
    SELECT id, name, emoji, color_primary, color_secondary
    FROM emotions
  `

  return (
    <div className="min-h-svh bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-20">
      <div className="glass border-b">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-4 sm:gap-4 sm:px-6">
          <Button asChild variant="ghost" size="icon">
            <Link href="/home">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold sm:text-xl">Mood Wall</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">Anonymous community sharing</p>
          </div>
          <CreateMoodPostButton emotions={emotions || []} />
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-4 sm:py-6">
        {posts && posts.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {posts.map((post: any) => (
              <MoodPostCard
                key={post.id}
                post={{
                  id: post.id,
                  content: post.content,
                  intensity: post.intensity,
                  reaction_count: post.reaction_count,
                  created_at: post.created_at,
                  emotion_id: post.emotion_id,
                  user_id: post.user_id,
                  emotions: {
                    id: post.emotion_id,
                    name: post.name,
                    emoji: post.emoji,
                    color_primary: post.color_primary,
                  },
                }}
                userReactions={userReactionMap.get(post.id) || []}
                userId={user.id}
                comments={commentsMap.get(post.id) || []}
              />
            ))}
          </div>
        ) : (
          <Card className="glass border-0 p-8 text-center sm:p-12">
            <div className="mb-4 text-4xl sm:text-6xl">💭</div>
            <p className="mb-2 text-base font-semibold sm:text-lg">No posts yet</p>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Be the first to share your feelings with the community!
            </p>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
