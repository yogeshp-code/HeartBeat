"use client"

import { useEffect, useState } from "react"
import { Keyboard } from "lucide-react"

export default function KeyboardShortcuts() {
  const [showShortcuts, setShowShortcuts] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        setShowShortcuts(true)
      }

      if (e.key === "Escape") {
        setShowShortcuts(false)
      }

      if (
        e.key === "r" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !(document.activeElement instanceof HTMLInputElement) &&
        !(document.activeElement instanceof HTMLTextAreaElement)
      ) {
        document.dispatchEvent(new CustomEvent("app:refresh"))
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <>
      <button
        onClick={() => setShowShortcuts(true)}
        className="fixed bottom-4 right-4 p-2 bg-gray-200 dark:bg-gray-700 rounded-full shadow-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        aria-label="Keyboard shortcuts"
      >
        <Keyboard className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      </button>

      {showShortcuts && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Keyboard Shortcuts</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Refresh data</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm">
                  r
                </kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Toggle dark mode</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm">
                  d
                </kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Focus search</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm">
                  /
                </kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Show keyboard shortcuts</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm">
                  ?
                </kbd>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowShortcuts(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
