"use client"

import { useState } from "react"
import { ThemeToggle } from "./ThemeToggle"
import { useMediaQuery } from 'react-responsive'
import Logo from "./Logo"
import { triggerRefresh } from "../api"
import { useAuth } from "../contexts/AuthContext"
import { LogOut, User, ChevronDown, Menu, X } from "lucide-react"

interface HeaderProps {
  aliases: string[]
  selectedAlias: string
  onAliasChange: (alias: string) => void
  onRefresh: () => void
  lastUpdated: string
  startRefreshPolling: (alias: string) => void
  isRefreshing: boolean
  autoRotate: boolean
  onToggleAutoRotate: () => void
}

export default function Header({
  aliases,
  selectedAlias,
  onAliasChange,
  onRefresh,
  lastUpdated,
  startRefreshPolling,
  isRefreshing,
  autoRotate,
  onToggleAutoRotate,
}: HeaderProps) {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const isMobile = useMediaQuery({ maxWidth: 767 }) 
  const handleRefresh = async () => {
    if (!selectedAlias || isRefreshing) return
    try {
      const success = await triggerRefresh(selectedAlias)
      if (success) {
        window.toast?.info("Refresh initiated", "Checking status...")
        startRefreshPolling(selectedAlias)
      } else {
        window.toast?.error("Failed to trigger refresh", "Please try again")
      }
    } catch (err) {
      console.error("Refresh error", err)
      window.toast?.error("Error during refresh", "Please try again")
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Logo size={isMobile ? "sm" : "md"} />
          {lastUpdated && (
            <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Updated: {lastUpdated}
            </span>
          )}
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <div className="relative">
            <select
              value={selectedAlias}
              onChange={(e) => {
  onAliasChange(e.target.value)
  onToggleAutoRotate() 
}}
              className="appearance-none bg-white/80 dark:bg-gray-700/70 backdrop-blur-sm border border-gray-300 dark:border-gray-600 px-3 py-2 pr-8 rounded-md shadow text-sm focus:outline-none text-gray-800 dark:text-gray-100"
            >
              {aliases.length === 0 ? (
                <option value="">No aliases</option>
              ) : (
                aliases.map((alias) => (
                  <option key={alias} value={alias}>{alias}</option>
                ))
              )}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-300 pointer-events-none" />
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`flex items-center px-4 py-2 rounded-md text-sm transition-colors duration-200 ${
              isRefreshing
                ? "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700 text-white"
            }`}
          >
            {isRefreshing ? (
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
              </svg>
            ) : (
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M4 4v5h.582M20 11a8.001 8.001 0 00-15.418-2H9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            Refresh
          </button>

          <button
  onClick={onToggleAutoRotate}
  className={`p-2 rounded-md transition-colors ${
    autoRotate
      ? 'bg-green-100 dark:bg-rose-500/50 text-rose-800 dark:text-rose-200'
      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
  }`}
  title={autoRotate ? 'Auto-rotate is on' : 'Auto-rotate is off'}
>
  {autoRotate ? (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
  )}
</button>

          {/* Theme toggle */}
          
          <ThemeToggle  />
          {user && (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((p) => !p)}
                className="flex items-center px-3 py-2 rounded-md bg-white/80 dark:bg-gray-700/70 border border-gray-300 dark:border-gray-600 text-sm text-gray-800 dark:text-white"
              >
                <User className="h-4 w-4 mr-2" />
                <span className="truncate max-w-[100px]">{user.username}</span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md rounded-md z-50">
                  <div className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    Signed in as <br />
                    <strong className="block truncate text-black dark:text-white">{user.email}</strong>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <LogOut className="h-4 w-4 inline mr-2" /> Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="md:hidden">
           
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pb-4 space-y-4">
          <div className="relative">
            <select
              value={selectedAlias}
              onChange={(e) => {
  onAliasChange(e.target.value)
  onToggleAutoRotate() 
}}
              className="w-full appearance-none bg-white/90 dark:bg-gray-700/90 border border-gray-300 dark:border-gray-600 px-3 py-2 pr-8 rounded-md shadow text-sm text-gray-800 dark:text-white"
            >
              {aliases.map((alias) => (
                <option key={alias} value={alias}>{alias}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-300" />
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-sm ${
              isRefreshing
                ? "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 cursor-not-allowed"
                : "bg-rose-500 hover:bg-rose-600 text-white"
            }`}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
            <button
  onClick={onToggleAutoRotate}
  className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-sm ${
    autoRotate
      ? 'bg-green-100 dark:bg-rose-900/50 text-green-800 dark:text-rose-200'
      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
  }`}
>
  {autoRotate ? (
    <>
      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      Auto-rotate ON
    </>
  ) : (
    <>
      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
      Auto-rotate OFF
    </>
  )}
</button>


          {user && (
            <div className="rounded-md bg-white/80 dark:bg-gray-700/70 border border-gray-300 dark:border-gray-600 p-3">
              <div className="text-sm text-gray-700 dark:text-gray-200">
                Signed in as <strong className="block truncate">{user.email}</strong>
              </div>
              <button
                onClick={logout}
                className="mt-2 w-full text-left text-sm text-red-600 hover:underline"
              >
                <LogOut className="inline h-4 w-4 mr-2" /> Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
