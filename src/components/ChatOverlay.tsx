import { useEffect, useRef } from 'react'
import { ChatMessage } from '../hooks/useChat'

interface ChatOverlayProps {
  messages: ChatMessage[]
}

export default function ChatOverlay({ messages }: ChatOverlayProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) return null

  return (
    <div
      className="absolute bottom-3 right-3 z-30 w-56 pointer-events-none"
      style={{ maxHeight: '55%' }}
    >
      <div className="flex flex-col gap-0.5 overflow-hidden">
        {messages.slice(-12).map(msg => (
          <div
            key={msg.id}
            className="flex gap-1.5 px-2 py-1 rounded-lg text-xs leading-snug"
            style={{ background: 'rgba(10,10,20,0.72)', backdropFilter: 'blur(4px)' }}
          >
            <span className="font-bold flex-shrink-0" style={{ color: msg.color }}>
              {msg.username}:
            </span>
            <span className="text-white/90 break-words min-w-0">{msg.text}</span>
          </div>
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  )
}
