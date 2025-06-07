import type React from "react"
import { AuthProvider } from "../src/contexts/AuthContext"
import "../src/index.css"

export const metadata = {
  title: "HeartBeat - Infrastructure Monitoring Dashboard",
  description: "Real-time monitoring and health tracking for your services",
  icons: {
    icon: "/electrocardiogram.png",
    apple: "/electrocardiogram.png",
    shortcut: "/electrocardiogram.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
