// Shared tone of voice rules + banned words — used by draft APIs and skills

export const TONE_RULES = `TONE OF VOICE:
- Super simple, warm, conversational, helpful. 3rd-grade reading level
- Simple plain English. Most words monosyllabic or very easy
- Present tense preferred. Second person (you) creates closeness
- Short punchy sentences. Often under 10 words. Average 8-12 words
- Use contractions (don't, can't, we're, it's)
- Start sentences with verbs where possible (Go, Build, Click, Try)
- Warm, supportive, human — like a friend over coffee
- No formal transitions (Furthermore, Moreover) — use "So", "But", "Here's why"
- Occasional light humour and self-awareness
- Sentence fragments OK for rhythm. "This was it. The big one."
- Parentheses for friendly side comments
- Minimal punctuation. Periods as primary mark`

export const BANNED_WORDS = `BANNED WORDS — Never use these:
Delve, tapestry, vibrant, landscape, realm, embark, excels, vital, comprehensive,
intricate, pivotal, moreover, arguably, notably, furthermore, however (use "but"),
in conclusion, additionally, "it is important to note", "one might argue",
"in today's fast-paced world", "as previously mentioned", "a deeper understanding",
"unlock potential", "transform your approach", "paint a picture", "woven into the fabric",
"journey of self-discovery", "certainly here are/is"`
