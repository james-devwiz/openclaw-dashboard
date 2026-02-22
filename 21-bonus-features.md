# Phase 21: Bonus Features — Documents, Ideas, Content Studio, LinkedIn Intelligence, Lead Generation

## Goal

> **Using the template?** If you started from `dashboard-template/` (Phase 8), the code in this phase is already in place. Review the files, customise as needed, then skip to the Verification checklist.

Add five optional, self-contained modules that extend the Command Centre for specific use cases. Each subsection is independent — pick what you need. None are required for the core dashboard to function.

**What you get:**
- **Documents** — AI document repository with 6 categories, full-text search, and markdown rendering
- **Content Centre Ideas** — AI-vetted idea pipeline with scoring, 4 categories, and promote-to-pipeline/task flows
- **Content Studio** — Multi-platform publishing with per-field AI drafts, LinkedIn publishing, and media upload
- **LinkedIn Intelligence** — AI-powered LinkedIn CRM with WAMP scoring, auto-categorization, draft generation, and connection automation (requires Unipile account)
- **Lead Generation** — 9-stage outreach pipeline with Apollo enrichment, AI outreach generation, call tracking, and follow-up automation

---

### 21.1 Documents — AI Document Repository

A lightweight document store for meeting transcripts, email drafts, research summaries, and reference material. Full CRUD with full-text search across title, tags, and content. Markdown rendering via the shared `MarkdownMessage` component. Slide-over with view/edit toggle.

#### 21.1.1 Types — `types/document.types.ts`

```typescript
export type DocumentCategory =
  | "Meeting Transcript" | "Email Draft" | "Notes"
  | "Reference" | "Template" | "Research"

export type DocumentFolder = "general" | "system"

export interface Document {
  id: string
  category: DocumentCategory
  folder: DocumentFolder
  projectId?: string
  agentId?: string
  title: string
  content: string
  tags: string           // comma-separated
  source: "manual" | "api" | "cron"
  createdAt: string
  updatedAt: string
}
```

Re-export from `types/index.ts`.

#### 21.1.2 Constants — `lib/document-constants.ts`

```typescript
export const ALL_CATEGORIES: DocumentCategory[] = [
  "Meeting Transcript", "Email Draft", "Notes", "Reference", "Template", "Research",
]

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "Meeting Transcript": { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
  "Email Draft":        { bg: "bg-cyan-100 dark:bg-cyan-900/30",    text: "text-cyan-700 dark:text-cyan-300" },
  "Notes":              { bg: "bg-amber-100 dark:bg-amber-900/30",   text: "text-amber-700 dark:text-amber-300" },
  "Reference":          { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
  "Template":           { bg: "bg-blue-100 dark:bg-blue-900/30",    text: "text-blue-700 dark:text-blue-300" },
  "Research":           { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300" },
}

export const CATEGORY_SHORT_LABELS: Record<string, string> = { /* abbreviated display names */ }

export const FOLDER_COLORS: Record<string, { bg: string; text: string }> = {
  general: { bg: "bg-gray-100 dark:bg-gray-800/50", text: "text-gray-600 dark:text-gray-400" },
  system:  { bg: "bg-red-100 dark:bg-red-900/30",   text: "text-red-700 dark:text-red-300" },
}
```

#### 21.1.3 Database Schema — `lib/db.ts` addition + `lib/db-documents.ts`

Add to `initSchema()`:

```sql
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'Notes',
  folder TEXT NOT NULL DEFAULT 'general',
  projectId TEXT,
  agentId TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'manual',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
```

**CRUD functions** in `lib/db-documents.ts`:

```typescript
getDocuments(opts?: { category?, search?, folder?, projectId?, agentId?, limit?, offset? }): Document[]
getDocumentCount(opts?): number
getDocumentById(id: string): Document | null
createDocument(input: { title: string; category?; content?; tags?; source?; folder?; projectId?; agentId? }): Document
updateDocument(id: string, updates: Partial<Pick<Document, "category"|"title"|"content"|"tags"|"folder"|"projectId"|"agentId">>): Document | null
deleteDocument(id: string): void
getDocumentFolderCounts(): { general: number; system: number }
getDocumentProjectCounts(): Array<{ projectId: string; name: string; count: number }>
getDocumentAgentCounts(): Array<{ agentId: string; count: number }>
```

Full-text search matches `(title LIKE ? OR tags LIKE ? OR content LIKE ?)`. Mutual exclusivity: setting `projectId` clears `agentId` and vice versa.

#### 21.1.4 API Route — `app/api/documents/route.ts`

| Method | Query / Body | Response |
|---|---|---|
| GET | `?counts=true` | `{ folderCounts, projectCounts, agentCounts }` |
| GET | `?category=&search=&folder=&limit=&offset=` | `{ documents: Document[], total: number }` |
| POST | `{ title!, category?, content?, tags?, source?, folder?, projectId?, agentId? }` | `{ document }` (201) |
| PATCH | `{ id!, ...updates }` | `{ document }` |
| DELETE | `?id=` | `{ success: true }` |

All mutations wrapped with `withActivitySource()`.

#### 21.1.5 Service & Hook — `services/document.service.ts`, `hooks/useDocuments.ts`

Service wraps all fetch calls. Hook manages state with `PAGE_SIZE = 20`, category/search/folder filters, and a `DocumentNavFilter` discriminated union (`all | folder | project | agent`).

#### 21.1.6 Components — `components/documents/`

| Component | Purpose |
|---|---|
| `DocumentFilters.tsx` | Category tabs with count badges, search bar |
| `DocumentListItem.tsx` | Expandable card with category badge, source, and date |
| `DocumentSlideOver.tsx` | Detail panel with view/edit toggle |
| `DocumentViewContent.tsx` | Markdown rendering via `MarkdownMessage`, tags, "Save to Memory" button |
| `DocumentEditForm.tsx` | Title, category dropdown, content textarea, tags input |
| `CreateDocumentModal.tsx` | New document form with markdown support |

#### 21.1.7 Global Search Integration

In `app/api/search/route.ts`, add `getDocuments({ search: query, limit: 5 })` to the search results. Return as `SearchResult` with `type: "document"` and `FileText` icon in `SearchResultItem`.

---

### 21.2 Content Centre Ideas — AI-Vetted Idea Pipeline

An Ideas tab within the existing Content Centre page. Ideas are submitted, AI-vetted for quality (score 1-10), and then promoted to the content pipeline or task board.

