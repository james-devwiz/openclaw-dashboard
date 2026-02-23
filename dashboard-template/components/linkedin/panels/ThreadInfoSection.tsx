import { Section, Detail, formatDate } from "./PanelHelpers"

interface ThreadInfoSectionProps {
  messageCount: number
  createdAt: string
  lastMessageAt: string
  classifiedAt?: string
}

export default function ThreadInfoSection({ messageCount, createdAt, lastMessageAt, classifiedAt }: ThreadInfoSectionProps) {
  return (
    <Section title="Thread Info">
      <Detail label="Messages" value={String(messageCount)} />
      <Detail label="First synced" value={formatDate(createdAt)} />
      <Detail label="Last activity" value={formatDate(lastMessageAt)} />
      {classifiedAt && <Detail label="Classified" value={formatDate(classifiedAt)} />}
    </Section>
  )
}
