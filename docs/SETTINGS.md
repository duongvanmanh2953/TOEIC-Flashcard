# LetStuN AI — System Settings & Configuration Plane

## 1. 13-Section Configuration Model
1. `general`: Site name, tagline, official support email, maintenance mode, user registration.
2. `branding`: Brand logo URL, accent color palette, default dark mode.
3. `localization`: Default language, timezone, date formatting.
4. `learning`: SRS algorithm (FSRS v4.5 vs. SM-2), daily study goals, audio pronunciation.
5. `ai`: Default LLM (GPT-4o, Claude 3.5 Sonnet, DeepSeek), temperature, daily free quota.
6. `notifications`: In-app chimes, weekly email digest, quiet hours.
7. `support`: CSKH live chat gateway, auto-assignment, SLA response targets, offline auto-reply.
8. `feedback`: Feature requests, bug reporting, community voting roadmap.
9. `billing`: Currency standard, VAT tax percent, free trial days, grace period.
10. `security`: Session lifetime hours, login rate limiting, 2FA requirements.
11. `users_roles`: Default registration role, community deck moderation permissions.
12. `feature_flags`: Live feature toggles without redeploying code.
13. `system`: Redis cache TTL, message retention threshold, database maintenance actions.

## 2. Persistence & Audit Logging
- Managed via `SystemConfig` table in PostgreSQL.
- Every section modification creates an `AuditLog` entry tracking the admin actor and payload.
