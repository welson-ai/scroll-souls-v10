import { redirect } from "next/navigation"
import { getCurrentUser, getUserProfile } from "@/lib/neon/auth"
import { sql } from "@neondatabase/serverless"
import EmotionCheckIn from "@/components/emotion-check-in"
import BottomNav from "@/components/bottom-nav"

export default async function CheckInPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch emotions from database
  const emotions = await sql`
    SELECT id, name, emoji, color_primary, color_secondary
    FROM emotions
    ORDER BY id
  `

  // Fetch user profile
  const profile = await getUserProfile(user.id)

  return (
    <>
      <EmotionCheckIn emotions={emotions || []} profile={profile} userId={user.id} />
      <BottomNav />
    </>
  )
}
