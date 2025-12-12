import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
// import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Scroll Souls - Your Emotional Wellness Companion",
  description:
    "Track your emotions, journal your thoughts, and gain insights into your emotional well-being with Scroll Souls.",
  generator: "v0.app",
  icons: {
  
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        {/* <Analytics /> */}
      </body>
    </html>
  )
}
