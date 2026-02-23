export type ThreadStatus = "unread" | "needs-reply" | "qualified" | "waiting" | "snoozed" | "archived"

export type ThreadCategory =
  | "sales_inquiry"
  | "networking"
  | "job_opportunity"
  | "partnership"
  | "recruiter"
  | "spam"
  | "support"
  | "personal"
  | "other"
  | ""

export type MessageDirection = "incoming" | "outgoing"

export type LinkedInActionType =
  | "send_message"
  | "send_invite"
  | "create_post"
  | "react"
  | "comment"

export type LinkedInActionStatus = "pending" | "approved" | "executed" | "rejected" | "failed"

export type RightPanelView = "contact" | "wamp" | "draft" | "enrichment"

export type WampBand = "cold" | "cool" | "warm" | "hot" | "on-fire"

export interface WampV2Score {
  total: number
  band: WampBand
  suggestedBusiness: "business-a" | "business-b" | "business-c" | null
  layer1: { businessStage: number; buyerVsCompetitor: number; painOpportunity: number; subtotal: number }
  layer2: { topicRelevance: number; opennessBuyingSignals: number; engagementQuality: number; subtotal: number }
  layer3: { curiosityQuestioning: number; needPainDisclosure: number; reciprocityInvestment: number; readinessToAct: number; subtotal: number }
  dmConversationExists: boolean
  summary: string
  messagingGuidance: string
}

export interface LinkedInThread {
  id: string
  unipileId: string
  participantId: string
  participantName: string
  participantHeadline: string
  participantAvatarUrl: string
  participantProfileUrl: string
  lastMessage: string
  lastMessageAt: string
  lastMessageDirection: MessageDirection
  unreadCount: number
  status: ThreadStatus
  category: ThreadCategory
  champScore?: number
  wampScore?: number
  qualificationData?: string
  isSelling: boolean
  isQualified: boolean
  isPartner: boolean
  classifiedAt?: string
  intent: string
  enrichmentData?: string
  postData?: string
  snoozeUntil?: string
  isSnoozed: boolean
  isArchived: boolean
  manualClassification?: boolean
  classificationNote?: string
  syncedAt: string
  createdAt: string
  updatedAt: string
}

export interface LinkedInMessage {
  id: string
  threadId: string
  unipileId: string
  senderId: string
  senderName: string
  content: string
  direction: MessageDirection
  timestamp: string
}

export interface LinkedInAction {
  id: string
  actionType: LinkedInActionType
  targetId: string
  targetName: string
  payload: string
  status: LinkedInActionStatus
  approvalId?: string
  error?: string
  executedAt?: string
  createdAt: string
  updatedAt: string
}

// ── Invitation Processing ──

export type InvitationDecision = "accepted" | "declined" | "error"

export interface ProcessedInvitation {
  id: string
  unipileInvitationId: string
  inviterName: string
  inviterHeadline: string
  inviterLocation: string
  inviterProviderId: string
  invitationText: string
  decision: InvitationDecision
  reason: string
  icpMatch: string
  threadId: string
  messagesSent: number
  processedAt: string
}

export interface InvitationStats {
  accepted: number
  declined: number
  errored: number
  total: number
}

// ── Draft History ──

export interface DraftHistoryEntry {
  id: string
  threadId: string
  instruction: string
  variants: string[]
  usedVariantIndex: number | null
  createdAt: string
}

// ── Score History ──

export interface ScoreHistoryEntry {
  id: string
  threadId: string
  total: number
  band: WampBand
  scoreData: WampV2Score
  createdAt: string
}