#### 21.2.1 Types — `types/content.types.ts` additions

```typescript
export type IdeaCategory = "Business Idea" | "Strategy Idea" | "Content Idea" | "AI Solution"
export type IdeaSourceType = "YouTube" | "Blog" | "Newsletter" | "Reddit" | "Podcast" | "Manual"
export type IdeaSourcePlatform = "youtube" | "linkedin" | "x" | "reddit" | "website" | "email"
export type IdeaSourceFrequency = "daily" | "twice-weekly" | "weekly" | "fortnightly" | "monthly"
export type ContentFormat = "Static" | "Carousel" | "Short Form" | "Long Form"
```

The existing `ContentItem` interface gains these fields:

```typescript
ideaCategories?: IdeaCategory[]
sourceUrl?: string
sourceType?: IdeaSourceType
contentFormats?: ContentFormat[]
promotedTaskId?: string
promotedPipelineIds?: string[]
vetScore?: number           // 1-10, null = not vetted
vetReasoning?: string
vetEvidence?: string
```

#### 21.2.2 Constants — `lib/content-constants.ts` additions

```typescript
export const ALL_IDEA_CATEGORIES: IdeaCategory[] = [
  "Business Idea", "Strategy Idea", "Content Idea", "AI Solution",
]
export const IDEA_CATEGORY_COLORS: Record<IdeaCategory, { bg: string; text: string }> = { /* ... */ }
export const ALL_CONTENT_FORMATS: ContentFormat[] = ["Static", "Carousel", "Short Form", "Long Form"]
export const CONTENT_FORMAT_COLORS: Record<ContentFormat, { bg: string; text: string }> = { /* ... */ }
export const PIPELINE_STAGES: ContentStage[] = ["Research", "Draft", "Review", "Published", "Filed"]
export const IDEA_CRON_PREFIX = "idea-scan-"
export const ALL_SOURCE_PLATFORMS: Array<{ id: IdeaSourcePlatform; label: string; icon: string; comingSoon?: boolean }>
export const ALL_SOURCE_FREQUENCIES: Array<{ id: IdeaSourceFrequency; label: string; cron: string }>
```

#### 21.2.3 AI Vetting — `lib/idea-vetting.ts`

```typescript
interface VetInput {
  title: string; topic?: string; researchNotes?: string
  ideaCategories?: string[]; sourceUrl?: string
}
export interface VetResult { score: number; reasoning: string; evidence: string }

export async function vetIdea(input: VetInput): Promise<VetResult>
```

Calls gateway `/v1/chat/completions` with Haiku model. Prompt includes brand context (AI Orchestrators, Njin, Devwiz). Score clamped 1-10, reasoning/evidence truncated to 500 chars. On gateway error or parse failure, returns `score: 5` with "default pass" reasoning.

**Rejection logic** (in API route POST handler): If `vetScore <= 3`, return HTTP 200 with `{ vetted: false, vetScore, vetReasoning, vetEvidence }` — the idea is not saved.

#### 21.2.4 Database — `lib/db-content.ts` additions

Add idea-specific columns to the `content` table via migration:

```sql
ALTER TABLE content ADD COLUMN ideaCategories TEXT DEFAULT '';
ALTER TABLE content ADD COLUMN sourceUrl TEXT DEFAULT '';
ALTER TABLE content ADD COLUMN sourceType TEXT DEFAULT '';
ALTER TABLE content ADD COLUMN contentFormats TEXT DEFAULT '';
ALTER TABLE content ADD COLUMN promotedTaskId TEXT;
ALTER TABLE content ADD COLUMN promotedPipelineIds TEXT DEFAULT '';
ALTER TABLE content ADD COLUMN vetScore INTEGER;
ALTER TABLE content ADD COLUMN vetReasoning TEXT DEFAULT '';
ALTER TABLE content ADD COLUMN vetEvidence TEXT DEFAULT '';
```

**Ideas query functions:**

```typescript
export interface IdeaQueryParams {
  category?: string; search?: string
  sortBy?: string; sortDir?: "ASC" | "DESC"
  limit?: number; offset?: number
}

getIdeas(params: IdeaQueryParams): ContentItem[]
// WHERE contentType = 'Idea' + filters. Sortable by createdAt/title/priority

countIdeas(params: IdeaQueryParams): number

getIdeaCategoryCounts(): Record<string, number>
// Parses JSON ideaCategories, returns per-category counts

promoteToPipeline(ideaId: string, formats: ContentFormat[], contentType: ContentType): string[]
// Creates N pipeline items (one per format) at "Research" stage
// Title: "{idea.title} — {format}". Stores IDs on idea's promotedPipelineIds
```

#### 21.2.5 API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/content` | GET `?mode=ideas&category=&search=&sortBy=&sortDir=&limit=&offset=` | `{ ideas, total, categoryCounts }` |
| `/api/content` | POST | Create idea — vets first, rejects if score <= 3 |
| `/api/content/promote-pipeline` | POST `{ contentId, formats, contentType }` | `{ pipelineIds: string[] }` |
| `/api/content/promote` | POST `{ contentId, category?, priority?, comment? }` | `{ taskId, description }` |

#### 21.2.6 Service & Hook — `services/content.service.ts`, `hooks/useIdeas.ts`

```typescript
// Service additions
export interface CreateContentResult {
  item?: ContentItem; vetted?: boolean
  vetScore?: number; vetReasoning?: string; vetEvidence?: string
}
getIdeasApi(params: IdeasSearchParams): Promise<{ ideas, total, categoryCounts }>
promoteToPipelineApi(contentId, { formats, contentType }): Promise<{ pipelineIds }>
```

`useIdeas` hook: manages ideas, total, categoryCounts, loading, category/search filters, sort (toggleable columns), pagination (`pageSize = 25`), 300ms debounced search, and `promoteToPipeline` action.

#### 21.2.7 Components — `components/content/`

| Component | Purpose |
|---|---|
| `IdeaCategoryTabs.tsx` | Category filter tabs with count badges |
| `IdeaSearchBar.tsx` | Search input + date range + source dropdown |
| `IdeaTable.tsx` | Sortable table with expandable rows showing vet score/reasoning/evidence |
| `IdeaSourcesSection.tsx` | Lists cron jobs with `idea-scan-` prefix; create source modal |
| `PromoteToPipelineModal.tsx` | Format selection + content type picker |

Reuses `BriefPagination` from Phase 10.

