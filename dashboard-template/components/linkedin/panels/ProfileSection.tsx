import { ExternalLink, Mail, Phone, MapPin } from "lucide-react"

import { Section } from "./PanelHelpers"
import type { LinkedInThread } from "@/types"

interface ProfileSectionProps {
  thread: LinkedInThread
  person?: { email?: string; phone_numbers?: Array<{ raw_number: string }>; city?: string; state?: string; country?: string }
}

export default function ProfileSection({ thread, person }: ProfileSectionProps) {
  return (
    <Section title="Profile">
      <div className="flex items-center gap-3 mb-2">
        <div className="shrink-0 size-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          {thread.participantAvatarUrl ? (
            <img src={thread.participantAvatarUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="size-full grid place-content-center text-base font-medium text-muted-foreground">
              {thread.participantName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{thread.participantName}</p>
          {thread.participantHeadline && (
            <p className="text-xs text-muted-foreground truncate">{thread.participantHeadline}</p>
          )}
        </div>
      </div>
      {thread.participantProfileUrl && (
        <a href={thread.participantProfileUrl} target="_blank" rel="noopener noreferrer"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
          <ExternalLink size={10} aria-hidden="true" /> LinkedIn Profile
        </a>
      )}
      {person?.email && (
        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
          <Mail size={10} aria-hidden="true" /> {person.email}
        </div>
      )}
      {person?.phone_numbers?.[0] && (
        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
          <Phone size={10} aria-hidden="true" /> {person.phone_numbers[0].raw_number}
        </div>
      )}
      {person?.city && (
        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
          <MapPin size={10} aria-hidden="true" /> {[person.city, person.state, person.country].filter(Boolean).join(", ")}
        </div>
      )}
    </Section>
  )
}
