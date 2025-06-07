"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "./ThemeProvider"

interface CodeBlockProps {
  code: string
  language: string
}

export default function CodeBlock({ code, language }: CodeBlockProps) {
  const preRef = useRef<HTMLPreElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!preRef.current) return

    if (language === "json") {
      const highlighted = code
        .replace(/"([^"]+)":/g, '<span class="text-purple-600 dark:text-purple-400">"$1"</span>:')
        .replace(/: "(.*?)"/g, ': <span class="text-green-600 dark:text-green-400">"$1"</span>')
        .replace(/: (\d+)/g, ': <span class="text-blue-600 dark:text-blue-400">$1</span>')
        .replace(/: (true|false)/g, ': <span class="text-red-600 dark:text-red-400">$1</span>')
        .replace(/: (null)/g, ': <span class="text-gray-600 dark:text-gray-400">$1</span>')

      preRef.current.innerHTML = highlighted
    }
  }, [code, language, theme])

  return (
    <div className="relative rounded-md overflow-hidden">
      <div className="absolute top-0 right-0 bg-gray-200 dark:bg-gray-700 text-xs px-2 py-1 rounded-bl-md">
        {language}
      </div>
      <pre
        ref={preRef}
        className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-x-auto text-sm font-mono text-gray-800 dark:text-gray-200"
      >
        {code}
      </pre>
    </div>
  )
}