---

### 21.3 Content Studio — Multi-Platform Publishing

A full content creation and publishing pipeline. Replaces Content Centre for publishable content. Three tables (`posts`, `post_platforms`, `post_media`), 6 formats, 7 stages, 4 platforms, per-field AI draft generation, and LinkedIn publishing via Unipile.

#### 21.3.1 Types — `types/studio.types.ts`

```typescript
export type PostFormat = "text" | "carousel" | "short_video" | "long_video" | "blog" | "quote_card"
export type PostStage = "Idea" | "Research" | "Draft" | "Review" | "Scheduled" | "Published" | "Filed"
export type PostPlatform = "linkedin" | "youtube" | "instagram" | "blog"
export type PlatformStatus = "draft" | "scheduled" | "published" | "failed"

export interface CarouselSlide { slideNumber: number; text: string; designNotes: string }

export interface Post {
  id: string; title: string; format: PostFormat; stage: PostStage
  caption: string; body: string; hook: string; cta: string
  scriptNotes: string; slides: CarouselSlide[]
  researchNotes: string; topic: string; hashtags: string[]
  goalId?: string; priority: "High" | "Medium" | "Low"
  source: string; parentPostId?: string
  platforms: PostPlatformEntry[]
  createdAt: string; updatedAt: string
}

export interface PostPlatformEntry {
  id: string; postId: string; platform: PostPlatform
  platformStatus: PlatformStatus
  scheduledAt?: string; publishedAt?: string; publishedUrl?: string
  platformPostId?: string; captionOverride?: string
  approvalId?: string; error?: string
}

export interface PostMedia {
  id: string; postId: string
  mediaType: "image" | "video" | "document"
  filename: string; mimeType: string; fileSize: number
  filePath: string; sortOrder: number; altText: string; metadata?: string
}

export interface StudioColumn { id: PostStage; name: string; color: string; items: Post[] }
```

#### 21.3.2 Constants — `lib/studio-constants.ts`

```typescript
export const ALL_FORMATS: PostFormat[] = ["text", "carousel", "short_video", "long_video", "blog", "quote_card"]
export const FORMAT_LABELS: Record<PostFormat, string> = { text: "Text Post", carousel: "Carousel", /* ... */ }
export const FORMAT_COLORS: Record<PostFormat, { bg: string; text: string }> = { /* ... */ }
export const ALL_PLATFORMS: PostPlatform[] = ["linkedin", "youtube", "instagram", "blog"]
export const PLATFORM_LABELS: Record<PostPlatform, string> = { /* ... */ }
export const PLATFORM_COLORS: Record<PostPlatform, { bg: string; text: string }> = { /* ... */ }
export const STUDIO_STAGES: PostStage[] = ["Idea", "Research", "Draft", "Review", "Scheduled", "Published", "Filed"]
export const PIPELINE_STAGES: PostStage[] = ["Research", "Draft", "Review", "Scheduled", "Published", "Filed"]
export const STAGE_COLORS: Record<PostStage, string> = { /* hex values */ }
```

#### 21.3.3 Tone Rules — `lib/tone-constants.ts`

Shared tone-of-voice rules and banned words used by the AI draft API. Enforces consistent writing style across all generated content.

#### 21.3.4 Database Schemas — `lib/db.ts` additions

```sql
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'text',
  stage TEXT NOT NULL DEFAULT 'Idea',
  caption TEXT DEFAULT '', body TEXT DEFAULT '',
  hook TEXT DEFAULT '', cta TEXT DEFAULT '',
  scriptNotes TEXT DEFAULT '', slides TEXT DEFAULT '[]',
  researchNotes TEXT DEFAULT '', topic TEXT DEFAULT '',
  hashtags TEXT DEFAULT '[]',
  goalId TEXT, priority TEXT NOT NULL DEFAULT 'Medium',
  source TEXT NOT NULL DEFAULT 'Manual',
  parentPostId TEXT,
  createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL,
  FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE SET NULL,
  FOREIGN KEY (parentPostId) REFERENCES posts(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_posts_stage ON posts(stage);
CREATE INDEX IF NOT EXISTS idx_posts_format ON posts(format);
CREATE INDEX IF NOT EXISTS idx_posts_updated ON posts(updatedAt DESC);

CREATE TABLE IF NOT EXISTS post_platforms (
  id TEXT PRIMARY KEY,
  postId TEXT NOT NULL,
  platform TEXT NOT NULL,
  platformStatus TEXT NOT NULL DEFAULT 'draft',
  scheduledAt TEXT, publishedAt TEXT,
  publishedUrl TEXT DEFAULT '', platformPostId TEXT DEFAULT '',
  captionOverride TEXT DEFAULT '', approvalId TEXT, error TEXT DEFAULT '',
  FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_post_platforms_post ON post_platforms(postId);

CREATE TABLE IF NOT EXISTS post_media (
  id TEXT PRIMARY KEY,
  postId TEXT NOT NULL,
  mediaType TEXT NOT NULL DEFAULT 'image',
  filename TEXT NOT NULL DEFAULT '', mimeType TEXT NOT NULL DEFAULT '',
  fileSize INTEGER NOT NULL DEFAULT 0, filePath TEXT NOT NULL DEFAULT '',
  sortOrder INTEGER NOT NULL DEFAULT 0, altText TEXT DEFAULT '',
  metadata TEXT DEFAULT '',
  FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_post_media_post ON post_media(postId);
```

#### 21.3.5 Database CRUD

**`lib/db-posts.ts`** — `getPosts(stage?, format?)`, `getPostById(id)`, `createPost(input)`, `updatePost(id, updates)`, `deletePost(id)`, `searchPosts(query, limit)`. Posts include joined `post_platforms` data. Activity logged on create/update/stage-change/delete.

**`lib/db-post-platforms.ts`** — `getPlatforms(postId)`, `addPlatform(postId, platform)`, `updatePlatform(id, updates)`, `deletePlatform(id)`.

**`lib/db-post-media.ts`** — `getMedia(postId)`, `addMedia(input)`, `deleteMedia(id)`. Files stored at `/root/.openclaw/media/`.

#### 21.3.6 LinkedIn Publisher — `lib/linkedin-publisher.ts`

Publishes to LinkedIn via Unipile REST API. Supports text posts, image posts (with media upload), and document posts (carousel PDF). Uses `UNIPILE_DSN` and `UNIPILE_API_KEY` from environment.

