interface OutreachDrafts {
  email?: { subject?: string; body?: string }
  bump?: { subject?: string; body?: string }
  value?: { subject?: string; body?: string }
  breakup?: { subject?: string; body?: string }
  linkedin?: { connectionNote?: string; firstMessage?: string }
}

interface LeadOutreachPreviewProps {
  draftsJson: string
}

export default function LeadOutreachPreview({ draftsJson }: LeadOutreachPreviewProps) {
  let drafts: OutreachDrafts = {}
  try { drafts = JSON.parse(draftsJson) } catch { return null }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-3">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
      {children}
    </div>
  )

  const EmailBlock = ({ label, email }: { label: string; email?: { subject?: string; body?: string } }) => {
    if (!email?.subject) return null
    return (
      <div className="mb-2">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-xs font-medium text-foreground">{email.subject}</p>
        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{email.body}</p>
      </div>
    )
  }

  return (
    <div className="bg-accent/30 rounded-lg p-3 space-y-2">
      <Section title="Email Sequence">
        <EmailBlock label="Initial" email={drafts.email} />
        <EmailBlock label="Bump" email={drafts.bump} />
        <EmailBlock label="Value" email={drafts.value} />
        <EmailBlock label="Break-up" email={drafts.breakup} />
      </Section>
      {drafts.linkedin?.connectionNote && (
        <Section title="LinkedIn">
          <p className="text-xs text-foreground">{drafts.linkedin.connectionNote}</p>
          {drafts.linkedin.firstMessage && (
            <p className="text-xs text-muted-foreground mt-1">{drafts.linkedin.firstMessage}</p>
          )}
        </Section>
      )}
    </div>
  )
}
