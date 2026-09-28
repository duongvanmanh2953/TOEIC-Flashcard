# VocabFlow AI — Product & Learning Analytics Architecture

## 1. Overview
The Analytics Engine processes learner interaction events and vocabulary retention state directly from PostgreSQL, supporting real-time operational decision making without fabricated metrics.

## 2. Telemetry Endpoints
- `/api/v1/admin/analytics/users` (`getUserAnalytics`): User growth, registration cohorts, activation funnels (Visitors -> Practice -> Account -> First Review -> Premium).
- `/api/v1/admin/vocab-health` (`getVocabularyAnalytics`): Repository total vocabulary, CEFR level calibration (A1 to C2), top failed words across SRS reviews.
- `/api/v1/admin/learning-stats` (`getLearningAnalytics`): Study session volume, review counts, exercise type breakdown (Multiple Choice, Type The Word, Fill In Blank, Listening, Contextual Choice), active vs. passive memory recognition rates.
- `/api/v1/admin/ai-stats` (`getAIAnalytics`): AI query counts, token consumption sums, latency averages, feature breakdown (AI Tutor, Context Explanation, AI Story, Text-to-Vocab Quiz).

## 3. Server-Side Aggregation
All analytics are computed on the server via Prisma aggregations (`count`, `groupBy`, `aggregate._sum`), avoiding expensive client-side raw data transfers.
