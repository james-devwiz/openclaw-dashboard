// SQLite seed data — initial data and one-time data transformations

import type Database from "better-sqlite3"

export function runSeeds(db: Database.Database): void {
  seedReadCursors(db)
  seedImportedLeads(db)
  seedInitialIdeas(db)
  migrateImportedLeadsBusiness(db)
  migrateContentToPosts(db)
}

function seedReadCursors(db: Database.Database): void {
  const topics = db.prepare("SELECT DISTINCT topic FROM chat_messages").all() as Array<{ topic: string }>
  const now = new Date().toISOString()
  const stmt = db.prepare("INSERT OR IGNORE INTO chat_read_cursors (topic, lastReadAt) VALUES (?, ?)")
  for (const { topic } of topics) stmt.run(topic, now)
}

function seedImportedLeads(db: Database.Database): void {
  const count = (db.prepare("SELECT COUNT(*) as c FROM leads").get() as { c: number }).c
  if (count > 0) return

  const now = new Date().toISOString()
  const stmt = db.prepare(
    `INSERT INTO leads (id, companyName, contactName, contactTitle, email, phone, website, linkedinUrl,
     location, industry, estimatedRevenue, status, business, score, source, signalType, signalDetail, notes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New', 'Business C', ?, 'Import', ?, ?, ?, ?, ?)`
  )

  const leads = [
    { id: "lead-import-01", company: "Acme Coaching Group", contact: "Jane Smith", title: "Founder & CEO", email: "", phone: "", website: "https://example.com/acme-coaching", linkedin: "", location: "United States", industry: "Business Coaching", revenue: "$1M+", score: 35, signal: "coaching", detail: "Executive business coaching & leadership programs", notes: "Business coach, leadership focus" },
    { id: "lead-import-02", company: "Summit Consulting", contact: "", title: "", email: "", phone: "", website: "https://example.com/summit", linkedin: "", location: "United States", industry: "Business Consulting", revenue: "$1M+", score: 30, signal: "consulting", detail: "B2B consulting and professional services", notes: "Consulting firm, B2B education services" },
    { id: "lead-import-03", company: "Peak Advisory", contact: "John Doe", title: "Founder", email: "", phone: "", website: "https://example.com/peak", linkedin: "", location: "United Kingdom", industry: "Business Coaching", revenue: "$1M+", score: 35, signal: "coaching", detail: "Business coaching and consulting", notes: "Business coach, coaching programs" },
    { id: "lead-import-04", company: "Horizon Coaching", contact: "Sarah Johnson", title: "Founder & CEO", email: "", phone: "", website: "https://example.com/horizon", linkedin: "", location: "United States", industry: "Business Coaching", revenue: "$1M+", score: 40, signal: "coaching", detail: "Business coaching for entrepreneurs, programs and courses", notes: "US-based, coaching programs for entrepreneurs" },
    { id: "lead-import-05", company: "Growth Partners", contact: "Mike Williams", title: "CEO", email: "", phone: "", website: "https://example.com/growth-partners", linkedin: "", location: "United States", industry: "Business Consulting", revenue: "$1M+", score: 50, signal: "consulting", detail: "Consulting training, courses, and coaching for consultants", notes: "Large audience, multiple digital products, established brand" },
  ]

  for (const l of leads) {
    stmt.run(l.id, l.company, l.contact, l.title, l.email, l.phone, l.website, l.linkedin, l.location, l.industry, l.revenue, l.score, l.signal, l.detail, l.notes, now, now)
  }
}

function migrateImportedLeadsBusiness(db: Database.Database): void {
  db.prepare("UPDATE leads SET business = 'Business C' WHERE source = 'Import' AND business = 'Business A'").run()
}

