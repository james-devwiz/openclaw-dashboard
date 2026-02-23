// Banned words from AI Content Generation Guide — words that make content sound AI-generated

export const BANNED_WORDS: string[] = [
  // Abstract concepts
  "delve", "realm", "landscape", "journey", "tapestry", "vibrant",
  "embark", "excels", "vital", "comprehensive", "intricate", "pivotal",
  "paradigm", "paradigm shift", "synergy", "holistic", "robust",
  "leverage", "streamline", "spearhead", "cutting-edge", "state-of-the-art",
  "groundbreaking", "revolutionary", "game-changing", "disruptive",
  "transformative", "innovative", "next-generation", "best-in-class",
  "world-class", "bleeding-edge", "mission-critical", "value-added",
  "thought leadership", "deep dive", "granular", "scalable",
  "actionable", "ecosystem", "bandwidth", "core competency",

  // Transition phrases
  "moreover", "furthermore", "additionally", "consequently",
  "subsequently", "henceforth", "nevertheless", "notwithstanding",
  "albeit", "whereby", "therein", "heretofore",
  "in conclusion", "to summarize", "in summary",
  "as previously mentioned", "as noted above",

  // Intensifiers
  "significantly", "substantially", "considerably", "remarkably",
  "exceptionally", "profoundly", "fundamentally", "inherently",
  "undeniably", "unequivocally", "indisputably",

  // Formal constructions
  "it is worth noting that", "it should be noted that",
  "one might argue", "it goes without saying",
  "in today's fast-paced world", "in this day and age",
  "at the end of the day", "moving forward",
  "going forward", "circle back", "touch base",
  "reach out", "loop in", "take offline",

  // Generic expressions
  "unlock potential", "unlock the power", "unlock possibilities",
  "transform your approach", "elevate your",
  "paint a picture", "shed light on",
  "woven into the fabric", "tip of the iceberg",
  "scratching the surface", "food for thought",
  "take it to the next level", "hit the ground running",
  "low-hanging fruit", "move the needle",
  "push the envelope", "raise the bar",

  // AI-specific tells
  "certainly here are", "certainly here is",
  "I'd be happy to", "great question",
  "absolutely", "fascinating", "intriguing",
  "a deeper understanding", "journey of self-discovery",
  "arguably", "notably", "essentially", "ultimately",

  // Corporate jargon
  "stakeholders", "deliverables", "KPIs", "ROI",
  "bottom line", "top line", "pipeline",
  "ideate", "iterate", "pivot", "optimize",
  "align", "empower", "enable", "facilitate",
  "incentivize", "monetize", "operationalize",
  "verticalize", "productize",
]

export const BANNED_WORDS_PROMPT = `BANNED WORDS — Never use any of these in drafts:
${BANNED_WORDS.join(", ")}

Use simple alternatives instead. Examples:
- "delve" → "look into" or "explore"
- "leverage" → "use"
- "facilitate" → "help"
- "utilize" → "use"
- "however" → "but"
- "moreover" → "also" or "plus"
- "comprehensive" → "full" or "complete"
- "innovative" → (just describe what it does)
- "reach out" → "message" or "chat"
- "absolutely" → "yes" or "for sure"`
