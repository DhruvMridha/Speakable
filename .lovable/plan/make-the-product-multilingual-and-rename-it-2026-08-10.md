# Make the product multilingual (and rename it)

Keeps the existing visual identity, mascot, orb, gamification, navigation, progress and memory designs exactly as they are. Language becomes a first-class learner attribute layered on top.

## Naming — please confirm

The request says the product name is "Speakable", but later refers to "Speakyy" (which is also the published URL). I'll use **Speakable** everywhere unless you tell me otherwise.

## What gets built

### 1. A learner-profile language store (frontend only)
A small React context + browser storage holding the learner profile: active language, plus per-language history so switching never wipes anything.

Conceptual data model documented in the UI/code comments (no backend):

```text
learner_profile: { user_id, active_language, languages: [...] }
memory_entry:    { user_id, language, memory_type, concept, timestamp }
```

Supported languages: English (UK), Spanish, French, Hindi — each with flag, native greeting, sample mistake/correction, and its own progress + memory dataset (mocked).

### 2. Onboarding — new first step
New step "What do you want to learn?" placed before the existing three steps (now 4 of 4). Beautiful large language cards, each with a generated culture photo (London, Spain, Paris, India), flag, language name, native name, and learner count. Selecting one sets the active language for the whole prototype.

### 3. Home
Shows the active language prominently ("Spanish 🇪🇸") next to the greeting, with a compact language switcher. Session copy, focus concept and "pick up where you left off" pull from the active language's dataset.

### 4. Practice
Topic line, focus grammar concept, transcript lines and mascot speech bubbles come from the active language. The mascot greets and speaks in the selected language (e.g. "¿Listo para la conversación de hoy?"), with the English gloss underneath. Mascot states and controls unchanged.

### 5. Mascot
No redesign. It receives the language's greeting/reaction strings; all state artwork and animation stays identical.

### 6. Progress
Same layout, retitled "Spanish progress" with a language switcher chip row at the top. Level, XP, streak, achievements, metrics and sparklines read from the active language's dataset, so each language has its own numbers.

### 7. Memory
Same layout, scoped per language ("What Speakable remembers about your Spanish"). Strengths, working-on concepts and recent patterns come from the active language. Each memory item shows its memory_type and timestamp so the data model is visible.

### 8. Language switcher in navigation
- Desktop sidebar: a profile/language block above the "Start speaking" CTA showing the current flag + language, opening a small popover to switch (with "your history is kept" reassurance).
- Mobile: the same switcher in the top bar.
- Settings: "Learning languages" card listing all four with active state, per-language streak/level, and an add/switch action.

### 9. English-only interface
All UI copy, feedback reports, progress and memory descriptions stay in English. Target-language text appears only as quoted example utterances from the conversation, always with an English gloss.

### 10. Rename
"Lingo" → "Speakable" across wordmark, all route `head()` metadata, landing page, feedback, history and demo copy. The mascot keeps a character name — I'll keep calling the mascot "Lingo" as the character inside the product Speakable, unless you'd prefer the mascot renamed too.

## Files to modify

- `src/lib/language.tsx` (new) — language context, profile shape, per-language mock datasets
- `src/components/lingo/language-card.tsx` (new) — onboarding card + switcher popover
- `src/assets/` (new) — 4 generated culture images
- `src/routes/onboarding.tsx` — new first step
- `src/routes/_app.tsx` — wordmark rename, switcher in sidebar + mobile bar
- `src/routes/_app/home.tsx` — active language display
- `src/routes/_app/practice.tsx` — language-aware conversation
- `src/routes/_app/progress.tsx` — per-language progress
- `src/routes/_app/memory.tsx` — per-language memory
- `src/routes/_app/settings.tsx` — languages card
- `src/routes/_app/feedback.tsx`, `history.tsx`, `demo.tsx`, `index.tsx`, `__root.tsx` — rename + language context in copy
- `src/routes/_app.tsx` provider mount; provider also wraps onboarding via `__root.tsx`

No backend, APIs, Qdrant, Rime, STT or LLM work.
