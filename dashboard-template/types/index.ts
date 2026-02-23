// Task / Kanban types
export type TaskStatus = "Backlog" | "To Be Scheduled" | "To Do This Week" | "In Progress" | "Requires More Info" | "Blocked" | "Needs Review" | "Completed";
export type TaskPriority = "High" | "Medium" | "Low";
export type TaskCategory = "Business A" | "Business B" | "Business C" | "Personal";
export type TaskSource = "Manual" | "Cron" | "Heartbeat" | "Meeting" | "Approval";
export type TaskComplexity = "Simple" | "Moderate" | "Complex";
export type TaskAssignee = "AI Assistant" | "User";

export interface Task {
  id: string;
  name: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: string;
  source: TaskSource;
  complexity?: TaskComplexity;
  estimatedMinutes?: number;
  assignee?: TaskAssignee;
  goalId: string;
  goalName?: string;
  notionPageId?: string;
  approvalId?: string;
  approvalStatus?: import("./approval.types").ApprovalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface KanbanColumn {
  id: TaskStatus;
  name: string;
  color: string;
  tasks: Task[];
}

// Cron types
export interface CronJob {
  name: string;
  schedule: string;
  model: string;
  target?: {
    channel: string;
    topic?: string;
  };
  silent?: boolean;
  enabled?: boolean;
  lastRun?: string;
  lastStatus?: "success" | "failure" | "running";
  nextRun?: string;
  prompt?: string;
  sessionTarget?: string;
  goalId?: string;
  goalName?: string;
}

// Health types
export interface HealthStatus {
  status: "healthy" | "degraded" | "down";
  uptime?: string;
  version?: string;
  channels: {
    slack: ChannelStatus;
    telegram: ChannelStatus;
    notion: ChannelStatus;
  };
  system?: {
    cpu?: number;
    memory?: number;
    disk?: number;
  };
}

export interface ChannelStatus {
  connected: boolean;
  latency?: number;
  error?: string;
}

// Activity types — re-exported from activity.types.ts
export type { ActivityItem, ActivityEntityType, ActivityAction, ActivityGroup } from "./activity.types";

// Morning brief types
export interface MorningBrief {
  date: string;
  weather?: string;
  calendar: CalendarEvent[];
  priorities: string[];
  overnightWork: string[];
  unreadCount: number;
  deadlines: string[];
}

export interface CalendarEvent {
  title: string;
  time: string;
  duration?: string;
  location?: string;
}

// Chat types
export type ChatTopic = "general" | "briefs" | "reports" | "research" | "tasks" | "coaching" | "system-improvement" | "memory";

export interface ChatTopicConfig {
  id: ChatTopic;
  label: string;
  description: string;
  systemPrompt: string;
  quickActions: string[];
}

export interface ChatAttachment {
  name: string;
  type: string;
  dataUrl: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  topic?: ChatTopic;
  sessionId?: string;
  isStreaming?: boolean;
  status?: "sending" | "sent" | "error";
  attachments?: ChatAttachment[];
  metadata?: {
    brief_saved?: boolean;
    brief_updated?: boolean;
    briefId?: string;
    briefType?: string;
    tasks_created?: Array<{ id: string; name: string }>;
    agentId?: string;
    agentName?: string;
  };
}

// Gateway types
export interface GatewayConfig {
  version: string;
  agent: string;
  model: string;
  heartbeat: {
    enabled: boolean;
    interval: number;
  };
  cronJobCount: number;
  pluginCount: number;
  skillCount: number;
}

// Re-export domain types
export type { Comment, LeadComment } from "./comment.types";
export type { Goal, GoalStatus, GoalCategory } from "./goal.types";
export type {
  ContentItem, ContentColumn, ContentType, ContentStage, ContentPlatform, ContentSource,
  IdeaCategory, IdeaSourceType, ContentFormat,
  IdeaSourcePlatform, IdeaSourceFrequency, IdeaSource, IdeaSourceValidation,
} from "./content.types";
export type { ApprovalItem, ApprovalCategory, ApprovalStatus, ApprovalPriority, ApprovalRequester } from "./approval.types";
export type { MemoryItem, MemoryCategory, MemorySuggestion, SuggestionStatus, SearchResult } from "./memory.types"
export type { ChatMessageRow, ChatSession, MentionCategory, MentionItem } from "./chat.types";
export type {
  AgentType, SkillStatus, AgentDefinition, BusinessDefinition,
  SkillInfo, SkillMissing, SkillInstallSpec, AgentLiveData, AgentWithLiveData, ArchitectureData,
  AgentNodeData, BusinessNodeData, SkillGroupNodeData, SkillDetail, ModelInfo,
  ModelDetail, ModelDetailAgent, ModelDetailCronJob,
} from "./architecture.types";
export type { Brief, BriefType, BriefKind, BriefSearchParams, BriefSearchResult } from "./brief.types";
export type { HeartbeatEvent, HeartbeatStatus, HeartbeatStats } from "./heartbeat.types";
export type { Document, DocumentCategory, DocumentFolder } from "./document.types";
export type { Project, ProjectFile, CreateProjectInput, UpdateProjectInput } from "./project.types";
export type {
  McpTransport, McpAuthType, McpServerStatus, McpCallStatus,
  McpServer, McpTool, McpBinding, McpCallLog, McpObservabilityStats,
  CreateMcpServerInput, UpdateMcpServerInput,
} from "./mcp.types"
export type {
  ThreadStatus, ThreadCategory, MessageDirection, LinkedInActionType, LinkedInActionStatus,
  LinkedInThread, LinkedInMessage, LinkedInAction, WampV2Score, RightPanelView, WampBand,
  InvitationDecision, ProcessedInvitation, InvitationStats,
  DraftHistoryEntry, ScoreHistoryEntry,
} from "./linkedin.types";
export type {
  Lead, LeadStatus, LeadPriority, LeadSource, LeadBusiness,
  LeadActivity, LeadActivityType, LeadStats, CallOutcome,
} from "./lead.types";
export type {
  Post, PostFormat, PostStage, PostPlatform, PlatformStatus,
  PostPlatformEntry, PostMedia, CarouselSlide, StudioColumn,
} from "./studio.types";
