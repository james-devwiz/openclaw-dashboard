"use client" // Requires useState, useRef for input state and file handling; keyboard interaction

import { useState, useRef } from "react"
import { Send, Loader2, Paperclip, X, FolderOpen } from "lucide-react"

import MentionAutocomplete from "@/components/chat/MentionAutocomplete"
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea"
import { useMentionAutocomplete } from "@/hooks/useMentionAutocomplete"

import type { ChatAttachment } from "@/types/index"

const ACCEPTED_TYPES = ".jpg,.jpeg,.png,.svg,.pdf"
const MAX_FILE_SIZE = 10 * 1024 * 1024

interface ProjectChatInputProps {
  isStreaming: boolean
  onSend: (message: string, attachments?: ChatAttachment[]) => void
  projectName: string
}

export default function ProjectChatInput({ isStreaming, onSend, projectName }: ProjectChatInputProps) {
  const [input, setInput] = useState("")
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 36, maxHeight: 200 })
  const mention = useMentionAutocomplete()

  const handleSend = () => {
    const text = input.trim()
    if ((!text && attachments.length === 0) || isStreaming) return
    onSend(text, attachments.length > 0 ? attachments : undefined)
    setInput("")
    setAttachments([])
    mention.dismiss()
    if (textareaRef.current) textareaRef.current.style.height = "36px"
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mention.isOpen) {
      const handled = mention.handleKeyDown(e)
      if (handled) {
        if (e.key === "Enter" || e.key === "Tab") {
          const cursorPos = textareaRef.current?.selectionStart || input.length
          const { newInput, newCursor } = mention.selectItem(mention.selectedIndex, input, cursorPos)
          setInput(newInput)
          requestAnimationFrame(() => {
            textareaRef.current?.setSelectionRange(newCursor, newCursor)
            adjustHeight()
          })
        }
        return
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInput(value)
    adjustHeight()
    mention.handleInputChange(value, e.target.selectionStart)
  }

  const handleMentionSelect = (index: number) => {
    const cursorPos = textareaRef.current?.selectionStart || input.length
    const { newInput, newCursor } = mention.selectItem(index, input, cursorPos)
    setInput(newInput)
    textareaRef.current?.focus()
    requestAnimationFrame(() => {
      textareaRef.current?.setSelectionRange(newCursor, newCursor)
      adjustHeight()
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) continue
      const reader = new FileReader()
      reader.onload = () => {
        setAttachments((prev) => [...prev, { name: file.name, type: file.type, dataUrl: reader.result as string }])
      }
      reader.readAsDataURL(file)
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="pt-3">
      <div className="relative">
        <MentionAutocomplete
          isOpen={mention.isOpen}
          results={mention.results}
          selectedIndex={mention.selectedIndex}
          onSelect={handleMentionSelect}
        />
        <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-lg p-3 focus-within:ring-2 focus-within:ring-blue-500/20 transition-shadow">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-accent/50 text-xs text-muted-foreground">
                  <span className="truncate max-w-[120px]">{att.name}</span>
                  <button onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))} aria-label={`Remove ${att.name}`}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Message... (type @ for mentions)"
            disabled={isStreaming}
            rows={1}
            className="w-full resize-none bg-transparent border-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
            style={{ minHeight: 36, maxHeight: 200 }}
          />
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-accent/50 text-xs text-muted-foreground">
              <FolderOpen size={12} aria-hidden="true" />
              {projectName}
            </div>
            <div className="flex items-center gap-1.5">
              <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} multiple onChange={handleFileSelect} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isStreaming}
                className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                aria-label="Attach file"
              >
                <Paperclip size={16} />
              </button>
              <button
                onClick={handleSend}
                disabled={(!input.trim() && attachments.length === 0) || isStreaming}
                className={`p-2.5 rounded-xl transition-colors ${
                  (input.trim() || attachments.length > 0) && !isStreaming
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-muted text-muted-foreground"
                }`}
                aria-label="Send message"
              >
                {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
