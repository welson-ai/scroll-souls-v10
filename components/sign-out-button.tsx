"use client"

import { useRouter } from "next/navigation"
import { logoutUser } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"

export default function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    await logoutUser()
    router.push("/")
  }

  return (
    <Button variant="outline" onClick={handleSignOut} className="bg-transparent">
      Sign Out
    </Button>
  )
}
