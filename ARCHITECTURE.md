# Architecture Specification — VocabFlow AI

## 1. Architectural Overview

VocabFlow AI uses a modern Clean Monorepo Architecture separating backend API services, data persistence, and front-end user experience.

```
                  ┌───────────────────────────────┐
                  │    Web Client (React / Vite)   │
                  │   TailwindCSS + TanStack Query │
                  └──────────────┬────────────────┘
                                 │ REST API (/api/v1)
                                 ▼
                  ┌───────────────────────────────┐
                  │      NestJS API Gateway       │
                  │    Guards, Interceptors, DTOs │
                  └──────┬───────────────┬────────┘
                         │               │
            ┌────────────┴───┐       ┌───┴──────────┐
            │ Business Logic │       │  AI Engine   │
            │  - Auth & RBAC │       │  Prompt Svc  │
            │  - Adaptive SRS│       │  Token Budget│
            │  - Vocab & Topic       └──────────────┘
            └────────────┬───┘
                         │ Prisma ORM
                         ▼
               ┌───────────────────┐
               │ PostgreSQL 16 DB  │
               └───────────────────┘
```

## 2. Monorepo Organization

- `apps/api`: NestJS backend application.
  - `src/common`: Global interceptors (`TransformResponseInterceptor`), filters (`AllExceptionsFilter`), guards (`JwtAuthGuard`, `RolesGuard`), decorators (`@CurrentUser`, `@Roles`, `@Public`).
  - `src/prisma`: Database connection lifecycle and schema.
  - `src/modules`: Domain feature modules (`auth`, `vocabulary`, `reviews`, `dashboard`, `placement-test`, `ai`).
- `apps/web`: React 18 TypeScript single-page application.
  - `src/contexts`: Authentication, user state, theme management.
  - `src/components`: UI components, responsive layout shell.
  - `src/pages`: Landing page, authentication, dashboard, review room, vocabulary explorer, placement test, AI tutor, analytics, settings.
- `prisma`: Database schema and CSV data seeding scripts.
