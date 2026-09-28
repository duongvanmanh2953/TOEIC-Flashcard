# VocabFlow AI — Full System Audit Report (Phase 0)

> **Evaluation Principle**: "Good foundation, but several areas are not production-polished."  
> **Approach**: KEEP → REFACTOR → IMPROVE → REPLACE ONLY WHEN NECESSARY.

---

## 1. Executive Summary

VocabFlow AI has established a strong architectural baseline with a solid monorepo setup (NestJS + Prisma + PostgreSQL + Redis backend; Vite + React + TypeScript + TailwindCSS frontend; multi-container Docker Compose with Nginx reverse proxy). 

However, deep operational analysis reveals that several core subsystems require hardening, architectural refinement, and domain uncoupling to reach production-grade maturity:
1. **Domain Overlap**: Customer support conversations, user feedback, feature requests, and bug reports share adjacent workflows but lack distinct lifecycle states, operational queues, and administrative assignment.
2. **Notification Delivery vs. Operational Alerts**: Notifications currently function primarily as an end-user delivery mechanism (`Notification` model with user ID). Admin operations lack an operational alert center with severity classification (`INFO`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), real-time operational broadcasts, and distinct domain events.
3. **Form Controls & UI Inconsistency**: Native HTML `<select>` elements exist in several admin and support forms, clashing with the Liquid Glass design language and lacking keyboard navigation, searchability, and mobile sheet adaptations.
4. **i18n Fragmentation**: While an initial `I18nProvider` exists, translation files (`en.ts`, `vi.ts`) are partially populated with flat structures, leaving numerous hard-coded Vietnamese and English strings across admin, analytics, billing, and AI pages.
5. **Financial Intelligence**: The billing module (`/admin/billing`) contains high-level metrics, but lacks an independent financial reporting center (`/admin/finance`) providing real database-backed MRR, ARR, ARPU, renewal cohorts, failed payment workflows, accounting-ready CSV exports, and a strict zero-fake-data policy.
6. **Admin Control Plane**: Settings currently store basic key-value pairs in `SystemConfig` without sectioned UX, validation, rollback history, or audit logs for sensitive parameter shifts.

---

## 2. Comprehensive Layer-by-Layer Audit

### 2.1 Frontend & Routing
- **Current State**: React 18 SPA with React Router v6. Routes are segregated into Public (`/`, `/login`, `/register`), Protected User App (`AppShell` covering `/dashboard`, `/review`, `/vocabulary`, `/word-bank`, `/community`, `/custom-quiz`, `/placement-test`, `/ai-tutor`, `/progress`, `/upgrade`, `/feedback`, `/notifications`, `/settings`), and Protected Admin (`AdminLayout` covering `/admin/*`).
- **Issues Identified**:
  - `/admin/finance` is missing; financial operations were partially coupled into `/admin/billing`.
  - `/admin/conversations` vs `/admin/support`: Support routing uses `/admin/support`, whereas master operations specify `/admin/conversations` as canonical. Both should be seamlessly aliased.
  - Command Palette (`Ctrl+K`) exists in AdminLayout, but requires unified indexing across users, tickets, feedback, payments, words, and settings.
  - Headings hierarchy: Recently sanitized down to `<h2>` maximum to prevent header collision with system title bars.

### 2.2 Backend & Micro-Architecture
- **Current State**: Modular NestJS architecture with dedicated modules: `Auth`, `Admin`, `AI`, `Community`, `Dashboard`, `Feedback`, `Health`, `Notifications`, `PlacementTest`, `Quizzes`, `Reviews`, `Subscriptions`, `Support`, `Vocabulary`.
- **Issues Identified**:
  - Direct service invocation without formal Domain Event publishing: When a user creates feedback or a support ticket, the action does not dispatch a decoupled domain event (`FEEDBACK_CREATED`, `CONVERSATION_CREATED`). Admin inboxes must poll or rely on localized socket broadcasts.
  - Realtime gateway (`SupportGateway`) handles room joins and chat messaging, but is not yet wired to broadcast operational events (`PAYMENT_REVIEW_REQUIRED`, `BUG_REPORTED`, `SECURITY_ALERT`) to the administrative room (`admin_notifications_inbox`).

### 2.3 Database & Schema (`schema.prisma`)
- **Current State**: PostgreSQL schema with 26 models. `User`, `SupportConversation`, `SupportMessage`, `Feedback`, `FeedbackVote`, `PaymentOrder`, `Subscription`, `Plan`, `SystemConfig`, `AuditLog`.
- **Issues Identified**:
  - `Feedback` model contains `FeedbackType` enum (`FEATURE_REQUEST`, `BUG_REPORT`, `GENERAL`, etc.), but lacks structured metadata for Bug Reports (severity, environment, browser, attachments) and structured admin reply history.
  - `Notification` model is user-centric (`userId`, `type`, `title`, `body`). Operational administrative notifications require either target role routing or dedicated admin alert models with severity (`INFO` to `CRITICAL`), target deep links (`targetType`, `targetId`), and resolution status.
  - Settings (`SystemConfig`) is a simple key-value table lacking categories, validation schemas, and versioned audit history.
  - Payment records (`PaymentOrder`) have `status` and `webhookPayload`, but lack reconciliation status (`MATCHED`, `AMOUNT_MISMATCH`, etc.) and refund tracking.

