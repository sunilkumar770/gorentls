// src/app/(dashboard)/dashboard/messages/components/MessageInput.tsx
'use client'
import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Typography } from '@/components/ui/Typography'
import { Send as SendIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onSend: (content: string) => void
  onTyping: (isTyping: boolean) => void
  disabled?: boolean
}

export function MessageInput({ onSend, onTyping, disabled }: Props) {
  const [value, setValue] = useState('')
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    onTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 1500)
  }

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    onTyping(false)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
  }, [value, disabled, onSend, onTyping])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="px-4 py-3 border-t border-border-subtle bg-surface-base shrink-0">
      <div className="flex items-end gap-3">
        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Connection lost — reconnecting...' : 'Type a message...'}
          disabled={disabled}
          rows={1}
          aria-label="Message input"
          className={cn(
            "flex-1 resize-none rounded-xl border border-border-subtle bg-surface-subtle",
            "text-text-primary placeholder-text-tertiary px-4 py-3 text-base md:text-sm",
            "focus:outline-none focus:ring-2 focus:ring-brand-500/30",
            "disabled:opacity-50 disabled:cursor-not-allowed max-h-32 overflow-y-auto",
            "transition-all duration-short"
          )}
          style={{ lineHeight: '1.5' }}
        />
        <Button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          aria-label="Send message"
          size="icon"
          className="shrink-0 w-11 h-11 rounded-xl shadow-md"
        >
          <SendIcon className="w-5 h-5 -rotate-45" />
        </Button>
      </div>
      <Typography variant="body-xs" className="text-text-tertiary mt-2 px-1 font-medium">
        Enter to send · Shift+Enter for new line
      </Typography>
    </div>
  )
}