#### 21.3.7 API Routes — `app/api/studio/`

| Route | Method | Purpose |
|---|---|---|
| `/api/studio/posts` | GET | List posts (optional `stage`, `format` filters) |
| `/api/studio/posts` | POST | Create post |
| `/api/studio/posts/[id]` | GET/PATCH/DELETE | Single post CRUD |
| `/api/studio/posts/[id]/platforms` | POST/PATCH/DELETE | Per-platform state management |
| `/api/studio/posts/[id]/media` | POST (multipart) | File upload to `/root/.openclaw/media/` |
| `/api/studio/draft` | POST | AI per-field generation (hook, caption, cta, body, scriptNotes, slides) |
| `/api/studio/publish` | POST | Publish to LinkedIn via Unipile |

The draft API generates format-specific content with tone-of-voice rules. Returns variants for hook/cta fields, single draft for others.

#### 21.3.8 Service & Hooks

**`services/studio.service.ts`** — wraps all Studio API calls.

**`hooks/useStudio.ts`** — manages posts state, pipeline columns, filters, and CRUD operations.

**`hooks/usePostComposer.ts`** — manages the post editing form state (fields, slides, platforms, media, dirty tracking).

#### 21.3.9 Components — `components/studio/` (14 files)

| Component | Purpose |
|---|---|
| `StudioPipelineBoard.tsx` | Kanban board with stage columns |
| `StudioPostCard.tsx` | Post card with format/platform badges |
| `PostComposer.tsx` | Main editing interface |
| `ComposerTextFields.tsx` | Hook, caption, body, CTA, script notes fields |
| `ComposerSlides.tsx` | Carousel slide editor (add/remove/reorder) |
| `ComposerPlatforms.tsx` | Platform toggle with per-platform status |
| `ComposerMedia.tsx` | File upload with drag-and-drop |
| `PublishingCalendar.tsx` | Month view calendar with scheduled posts |
| `CalendarPostChip.tsx` | Post preview chip on calendar dates |
| `PostSlideOver.tsx` | Detail slide-over with composer |
| `FormatPicker.tsx` | Format selection grid with icons |
| `PlatformBadge.tsx` | Coloured platform pill |
| `StudioStatCards.tsx` | Format/stage distribution stats |
| `PublishConfirmModal.tsx` | Preview before publishing to LinkedIn |
| `PostDraftPopover.tsx` | Inline AI generation per field |

#### 21.3.10 Auto-Migration

`migrateContentToPosts()` in `lib/db.ts` copies non-Idea `content` rows into the `posts` table on first run, preserving titles, topics, and stages.

#### 21.3.11 Managed Skills (3)

