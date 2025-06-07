"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useMediaQuery } from 'react-responsive'
  
import { useRouter } from "next/navigation"
import { useAuth } from "../../src/contexts/AuthContext"
import { Eye, EyeOff, Lock, User, AlertCircle, Activity, Heart } from "lucide-react"
import HeartBeatLogo from "../../src/components/HeartBeatLogo"

interface FormData {
  username: string
  password: string
}

interface FormErrors {
  username?: string
  password?: string
  general?: string
}

export default function LoginPage() {
  const [formData, setFormData] = useState<FormData>({
    username: "",
    password: ""
  })
  const isMobile = useMediaQuery({ maxWidth: 767 }) 
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const { login, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push("/")
    }
  }, [user, router])

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.username.trim()) {
      newErrors.username = "Username is required"
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters"
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleInputChange = useCallback((field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [errors])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const success = await login(formData.username.trim(), formData.password)
      if (success) {
        router.push("/")
      } else {
        setErrors({ general: "Invalid credentials" })
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Login failed. Please try again."
      setErrors({ general: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-black px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <svg className="absolute top-20 left-10 w-32 h-8 opacity-20" viewBox="0 0 200 50" fill="none">
          <path
            d="M0 25 L20 25 L25 10 L30 40 L35 5 L40 45 L45 25 L50 20 L55 30 L60 25 L200 25"
            stroke="url(#gradient1)"
            strokeWidth="2"
            fill="none"
            className="animate-pulse"
          />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>

        <svg className="absolute bottom-20 right-10 w-32 h-8 opacity-20" viewBox="0 0 200 50" fill="none">
          <path
            d="M0 25 L20 25 L25 10 L30 40 L35 5 L40 45 L45 25 L50 20 L55 30 L60 25 L200 25"
            stroke="url(#gradient2)"
            strokeWidth="2"
            fill="none"
            className="animate-pulse delay-1000"
          />
          <defs>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <header className="text-center">
          <div className="flex justify-center mb-6">
            <HeartBeatLogo size={isMobile ? "sm" : "lg"} />
          </div>
          
          <p className="text-lg text-gray-300 mb-4">Unified Infrastructure Monitoring Dashboard</p>

        </header>

        <main className="bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-700/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-purple-500/5 animate-pulse" aria-hidden="true" />

          <div className="relative z-10">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">Secure Login</h2>
              
              <p className="text-gray-400 text-sm">Monitor Infra from one place</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              {errors.general && (
                <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 flex items-center backdrop-blur-sm" role="alert">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" aria-hidden="true" />
                  <p className="text-sm text-red-300">{errors.general}</p>
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-500" aria-hidden="true" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={formData.username}
                    onChange={handleInputChange('username')}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg leading-5 bg-gray-700/50 backdrop-blur-sm placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${
                      errors.username ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Username"
                    aria-describedby={errors.username ? "username-error" : undefined}
                    aria-invalid={!!errors.username}
                  />
                </div>
                {errors.username && (
                  <p id="username-error" className="mt-1 text-sm text-red-400" role="alert">
                    {errors.username}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500" aria-hidden="true" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    className={`block w-full pl-10 pr-12 py-3 border rounded-lg leading-5 bg-gray-700/50 backdrop-blur-sm placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${
                      errors.password ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Secure access key"
                    aria-describedby={errors.password ? "password-error" : undefined}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={togglePasswordVisibility}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="mt-1 text-sm text-red-400" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition-all duration-200 shadow-lg ${
                    loading
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transform hover:scale-105 active:scale-95"
                  }`}
                  aria-describedby="submit-description"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Connecting to HeartBeat...
                    </>
                  ) : (
                    <>
                      <Activity className="h-5 w-5 mr-2 animate-pulse" aria-hidden="true" />
                      Access HeartBeat Dashboard
                    </>
                  )}
                </button>
                <p id="submit-description" className="sr-only">
                  Access the unified ECS monitoring dashboard
                </p>
              </div>
            </form>

            <div className="mt-6 text-center">
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
                  Online
                </span>
                <span>•</span>
                <span>Session timeout: 10 min</span>
              </div>
            </div>
          </div>
        </main>

        <footer className="text-center">
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
            <span className="flex items-center">
              <Heart className="h-3 w-3 mr-1 text-red-400" aria-hidden="true" />
              Health Monitoring
            </span>
            <span className="flex items-center">
              <Activity className="h-3 w-3 mr-1 text-green-400" aria-hidden="true" />
              Live Metrics
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}
