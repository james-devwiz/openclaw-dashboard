import { cn } from "@/lib/utils"
import type { LinkedInMessage } from "@/types"

interface MessageBubbleProps {
  message: LinkedInMessage
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isOutgoing = message.direction === "outgoing"
  const time = new Date(message.timestamp).toLocaleTimeString("en-AU", {
    hour: "2-digit", minute: "2-digit",
  })
  const date = new Date(message.timestamp).toLocaleDateString("en-AU", {
    day: "numeric", month: "short",
  })

  return (
    <div className={cn("flex mb-3", isOutgoing ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[75%] rounded-xl px-3 py-2",
        isOutgoing
          ? "bg-blue-500 text-white rounded-br-sm"
          : "bg-gray-100 dark:bg-gray-800 text-foreground rounded-bl-sm"
      )}>
        {!isOutgoing && message.senderName && (
          <p className="text-[10px] font-medium mb-0.5 opacity-70">{message.senderName}</p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p className={cn(
          "text-[10px] mt-1",
          isOutgoing ? "text-blue-100" : "text-muted-foreground"
        )}>
          {date} {time}
        </p>
      </div>
    </div>
  )
}
