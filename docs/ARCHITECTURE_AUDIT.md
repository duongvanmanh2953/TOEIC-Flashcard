# Architecture Audit Report — LetStuN AI (V3)

## 1. System Overview
The application consists of a monorepo containing:
- **Backend (`apps/api`)**: NestJS 10, Prisma ORM 5, PostgreSQL 16, Redis 7, JWT, class-validator.
- **Frontend (`apps/web`)**: React 18, Vite 5, TypeScript 5, TailwindCSS 3, Lucide icons, Axios.
- **Infrastructure**: Docker Compose multi-container setup with reverse proxy Nginx.

---

## 2. Architectural Findings

### 2.1 Backend Modules
- **Health & Diagnostics**: Missing dedicated `HealthModule` (e.g. using Terminus or direct DB/Redis ping), leading to 404 on `/api/v1/health`.
- **OAuth Extensibility**: `AuthModule` only implemented local email/password authentication. Needs structured `OAuthProvider` interface supporting Google & Facebook token exchange.
- **Audit Log Pipeline**: Administrative mutations (`AdminService`) lacked structured auditing in the database.
- **AI Task Orchestration**: Multi-tier pipeline in `ai.service.ts` works well, but responses should produce structured JSON schemas for frontend rendering cards rather than plain text.
- **Monetization & Plans**: `SubscriptionsModule` contained active checkout simulation. This should be decoupled into a future-proof entitlement provider without fake transactions.

### 2.2 Frontend Architecture
- **Internationalization (i18n)**: Missing translation architecture; strings were embedded directly in TSX files.
- **Design Tokens**: Missing unified design token layer in CSS (`--surface-1`, `--surface-2`, `--border-glass`, `--glass-shine`).
- **Responsive Layout**: AppShell had basic mobile dropdown menu, but needs standard mobile bottom navigation for thumb-reachability on mobile devices (320px–430px).
- **AI Message Composition**: AI chat did not parse rich structured JSON or render interactive word cards.

---

## 3. Recommended Architectural Enhancements
1. Add `HealthModule` with database, redis, and memory health indicators.
2. Add `AuditLog` entity in Prisma and audit interceptor for Admin operations.
3. Build lightweight, zero-overhead `i18n` engine (`i18n.ts`, `useTranslation` hook) with Vietnamese and English dictionaries.
4. Add OAuth service abstractions (`OAuthModule`) with account linking safety.
5. Upgrade `GlassCard` and `index.css` to full Liquid Glass Design Tokens with glass-shine micro-interactions.
