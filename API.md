# API Specification — LetStuN AI

Base URL: `/api/v1`

All responses follow the unified response structure:
```json
{
  "success": true,
  "data": { ... },
  "meta": { "timestamp": "2026-09-05T08:00:00.000Z" }
}
```

---

## 1. Authentication (`/auth`)

### POST `/auth/register`
- **Body**: `{ email, password, displayName }`
- **Returns**: Created user profile, `accessToken`, `refreshToken`.

### POST `/auth/login`
- **Body**: `{ email, password }`
- **Returns**: User object, `accessToken`, `refreshToken`.

### POST `/auth/refresh`
- **Body**: `{ refreshToken }`
- **Returns**: New `accessToken` and rotated `refreshToken`.

### POST `/auth/logout` (Bearer Auth)
- Revokes user's active refresh token.

### GET `/auth/me` (Bearer Auth)
- Returns current logged-in user profile, streak, and XP.

---

## 2. Smart Review Engine (`/reviews`)

### POST `/reviews/smart-session` (Bearer Auth)
- **Body**: `{ type?: "SMART_REVIEW", limit?: 10 }`
- **Returns**: Study session with adaptive mix of Due, Weak, New, and Reinforcement exercises.

### POST `/reviews/:sessionId/answer` (Bearer Auth)
- **Body**: `{ vocabularyId, answer, responseTimeMs, confidence, hintUsed? }`
- **Returns**: Immediate correctness feedback, updated mastery score, new `nextReviewAt`, and XP gained.

### POST `/reviews/:sessionId/complete` (Bearer Auth)
- **Returns**: Session accuracy, questions reviewed, and total XP.

---

## 3. Vocabulary (`/vocabulary`)

### GET `/vocabulary`
- **Query**: `page`, `limit`, `search`, `cefrLevel` (A1-C2), `topic`, `partOfSpeech`.
- **Returns**: Paginated vocabulary items with meanings, examples, audio URLs, and user progress.

### GET `/vocabulary/topics`
- **Returns**: List of all topics with item count.

### GET `/vocabulary/:id`
- **Returns**: Comprehensive vocabulary record including collocations, word relations, and examples.

### POST `/vocabulary/:id/favorite` (Bearer Auth)
- Toggles favorite bookmark.

---

## 4. Placement Test (`/placement-test`)

### GET `/placement-test/questions`
- Returns 10 diagnostic questions across CEFR levels.

### POST `/placement-test/submit` (Bearer Auth)
- **Body**: `{ answers: [...] }`
- **Returns**: Evaluated CEFR level, estimated vocabulary size, strengths, weaknesses, and tailored daily goal.

---

## 5. AI Assistant (`/ai`)

### POST `/ai/explain` (Bearer Auth)
- **Body**: `{ word }`
- **Returns**: In-depth educational explanation adapted to user's CEFR level.

### POST `/ai/generate-sentences` (Bearer Auth)
- **Body**: `{ word }`
- **Returns**: 4 graded sentences for A2, B1, B2, C1 with grammar pattern.

### POST `/ai/tutor` (Bearer Auth)
- **Body**: `{ message, contextWord? }`
- **Returns**: Interactive tutoring response following Teach $\rightarrow$ Context $\rightarrow$ Check.
