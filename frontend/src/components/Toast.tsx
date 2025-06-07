"use client"

import { useState, useEffect } from "react"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"

export type ToastType = "success" | "error" | "info" | "warning"

export interface ToastProps {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

export function Toast({ id, type, title, message, duration = 10000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [progress, setProgress] = useState(100)
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)

  // Handle toast icon based on type
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "info":
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }


  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
      case "error":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
      case "info":
      default:
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
    }
  }

  const getProgressColor = () => {
    switch (type) {
      case "success":
        return "bg-green-500"
      case "error":
        return "bg-red-500"
      case "warning":
        return "bg-yellow-500"
      case "info":
      default:
        return "bg-blue-500"
    }
  }

  useEffect(() => {

    const totalSteps = 100
    const stepDuration = duration / totalSteps
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress <= 0) {
          clearInterval(timer)
          setIsVisible(false)
          return 0
        }
        return prevProgress - 100 / totalSteps
      })
    }, stepDuration)

    setIntervalId(timer)

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [duration])


  useEffect(() => {
    if (!isVisible) {

      const timeout = setTimeout(() => {
        onClose(id)
      }, 300)

      return () => clearTimeout(timeout)
    }
  }, [isVisible, onClose, id])


  const handleClose = () => {
    if (intervalId) clearInterval(intervalId)
    setIsVisible(false)
  }

  return (
    <div
      className={`${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0 pointer-events-none"
      } transform transition-all duration-300 ease-in-out max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto border ${getBackgroundColor()}`}
      role="alert"
    >
      <div className="relative overflow-hidden rounded-lg">
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">{getIcon()}</div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
              {message && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>}
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                className="bg-transparent rounded-md inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={handleClose}
              >
                <span className="sr-only">Close</span>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 w-full bg-gray-200 dark:bg-gray-700">
          <div
            className={`h-full ${getProgressColor()} transition-all duration-300 ease-linear`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}