Deploy these to `~/.openclaw/skills/`:
- **content-writer** — Tone-of-voice writing with hook formulas and platform-specific rhythm rules
- **video-planner** — Short/long-form script templates with strategy gates and YouTube psychology
- **carousel-planner** — Slide text frameworks (6 C's, AIDA, Simple 3-Part) with design notes

---

### 21.4 LinkedIn Intelligence — AI-Powered LinkedIn CRM

A full LinkedIn inbox management system with AI scoring, categorization, draft generation, and connection automation. **Requires a Unipile account ($)** for LinkedIn API access.

#### 21.4.1 Types — `types/linkedin.types.ts`

```typescript
export type ThreadStatus = "unread" | "needs-reply" | "qualified" | "waiting" | "snoozed" | "archived"
export type ThreadCategory =
  | "sales_inquiry" | "networking" | "job_opportunity" | "partnership"
  | "recruiter" | "spam" | "support" | "personal" | "other" | ""
export type MessageDirection = "incoming" | "outgoing"
export type LinkedInActionType = "send_message" | "send_invite" | "create_post" | "react" | "comment"
export type LinkedInActionStatus = "pending" | "approved" | "executed" | "rejected" | "failed"
export type RightPanelView = "contact" | "wamp" | "draft" | "enrichment"
export type WampBand = "cold" | "cool" | "warm" | "hot" | "on-fire"
export type InvitationDecision = "accepted" | "declined" | "error"

export interface WampV2Score {
  total: number; band: WampBand
  suggestedBusiness: "devwiz" | "njin" | "ai-orchestrators" | null
  layer1: { businessStage: number; buyerVsCompetitor: number; painOpportunity: number; subtotal: number }
  layer2: { topicRelevance: number; opennessBuyingSignals: number; engagementQuality: number; subtotal: number }
  layer3: { curiosityQuestioning: number; needPainDisclosure: number; reciprocityInvestment: number; readinessToAct: number; subtotal: number }
  dmConversationExists: boolean; summary: string; messagingGuidance: string
}

export interface LinkedInThread {
  id: string; unipileId: string; participantId: string
  participantName: string; participantHeadline: string
  participantAvatarUrl: string; participantProfileUrl: string
  lastMessage: string; lastMessageAt: string
  lastMessageDirection: MessageDirection; unreadCount: number
  status: ThreadStatus; category: ThreadCategory
  champScore?: number; wampScore?: number; qualificationData?: string
  isSelling: boolean; isQualified: boolean; isPartner: boolean
  classifiedAt?: string; intent: string
  enrichmentData?: string; postData?: string; snoozeUntil?: string
  isSnoozed: boolean; isArchived: boolean
  manualClassification?: boolean; classificationNote?: string
  syncedAt: string; createdAt: string; updatedAt: string
}

export interface LinkedInMessage {
  id: string; threadId: string; unipileId: string
  senderId: string; senderName: string; content: string
  direction: MessageDirection; timestamp: string
}

export interface LinkedInAction {
  id: string; actionType: LinkedInActionType
  targetId: string; targetName: string; payload: string
  status: LinkedInActionStatus; approvalId?: string
  error?: string; executedAt?: string
  createdAt: string; updatedAt: string
}

export interface ProcessedInvitation {
  id: string; unipileInvitationId: string
  inviterName: string; inviterHeadline: string; inviterLocation: string
  inviterProviderId: string; invitationText: string
  decision: InvitationDecision; reason: string; icpMatch: string
  threadId: string; messagesSent: number; processedAt: string
}

export interface DraftHistoryEntry {
  id: string; threadId: string; instruction: string
  variants: string[]; usedVariantIndex: number | null; createdAt: string
}

export interface ScoreHistoryEntry {
  id: string; threadId: string; total: number
  band: WampBand; scoreData: WampV2Score; createdAt: string
}
```

#### 21.4.2 Constants — `lib/linkedin-constants.ts`

Status colours, category labels/colours, WAMP band thresholds (Cold 0-20, Cool 21-40, Warm 41-60, Hot 61-80, On Fire 81-100), action type/status labels, inbox filter order (Unread, Needs Reply, Waiting, Partners, Spammers, Snoozed, Archived, All), category filter options, and `formatRelativeTime()` utility.

#### 21.4.3 Database Schemas — `lib/db.ts` additions

```sql
CREATE TABLE IF NOT EXISTS linkedin_threads (
  id TEXT PRIMARY KEY,
  unipileId TEXT UNIQUE,
  participantId TEXT,
  participantName TEXT NOT NULL DEFAULT '',
  participantHeadline TEXT DEFAULT '',
  participantAvatarUrl TEXT DEFAULT '',
  participantProfileUrl TEXT DEFAULT '',
  lastMessage TEXT DEFAULT '',
  lastMessageAt TEXT,
  lastMessageDirection TEXT DEFAULT '',
  unreadCount INTEGER DEFAULT 0,
  status TEXT DEFAULT 'needs-reply',
  category TEXT DEFAULT '',
  champScore INTEGER,
  wampScore INTEGER,
  qualificationData TEXT,
  isSelling INTEGER DEFAULT 0,
  isQualified INTEGER DEFAULT 0,
  isPartner INTEGER DEFAULT 0,
  classifiedAt TEXT,
  intent TEXT DEFAULT '',
  enrichmentData TEXT,
  postData TEXT,
  snoozeUntil TEXT,
  isSnoozed INTEGER DEFAULT 0,
  isArchived INTEGER DEFAULT 0,
  manualClassification INTEGER DEFAULT 0,
  classificationNote TEXT DEFAULT '',
  syncedAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
-- Indexes: status, lastMessageAt DESC, (status,isSnoozed), classifiedAt, createdAt

CREATE TABLE IF NOT EXISTS linkedin_messages (
  id TEXT PRIMARY KEY,
  threadId TEXT NOT NULL,
  unipileId TEXT UNIQUE,
  senderId TEXT, senderName TEXT DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  direction TEXT NOT NULL DEFAULT 'incoming',
  timestamp TEXT NOT NULL,
  FOREIGN KEY (threadId) REFERENCES linkedin_threads(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS linkedin_actions (
  id TEXT PRIMARY KEY,
  actionType TEXT NOT NULL,
  targetId TEXT, targetName TEXT DEFAULT '',
  payload TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  approvalId TEXT, error TEXT, executedAt TEXT,
  createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS linkedin_invitations (
  id TEXT PRIMARY KEY,
  unipileInvitationId TEXT UNIQUE NOT NULL,
  inviterName TEXT NOT NULL DEFAULT '',
  inviterHeadline TEXT DEFAULT '', inviterLocation TEXT DEFAULT '',
  inviterProviderId TEXT DEFAULT '', invitationText TEXT DEFAULT '',
  decision TEXT NOT NULL DEFAULT 'error', reason TEXT DEFAULT '',
  icpMatch TEXT, threadId TEXT, messagesSent INTEGER NOT NULL DEFAULT 0,
  processedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS linkedin_draft_history (
  id TEXT PRIMARY KEY,
  threadId TEXT NOT NULL,
  instruction TEXT DEFAULT '',
  variants TEXT NOT NULL DEFAULT '[]',
  usedVariantIndex INTEGER,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (threadId) REFERENCES linkedin_threads(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS linkedin_score_history (
  id TEXT PRIMARY KEY,
  threadId TEXT NOT NULL,
  total INTEGER NOT NULL, band TEXT NOT NULL,
  scoreData TEXT NOT NULL DEFAULT '{}',
  createdAt TEXT NOT NULL,
  FOREIGN KEY (threadId) REFERENCES linkedin_threads(id) ON DELETE CASCADE
);
```

#### 21.4.4 Database CRUD — 4 files

**`lib/db-linkedin.ts`** — Thread CRUD (`getThreads`, `getThreadCount`, `getThreadById`, `upsertThread`, `updateThread`), message CRUD (`getMessages`, `upsertMessage`), action CRUD (`getActions`, `createAction`, `updateActionStatus`), filter logic (spammers/partners excluded from normal tabs), `unsnoozeExpiredThreads()`, `getUnclassifiedThreadIds()`, `getManualClassifications()`.

**`lib/db-linkedin-drafts.ts`** — `saveDraftGeneration(threadId, instruction, variants)`, `getDraftHistory(threadId)`, `markDraftUsed(id, variantIndex)`.

**`lib/db-linkedin-scores.ts`** — `saveScoreHistory(threadId, total, band, scoreData)`, `getScoreHistory(threadId)`.

**`lib/db-linkedin-invitations.ts`** — `saveInvitation(input)`, `getInvitations(limit?, offset?)`, `getInvitationStats()`.

#### 21.4.5 Unipile Client — `lib/unipile.ts`

Singleton Unipile SDK client using `UNIPILE_DSN` and `UNIPILE_API_KEY` environment variables. Provides thread/message sync, message sending, archive, and read-mark operations.

#### 21.4.6 Key Libraries

**`lib/wamp-v2-prompt.ts`** — WAMP v2 scoring prompt. 3-layer 0-100 system: Layer 1 Profile Fit (0-30), Layer 2 Post & Content (0-30), Layer 3 DM Conversation (0-40). Sellers always 0-20, capped at 60 without DMs.

**`lib/draft-prompts.ts`** — `buildDraftPrompt()` with PACE/ACE/SPIN/Hormozi frameworks, WAMP-driven assertiveness. Includes enrichment + post data for personalisation.

**`lib/draft-banned-words.ts`** — 100+ AI-sounding words to avoid in drafts.

**`lib/invitation-processor.ts`** — `processInvitations()`: fetch received invitations via Unipile REST, country whitelist check (US/CA/UK/AU/NZ/SG/FR/DE/NL), LLM classification (founder/CEO + ICP match + spam), accept/decline, 3-message welcome sequence with delays. Max 15 per run.

#### 21.4.7 API Routes — `app/api/linkedin/`

| Route | Method | Purpose |
|---|---|---|
| `/api/linkedin` | GET | List threads with filters (status, search, category, pagination) |
| `/api/linkedin/[id]` | GET/PATCH | Thread detail / update |
| `/api/linkedin/[id]/messages` | GET | Thread messages |
| `/api/linkedin/messages` | POST | Send DM via Unipile |
| `/api/linkedin/sync` | POST | Sync threads + messages from Unipile |
| `/api/linkedin/read` | POST | Mark thread read in Unipile + set status |
| `/api/linkedin/classify` | POST | AI auto-categorization (9 categories + flags) |
| `/api/linkedin/score` | POST | WAMP v2 scoring |
| `/api/linkedin/draft` | GET/POST/PATCH | Draft generation (3 variants), history, mark used |
| `/api/linkedin/posts` | POST | Fetch/cache LinkedIn posts for scoring |
| `/api/linkedin/enrich` | POST | Apollo enrichment |
| `/api/linkedin/invitations` | GET/POST | Invitation processing status + trigger |

#### 21.4.8 Service & Hook

**`services/linkedin.service.ts`** — wraps all LinkedIn API calls including `getDraftHistoryApi`, `markDraftUsedApi`, `getScoreHistoryApi`.

**`hooks/useLinkedIn.ts`** — manages threads, messages, active thread, filters, pagination, and all action handlers.

**`hooks/useVoiceInput.ts`** — Web Speech API hook, `en-AU` locale, 3s silence auto-stop.

#### 21.4.9 Components — `components/linkedin/` (15+ files)

| Component | Purpose |
|---|---|
| `LinkedInInbox.tsx` | Main page layout with thread list + right panel |
| `ThreadList.tsx` | Filterable thread list with status/category badges |
| `ThreadListItem.tsx` | Thread card with avatar, WAMP score, flags |
| `ConversationView.tsx` | Message thread with composer |
| `ConversationHeader.tsx` | 6-button action toolbar (Score, Draft, Classify, Enrich, Snooze, Archive) |
| `ContactIntelPanel.tsx` | Contact detail panel composed from 5 sub-components |
| `WampBreakdownPanel.tsx` | Score breakdown with layer details, rescore button, history timeline |
| `DraftPanel.tsx` | AI draft display with 3 variants + history |
| `DraftComposer.tsx` | Textarea + voice + send |
| `DraftHistoryList.tsx` | Expandable draft history entries |
| `ScoreHistoryTimeline.tsx` | Timeline with coloured band scores and deltas |
| `EnrichmentPanel.tsx` | Apollo enrichment data display |
| `SnoozeMenu.tsx` | Snooze presets dropdown |
| `panels/*.tsx` | 5 sub-components for ContactIntelPanel |

#### 21.4.10 CSP & Permissions

Add to `next.config.ts` security headers:
- `img-src` includes `https://media.licdn.com` (LinkedIn avatars)
- `Permissions-Policy: microphone=(self)` (voice input)

---

### 21.5 Lead Generation — Outreach Pipeline & Enrichment

A 9-stage outreach pipeline with Apollo.io enrichment, AI-generated outreach, call outcome tracking, and follow-up automation.

#### 21.5.1 Types — `types/lead.types.ts`

```typescript
export type LeadStatus =
  | "New" | "Researching" | "Qualified" | "Outreach Ready"
  | "LinkedIn Request" | "Email" | "Call" | "Follow-up Ready" | "Follow Up"
  | "Successful" | "Unsuccessful" | "Archived"
  | "Contacted"  // deprecated — kept for existing data

export type CallOutcome = "connected" | "voicemail" | "no-answer" | "declined" | ""
export type LeadPriority = "High" | "Medium" | "Low"
export type LeadSource = "Manual" | "Bright Data" | "Apollo" | "Cron" | "Referral" | "Import" | "LinkedIn"
export type LeadBusiness = "Njin" | "Devwiz" | "AI Orchestrators"

export interface Lead {
  id: string; companyName: string; contactName: string; contactTitle: string
  email: string; emailVerified: string; phone: string; website: string
  linkedinUrl: string; location: string; industry: string
  companySize: string; estimatedRevenue: string
  status: LeadStatus; business: LeadBusiness; priority: LeadPriority
  score: number; source: LeadSource
  companyData: string; enrichmentData: string
  notes: string; nextAction: string; nextActionDate?: string
  lastContactedAt?: string; goalId?: string
  signalType: string; signalDetail: string; tags: string; logoUrl: string
  outreachDrafts: string; researchSummary: string
  callOutcome: CallOutcome; callNotes: string; followUpDrafts: string
  linkedinConnected: boolean
  createdAt: string; updatedAt: string
}

export type LeadActivityType = "note" | "call" | "email" | "linkedin" | "meeting" | "research" | "status_change"

export interface LeadActivity {
  id: string; leadId: string; activityType: LeadActivityType
  content: string; outcome: string; createdAt: string
}

export interface LeadStats {
  total: number; qualified: number
  contactedThisWeek: number; hotLeads: number; avgScore: number
}
```

#### 21.5.2 Constants — `lib/lead-constants.ts`

```typescript
export const PIPELINE_STATUSES: LeadStatus[] = [
  "New", "Researching", "Qualified", "Outreach Ready",
  "LinkedIn Request", "Email", "Call", "Follow-up Ready", "Follow Up",
]
export const TERMINAL_STATUSES: LeadStatus[] = ["Successful", "Unsuccessful", "Archived"]
export const MANUAL_STAGES: LeadStatus[] = ["New", "Researching", "Qualified", "Call"]
export const ROTTING_HOURS = 48
export const STATUS_COLORS: Record<LeadStatus, string> = { /* hex values per status */ }
export const BUSINESSES: LeadBusiness[] = ["Njin", "Devwiz", "AI Orchestrators"]
export const SOURCES: LeadSource[] = ["Manual", "Bright Data", "Apollo", "Cron", "Referral", "Import", "LinkedIn"]
export const SCORE_THRESHOLDS = { hot: 80, warm: 50, cool: 20 } as const
export const CALL_OUTCOMES: Array<{ value: CallOutcome; label: string }>
export const CSV_HEADERS: string[]
export function getScoreLevel(score: number): string  // "hot"|"warm"|"cool"|"cold"
```

#### 21.5.3 ICP Definitions — `lib/lead-icp.ts`

Three business ICPs with keywords, target industries, and exclude keywords:
- **AI Orchestrators** — Online B2B educators, $1M+ revenue
- **Njin** — B2B companies running ads, $1M+ revenue
- **Devwiz** — SaaS builders, any stage

#### 21.5.4 Outreach Rules — `lib/lead-outreach.ts`

Hardcoded strategy rules: micro-lists, trigger-based targeting, asset-based CTAs, 4-email sequence, omnichannel tier system.

#### 21.5.5 Database Schema — `lib/db.ts` additions

```sql
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  companyName TEXT NOT NULL,
  contactName TEXT DEFAULT '', contactTitle TEXT DEFAULT '',
  email TEXT DEFAULT '', emailVerified TEXT DEFAULT '',
  phone TEXT DEFAULT '', website TEXT DEFAULT '',
  linkedinUrl TEXT DEFAULT '', location TEXT DEFAULT '',
  industry TEXT DEFAULT '', companySize TEXT DEFAULT '',
  estimatedRevenue TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'New',
  business TEXT NOT NULL DEFAULT 'Njin',
  priority TEXT NOT NULL DEFAULT 'Medium',
  score INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'Manual',
  companyData TEXT DEFAULT '', enrichmentData TEXT DEFAULT '',
  notes TEXT DEFAULT '', nextAction TEXT DEFAULT '',
  nextActionDate TEXT, lastContactedAt TEXT, goalId TEXT,
  signalType TEXT DEFAULT '', signalDetail TEXT DEFAULT '',
  tags TEXT DEFAULT '', logoUrl TEXT DEFAULT '',
  outreachDrafts TEXT DEFAULT '', researchSummary TEXT DEFAULT '',
  callOutcome TEXT DEFAULT '', callNotes TEXT DEFAULT '',
  followUpDrafts TEXT DEFAULT '',
  linkedinConnected INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL,
  FOREIGN KEY (goalId) REFERENCES goals(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_business ON leads(business);

CREATE TABLE IF NOT EXISTS lead_activities (
  id TEXT PRIMARY KEY,
  leadId TEXT NOT NULL,
  activityType TEXT NOT NULL DEFAULT 'note',
  content TEXT NOT NULL DEFAULT '', outcome TEXT DEFAULT '',
  createdAt TEXT NOT NULL,
  FOREIGN KEY (leadId) REFERENCES leads(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lead_comments (
  id TEXT PRIMARY KEY,
  leadId TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'user',
  createdAt TEXT NOT NULL,
  FOREIGN KEY (leadId) REFERENCES leads(id) ON DELETE CASCADE
);
```

#### 21.5.6 Database CRUD — `lib/db-leads.ts`, `lib/db-lead-activities.ts`

```typescript
// lib/db-leads.ts
getLeads(opts?: { status?, business?, search?, limit?, offset? }): Lead[]
getLeadCount(opts?): number
getLeadById(id: string): Lead | null
getLeadByLinkedinUrl(url: string): Lead | null
getCallList(): Lead[]  // leads at "Call" status
createLead(input): Lead
updateLead(id, updates): Lead | null
deleteLead(id): void
getLeadStats(): LeadStats

// lib/db-lead-activities.ts
getActivities(leadId: string): LeadActivity[]
createActivity(input: { leadId, activityType, content, outcome? }): LeadActivity
```

#### 21.5.7 Pipeline Logic — `lib/lead-pipeline.ts`

```typescript
executeOutreach(leadId: string): Promise<void>
// Outreach Ready → LinkedIn Request (sends via Unipile or skips to Email)

markLinkedInConnected(leadId: string): void
// LinkedIn Request: marks connected, advances to Email

advanceToEmail(leadId: string): void
// LinkedIn Request → Email (auto after connect or skip)

logCallOutcome(leadId: string, outcome: CallOutcome, notes: string): void
// Call → Follow-up Ready (generates follow-up drafts via AI)

executeFollowUp(leadId: string): Promise<void>
// Follow-up Ready → Follow Up (sends follow-up messages)
```

#### 21.5.8 Enrichment — `lib/lead-enrichment.ts`, `lib/apollo.ts`

**`lib/apollo.ts`** — Apollo.io integration:
- `searchOrganizations(query)` — `/mixed_companies/search` with keyword tags
- `searchPeople(filters)` — `/mixed_people/api_search` with `filter_params` (NOT the deprecated `/mixed_people/search`)
- Requires `APOLLO_API_KEY` in `.env.local`

**`lib/lead-enrichment.ts`** — `enrichLead(leadId)`: orchestrates Apollo org + Apollo people search + score calculation. Returns `{ lead, sources, errors }`.

#### 21.5.9 Scoring (max 100, 12 factors)

| Factor | Points |
|---|---|
| Phone | +20 |
| Email | +10 |
| Contact name | +5 |
| Title | +5 |
| Website | +5 |
| LinkedIn URL | +5 |
| Industry | +5 |
| Revenue | +10 |
| Company size | +5 |
| ICP revenue match | +10 |
| Industry match | +10 |
| Signal | +5+5 |

#### 21.5.10 Outreach Generation — `lib/lead-outreach-gen.ts`

AI-generated outreach drafts and follow-up messages via the gateway. Context-aware: uses ICP data, enrichment data, LinkedIn status, call outcome, and notes. Follow-up generation adapts based on call outcome (connected vs voicemail vs no-answer).

#### 21.5.11 Signal Detection — `lib/lead-signals.ts`

`findLeads({ business, limit, autoEnrich })` — searches Apollo org search + Bright Data for potential leads matching ICP criteria. Deduplicates by company name + domain.

#### 21.5.12 API Routes — `app/api/leads/`

| Route | Method | Purpose |
|---|---|---|
| `/api/leads` | GET | List leads with filters + stats + callList |
| `/api/leads` | POST | Create lead |
| `/api/leads/[id]` | GET/PATCH/DELETE | Single lead CRUD |
| `/api/leads/activities` | GET/POST | Lead activity log |
| `/api/leads/comments` | GET/POST | Lead comments |
| `/api/leads/enrich` | POST | Apollo enrichment |
| `/api/leads/find` | POST | Signal detection + lead discovery |
| `/api/leads/generate-outreach` | POST | AI outreach draft generation |
| `/api/leads/execute-outreach` | POST | Execute outreach (sends messages) |
| `/api/leads/call-outcome` | POST | Log call outcome + generate follow-ups |
| `/api/leads/execute-followup` | POST | Send follow-up messages |
| `/api/leads/research-summary` | POST | AI research summary generation |
| `/api/leads/export` | GET | CSV export |
| `/api/leads/chat` | POST | Lead-scoped chat with SSE streaming |

The chat endpoint injects ICPs, outreach rules, pipeline stats, and tone directives into the AI context.

#### 21.5.13 Service & Hooks

**`services/lead.service.ts`** — wraps all Lead API calls.

**`hooks/useLeads.ts`** — manages leads state, pipeline columns, filters, enrichment/outreach/call/follow-up actions with loading states.

**`hooks/useLeadChat.ts`** — SSE streaming chat with lead-scoped context.

**`hooks/useLeadComments.ts`** — comment CRUD for leads.

#### 21.5.14 Components — `components/leads/` (18 files)

| Component | Purpose |
|---|---|
| `LeadPipelineBoard.tsx` | Kanban board with 9 pipeline columns |
| `LeadPipelineCard.tsx` | Card with score badge, LinkedIn status, rotting indicator |
| `LeadTable.tsx` | Sortable table view |
| `LeadSlideOver.tsx` | Detail panel with actions |
| `LeadSlideOverFields.tsx` | Editable lead fields |
| `LeadFilters.tsx` | Status, business, source filters |
| `LeadStatCards.tsx` | Pipeline stats (total, qualified, hot, avg score) |
| `CreateLeadModal.tsx` | New lead form |
| `OutreachDraftsModal.tsx` | Editable AI drafts + execute button |
| `CallOutcomeForm.tsx` | Outcome dropdown + notes |
| `FollowUpDraftsModal.tsx` | Editable follow-up drafts + send button |
| `LeadActivityTimeline.tsx` | Activity log |
| `LeadCommentSection.tsx` | Comments thread |
| `LeadChatInput.tsx` | Chat input for lead-scoped AI |
| `CallListTable.tsx` | Filtered table of leads at "Call" stage |
| `FindLeadsModal.tsx` | Signal detection interface |
| `LeadScoreBadge.tsx` | Coloured score circle |
| `LeadExportButton.tsx` | CSV download |

#### 21.5.15 Pipeline Card Indicators

- **Score badge** — Number-only coloured circle (Hot=red, Warm=amber, Cool=blue, Cold=gray)
- **LinkedIn status** — Green badge (connected), amber badge (pending)
- **Rotting dot** — Red dot on cards in manual stages (New, Researching, Qualified, Call) after 48h without activity. Uses `MANUAL_STAGES` and `ROTTING_HOURS` constants

---

## Files Summary

| Feature | New Files | Modified Files | ~Total Lines |
|---|---|---|---|
| **21.1 Documents** | 8 (types, constants, db, api, service, hook, 6 components) | 3 (db.ts, search route, types/index.ts) | ~650 |
| **21.2 Ideas** | 6 (vetting, constants additions, 4 components, hook) | 4 (db-content.ts, content route, content service, types) | ~800 |
| **21.3 Content Studio** | 22 (types, 3 db files, constants, tone, publisher, 6 api routes, service, 2 hooks, 14 components) | 3 (db.ts, search route, sidebar) | ~2,800 |
| **21.4 LinkedIn** | 25+ (types, 4 db files, unipile, constants, wamp prompt, draft prompts, banned words, invitation processor, 12 api routes, service, 2 hooks, 15+ components) | 3 (db.ts, next.config.ts CSP, sidebar) | ~3,500 |
| **21.5 Leads** | 25+ (types, 3 db files, 6 lib files, apollo, 13 api routes, service, 3 hooks, 18 components) | 3 (db.ts, sidebar, types/index.ts) | ~3,200 |
| **Total** | **~86 new files** | **~10 modified files** | **~11,000** |

## Verification

### Documents (21.1)
- [ ] Create a document with category "Notes" — appears in list
- [ ] Full-text search finds documents by content (not just title)
- [ ] Edit document via slide-over — changes persist
- [ ] Delete document — removed from list
- [ ] Global search (Cmd+K) returns document results
- [ ] API creates document via POST with `source: "api"` — correct source badge

### Ideas (21.2)
- [ ] Create an idea with title and category — AI vetting returns score
- [ ] Idea with vet score <= 3 is rejected (not saved, feedback shown)
- [ ] Category tabs show correct counts
- [ ] "Promote to Pipeline" creates N pipeline items (one per selected format)
- [ ] "Promote to Task" creates a task and moves idea to "Filed"
- [ ] Search finds ideas by title and topic

### Content Studio (21.3)
- [ ] Create a text post — appears in pipeline at "Idea" stage
- [ ] AI draft generates hook/caption/CTA with tone-of-voice rules
- [ ] Add LinkedIn platform — platform badge appears on card
- [ ] Upload media file — file stored at `/root/.openclaw/media/`
- [ ] Publish to LinkedIn via Unipile — `publishedUrl` populated
- [ ] Calendar view shows scheduled posts on correct dates
- [ ] Global search (Cmd+K) returns post results

### LinkedIn Intelligence (21.4)
- [ ] Sync threads from Unipile — threads appear in inbox
- [ ] WAMP v2 score generates 3-layer breakdown (0-100)
- [ ] Auto-classify assigns category + flags (isSelling, isPartner)
- [ ] Generate AI drafts — 3 variants shown in Draft panel
- [ ] Send DM via Unipile — thread moves to "waiting"
- [ ] Snooze thread — disappears from active filters, returns on expiry
- [ ] Archive syncs to LinkedIn via Unipile
- [ ] Connection automation processes invitations (accept/decline + welcome sequence)
- [ ] Draft history shows previous generations with "used" badge
- [ ] Score history shows timeline with band deltas
- [ ] Spammers/partners excluded from normal filter tabs

### Lead Generation (21.5)
- [ ] Create lead manually — appears at "New" in pipeline
- [ ] Enrich via Apollo — score updates, enrichment data populates
- [ ] Generate outreach — AI drafts appear in modal
- [ ] Execute outreach — lead advances to "LinkedIn Request" or "Email"
- [ ] Log call outcome — lead advances to "Follow-up Ready"
- [ ] Execute follow-up — follow-up messages sent
- [ ] Pipeline rotting indicator shows red dot after 48h on manual stages
- [ ] CSV export downloads all leads
- [ ] Lead chat injects ICP + outreach rules as context
- [ ] "Find Leads" discovers prospects via Apollo org search
- [ ] Terminal statuses (Successful/Unsuccessful/Archived) removed from pipeline view
- [ ] `npm run build` succeeds without errors
- [ ] Deploy to VPS and verify on live dashboard
