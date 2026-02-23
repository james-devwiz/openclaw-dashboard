"use client" // React context provider with state management for toast notifications

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { CheckCircle, XCircle, Info, X } from "lucide-react"

type ToastType = "success" | "error" | "info"

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={16} className="text-emerald-500 shrink-0" aria-hidden="true" />,
  error: <XCircle size={16} className="text-red-500 shrink-0" aria-hidden="true" />,
  info: <Info size={16} className="text-blue-500 shrink-0" aria-hidden="true" />,
}

const BG: Record<ToastType, string> = {
  success: "border-emerald-200 dark:border-emerald-800",
  error: "border-red-200 dark:border-red-800",
  info: "border-blue-200 dark:border-blue-800",
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [exiting, setExiting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => setExiting(true), 3500)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  useEffect(() => {
    if (exiting) {
      const t = setTimeout(() => onDismiss(toast.id), 300)
      return () => clearTimeout(t)
    }
  }, [exiting, onDismiss, toast.id])

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border bg-card shadow-lg text-sm
        transition-all duration-300 ${BG[toast.type]}
        ${exiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"}`}
    >
      {ICONS[toast.type]}
      <span className="text-foreground flex-1">{toast.message}</span>
      <button
        onClick={() => setExiting(true)}
        className="p-0.5 rounded hover:bg-muted transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={14} className="text-muted-foreground" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext value={{ toast: addToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm" aria-label="Notifications">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </ToastContext>
  )
}
