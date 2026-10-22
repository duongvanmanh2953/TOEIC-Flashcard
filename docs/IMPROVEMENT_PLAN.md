# Improvement Plan — LetStuN AI (V3)

## Prioritized Implementation Roadmap

### Phase 0: Security & Repository Hygiene (P0)
1. **Repository Guard**:
   - Create root `.gitignore` to prevent any commits of `.env`, `node_modules`, `dist/`, logs, and temporary files.
   - Create `.env.example` with standard variable placeholders.
   - Remove hardcoded secrets from `docker-compose.yml`, using `.env` substitution with secure fallback defaults.
2. **Admin Bootstrap Isolation**:
   - Update `seed.ts` to read `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` from environment variables, avoiding static in-code passwords.
3. **Monetization & Fake Data Removal**:
   - Strip fake subscription checkout and simulated revenue figures. Present clean "Premium Features (Coming Soon)" interface.

---

### Phase 1: Architecture & Broken Functionality (P1)
1. **System Health Endpoint**:
   - Implement `HealthModule` in NestJS providing `/api/v1/health` with Database, Redis, and Memory status.
2. **Audit Logging Pipeline**:
   - Add `AuditLog` model to Prisma schema (`actorId`, `action`, `targetType`, `targetId`, `metadata`, `createdAt`).
   - Log all moderation decisions (deck approval/rejection) and user account status mutations.
3. **OAuth Architecture**:
   - Implement `OAuthService` abstraction in backend for Google and Facebook login with secure account linking on email match.
   - Add frontend Google / Facebook social login buttons with clean divider and email fallback.

---

### Phase 2: Design System & Liquid Glass (P2)
1. **Design Tokens & CSS System**:
   - Update `apps/web/src/index.css` with comprehensive CSS custom properties:
     - Surface tokens (`--surface-1`, `--surface-2`, `--surface-elevated`)
     - Glass tokens (`--glass-bg`, `--glass-border`, `--glass-border-hover`, `--glass-shine`)
     - Text contrast tokens (`--text-primary`, `--text-secondary`, `--text-muted`)
   - Add smooth 200–400ms glass-shine reflection animation on card hover.
2. **GlassCard System**:
   - Upgrade `GlassCard.tsx` to support variants:
     - `GlassCardInteractive`: with glass-shine sweep and border highlight
     - `GlassCardElevated`: deeper backdrop blur and soft shadow
     - `GlassCardSubtle`: translucent secondary background
     - `GlassCardPremium`: subtle brand gradient border
     - `GlassCardDanger`: rose-tinted frosted alert card
3. **Responsive Mobile Navigation**:
   - Implement mobile bottom navigation bar in `AppShell.tsx` for smartphones (<768px).

---

### Phase 3: AI Experience & Structured Output (P3)
1. **Structured AI Response**:
   - Backend returns structured JSON schema for vocabulary analysis:
     - `{ type: "vocabulary_explanation", word, cefr, partOfSpeech, definition, examples, collocations, synonyms }`
2. **AI Chat UI Overhaul**:
   - Render interactive `VocabularyExplanationCard` inside AI chat with `SpeechButton` for audio and 1-click "Add to Review".
   - Rich safe Markdown rendering for freeform chat.
   - Quick action suggestions (`Explain this`, `Quiz me`, `Give examples`, `Compare words`).
   - Conversation history drawer and subtle "AI is thinking..." typing indicator.

---

### Phase 4: Internationalization (i18n) Foundation (P4)
1. **Lightweight i18n Engine**:
   - Create `apps/web/src/i18n/` with English (`en`) and Vietnamese (`vi`) language packs, structured for easy expansion to Japanese, Korean, Chinese, Spanish, etc.
   - Provide `useTranslation()` hook with automatic fallback to English on missing keys.
   - Language selector dropdown with flag indicators and localStorage persistence.

---

### Phase 5: Admin Intelligence & Polish (P5 - P6)
1. **Admin Analytics Expansion**:
   - System health indicator card (API, PostgreSQL, Redis status).
   - Real learning engine metrics (average accuracy, reviews completed, words mastered) instead of fake revenue.
   - Moderation audit trail.
2. **Accessibility & Micro-interactions**:
   - Growth-mindset feedback messaging during reviews (*"Not quite — let's reinforce this"*).
   - Celebration banners on goal/streak achievements.