function seedInitialIdeas(db: Database.Database): void {
  const count = (db.prepare("SELECT COUNT(*) as c FROM content WHERE contentType = 'Idea'").get() as { c: number }).c
  if (count > 0) return

  const now = new Date().toISOString()
  const stmt = db.prepare(
    `INSERT INTO content (id, title, contentType, stage, topic, researchNotes, draft, platform, priority, aiGenerated, source, ideaCategories, sourceType, createdAt, updatedAt)
     VALUES (?, ?, 'Idea', 'Idea', ?, ?, '', 'General', ?, 0, 'Manual', ?, 'Manual', ?, ?)`
  )

  const ideas = [
    { id: "idea-seed-01", title: "Customer discovery via Fathom transcripts", topic: "Use meeting recordings for AI transcript analysis and automation prioritization matrix", notes: "Fathom already records all meetings. AI can extract pain points, repeated manual tasks, and automation opportunities.", priority: "High", cats: '["Business Idea","AI Solution"]' },
    { id: "idea-seed-02", title: "Upwork as automation market validation", topic: "Search RPA/automation jobs to understand pricing and demand for AI automation services", notes: "Upwork job listings reveal what businesses are willing to pay for automation.", priority: "Medium", cats: '["Strategy Idea"]' },
    { id: "idea-seed-03", title: "Agents replace SaaS — product positioning", topic: "Position the SaaS business around the 'agents are the new SaaS' trend", notes: "The market is shifting from traditional SaaS to AI agent-based solutions.", priority: "High", cats: '["Strategy Idea","Business Idea"]' },
    { id: "idea-seed-04", title: "AI adoption consulting for executives", topic: "Help executives and firms adopt AI orchestration stacks as a paid service", notes: "Many executives know they need AI but don't know where to start.", priority: "Medium", cats: '["Business Idea"]' },
    { id: "idea-seed-05", title: "Computer use agents for legacy systems", topic: "GUI automation as 'universal API' for systems without clean APIs", notes: "Many enterprise systems lack APIs but have GUIs. Computer use agents can interact with any GUI.", priority: "Medium", cats: '["AI Solution","Business Idea"]' },
  ]

  for (const i of ideas) stmt.run(i.id, i.title, i.topic, i.notes, i.priority, i.cats, now, now)

  // Seed format-aware content idea
  const exists = db.prepare("SELECT id FROM content WHERE id = 'idea-seed-06'").get()
  if (!exists) {
    db.prepare(
      `INSERT INTO content (id, title, contentType, stage, topic, researchNotes, draft, platform, priority, aiGenerated, source, ideaCategories, sourceType, contentFormats, vetScore, vetReasoning, vetEvidence, createdAt, updatedAt)
       VALUES (?, ?, 'Idea', 'Idea', ?, ?, '', 'General', 'High', 0, 'Manual', ?, 'Manual', ?, 8, ?, ?, ?, ?)`
    ).run(
      "idea-seed-06", "AI orchestration tutorial series for YouTube",
      "Create a 5-part video series showing how to build an AI orchestration stack from scratch",
      "YouTube AI content is booming. Tutorials showing real setups get 3-5x engagement.",
      '["Content Idea"]', '["Short Form","Long Form"]',
      "Aligns with brand and ICP — high search volume for AI automation tutorials",
      "YouTube AI tutorials avg 50K+ views; series format increases watch time 40%",
      now, now
    )
  }
}

function migrateContentToPosts(db: Database.Database): void {
  const count = (db.prepare("SELECT COUNT(*) as c FROM posts").get() as { c: number }).c
  if (count > 0) return

  const rows = db.prepare("SELECT * FROM content WHERE contentType != 'Idea'").all() as Array<Record<string, unknown>>
  if (rows.length === 0) return

  const fmtMap: Record<string, string> = {
    "YouTube Script": "long_video", "Blog Post": "blog", "LinkedIn Content": "text",
    "Newsletter": "blog", "General Dictation": "text", "Meeting Transcript": "text",
  }
  const now = new Date().toISOString()
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO posts (id, title, format, stage, caption, body, topic, researchNotes, priority, source, goalId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?, ?, ?)`
  )
  for (const r of rows) {
    const fmt = fmtMap[r.contentType as string] || "text"
    const stage = r.stage === "Idea" ? "Research" : r.stage as string
    stmt.run(r.id, r.title, fmt, stage, r.draft || "", r.topic || "", r.researchNotes || "", r.priority || "Medium", r.source || "Manual", r.goalId || null, r.createdAt || now, r.updatedAt || now)
  }
}
