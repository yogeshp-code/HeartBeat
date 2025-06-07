"use client"

import { useState, useCallback } from "react"
import { Toast, type ToastType } from "./Toast"
import { motion, AnimatePresence } from "framer-motion"

export interface ToastData {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  // Remove a toast by ID
  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
  }, [])

  // Add a new toast
  const addToast = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newToast: ToastData = {
      id,
      type,
      title,
      message,
      duration,
    }
    setToasts((prevToasts) => [...prevToasts, newToast])
    return id
  }, [])

  // Expose the toast functions to the window object for global access
  useState(() => {
    if (typeof window !== "undefined") {
      window.toast = {
        success: (title: string, message?: string, duration?: number) => addToast("success", title, message, duration),
        error: (title: string, message?: string, duration?: number) => addToast("error", title, message, duration),
        info: (title: string, message?: string, duration?: number) => addToast("info", title, message, duration),
        warning: (title: string, message?: string, duration?: number) => addToast("warning", title, message, duration),
        remove: removeToast,
      }
    }
  }, [addToast, removeToast])

 return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-xs space-y-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, transition: { duration: 0.2 } }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <Toast
              id={toast.id}
              type={toast.type}
              title={toast.title}
              message={toast.message}
              duration={toast.duration}
              onClose={removeToast}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Define the global toast interface
declare global {
  interface Window {
    toast: {
      success: (title: string, message?: string, duration?: number) => string
      error: (title: string, message?: string, duration?: number) => string
      info: (title: string, message?: string, duration?: number) => string
      warning: (title: string, message?: string, duration?: number) => string
      remove: (id: string) => void
    }
  }
}
