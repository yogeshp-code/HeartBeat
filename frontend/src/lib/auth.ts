export interface User {
  id: string
  username: string
  email: string
  role: string
  last_login?: string
}

export interface LoginResponse {
  message: string
  user: User
  access_token: string
  token_type: string
}

export interface SessionResponse {
  user: User
  expires_at: string
  is_valid: boolean
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"


export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Login failed")
  }

  return await response.json()
}


export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
  } catch (error) {
    console.error("Logout error:", error)
  }
}


export async function getSession(): Promise<SessionResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/session`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("Session check error:", error)
    return null
  }
}


export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await getSession()
    return session?.is_valid || false
  } catch (error) {
    console.error("Authentication check failed:", error)
    return false
  }
}


export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}


export async function createUser(userData: {
  username: string
  email: string
  password: string
  role?: string
}): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/create-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(userData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Failed to create user")
  }

  return await response.json()
}