### 2.4 Authentication & Permissions
- **Current State**: Dual-mode auth (Anonymous Guest first-class access + Firebase/Email JWT auth). Roles: `USER`, `PREMIUM_USER`, `MODERATOR`, `ADMIN`, `SUPER_ADMIN`.
- **Issues Identified**:
  - Role checking is coarse (`RolesGuard` checks enum match). Operational actions (e.g. `finance.read`, `finance.export`, `billing.refund`, `roles.manage`) should adhere to a granular Permission Matrix with Default Deny principles.
  - Sensitive operations (role changes, deck moderation) are logged to `AuditLog`, but settings updates, refund executions, and bulk feedback status mutations lack consistent audit logging.

### 2.5 Realtime Infrastructure
- **Current State**: Socket.IO gateway (`SupportGateway`) on `/` with cors support, rooms `conv_{id}`, `user_{id}`, and `admin_support_inbox`.
- **Issues Identified**:
  - Realtime badge counter synchronization: When a new ticket or feedback arrives, admin sidebar badges do not automatically update unless the user is on the specific page.
  - Admin toast dispatch: Realtime operational notifications should trigger high-priority sticky toasts for `CRITICAL` / `HIGH` severity and auto-dismissing toasts for `INFO` / `LOW`.

### 2.6 Form Controls & UI Consistency
- **Current State**: High-polish Liquid Glass aesthetic in CSS with specular flares, glass borders, and smooth shadows.
- **Issues Identified**:
  - Native `<select>` elements found in 5 key pages (`SupportCenterPage`, `AdminUsersPage`, `AdminSettingsPage`, `AdminNotificationsPage`, `AdminFeedbackPage`).
  - Native selects break visual immersion, lack search filtering, lack option icons, and render poorly on mobile touch devices.
  - Need a unified suite of custom form controls: `CustomSelect`, `MultiSelect`, `SearchableSelect`, `AsyncSelect`, `FilterSelect`, and `CustomDatePicker`.

### 2.7 Internationalization (i18n)
- **Current State**: Lightweight `I18nProvider` with locale switching (`en`, `vi`). English fallback works by traversing object paths.
- **Issues Identified**:
  - Dictionaries are stored in single files (`en.ts`, `vi.ts`), making maintenance difficult.
  - Hundreds of strings in admin pages, chart legends, toasts, validation errors, and modal dialogs are hard-coded in Vietnamese or English.
  - No automated translation validation script to catch missing or malformed keys during build time.

### 2.8 Financial Intelligence & Billing
- **Current State**: `AdminBillingPage` displays high-level cards (Total Revenue, Active Subscriptions, Conversion Rate, ARPU).
- **Issues Identified**:
  - Calculations need strict connection to database models (`PaymentOrder` with `status: PAID`, `Subscription`).
  - Missing `/admin/finance` reporting suite with daily/weekly/monthly trends, MRR/ARR breakdown, failed payment reports, accounting CSV export, and clear empty states when real transactions haven't occurred.
  - Strict zero-fake-data policy must be enforced: no randomized mock transactions; transparent empty states with setup guidance.

### 2.9 Admin Control Plane & Settings
- **Current State**: `AdminSettingsPage` contains tabs for General, Learning, AI Quotas, Features, System.
- **Issues Identified**:
  - Form UX saves the entire form at once rather than per-section (`Unsaved changes → [Save]`).
  - Missing dedicated sections for Branding, Localization, Notifications, Support, Billing, Security, Users & Roles, and Integrations.
  - Settings changes are not recorded in an audit trail with actor details and previous values.

---

## 3. Remediation Strategy Roadmap

The remediation will follow the strict 17-step implementation order outlined in Master Prompt V8:
1. **Audit Documentation**: Generate all 5 required audit reports in `docs/`.
2. **Domain Separation**: Segregate database and API boundaries for Conversations, Feedback, Bug Reports, and Payments.
3. **Custom UI Form Controls**: Build `CustomSelect`, `MultiSelect`, `SearchableSelect`, and replace all native `<select>` tags.
4. **i18n Architecture**: Modularize locale dictionaries by domain, complete Vietnamese/English parity, and introduce `scripts/check-translations.js`.
5. **Admin Operations & Notification Center**: Implement `/admin/notifications`, severity prioritization, and operational event pipeline.
6. **Financial Reporting**: Implement `/admin/finance`, MRR/ARR drill-downs, transaction logs, and accounting CSV export.
7. **Admin Settings Control Plane**: Modularize `/admin/settings` into 13 searchable sections with per-section persistence and audit logging.
8. **Permissions, Security & Responsive QA**: Implement granular permission matrix, ensure WCAG compliance, and test all breakpoints.
