"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "../lib/auth"
import * as authAPI from "../lib/auth"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  
  useEffect(() => {
    checkSession()

    const interval = setInterval(checkSession, 2 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (user) {
      const timeout = setTimeout(
        () => {
          logout()
        },
        10 * 60 * 1000,
      ) 

      return () => clearTimeout(timeout)
    }
  }, [user])

  const checkSession = async () => {
    try {
      const session = await authAPI.getSession()

      if (session && session.is_valid) {
        setUser(session.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Session check failed:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login(username, password)
      setUser(response.user)
      return true
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      router.push("/login")
    }
  }

  return <AuthContext.Provider value={{ user, loading, login, logout, checkSession }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
