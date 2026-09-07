# LexiMind AI — Admin Operations & Architecture (Master Prompt V10)

## 1. Executive Summary
The LexiMind AI Admin Center is the operating system and command center of the platform. It provides strict domain separation, real-time telemetry, vocabulary lifecycle management, learner community moderation, pricing intelligence, financial accounting, and platform security.

## 2. Admin Router & Navigation Policy
- **Root Admin Route**: `/admin` is the direct Admin Dashboard / Overview.
- **Route Redirection**: `/admin/dashboard` automatically redirects to `/admin`.
- **403 Forbidden Access**: Authenticated regular users attempting to navigate to `/admin` are greeted with a dedicated HTTP 403 Forbidden screen (`NotAuthorizedPage`) with a button back to `/dashboard`.
- **User → Admin Navigation**: Admin and SuperAdmin users have clear entry points:
  - Topbar: `🛠 Admin Center` badge
  - Sidebar: `Quản Trị / Administration` item `🛠 Admin Center`
  - Profile Menu: `Mở 🛠 Admin Center` action
  - Mobile Menu: `🛠 Admin Center` link
  *(Completely hidden for regular users)*

## 3. Sidebar Organization (6 Categorized Domains)
```text
OVERVIEW
  Dashboard (/admin)

ANALYTICS
  Users (/admin/users)
  Learning (/admin/learning)
  AI Analytics (/admin/ai)

CONTENT
  Vocabulary Master Bank (/admin/vocabulary)
  Learner Shared Vault (/admin/shared-vocabulary)

OPERATIONS
  Support Conversations (/admin/conversations)
  Feedback & Ideas (/admin/feedback)
  Notifications & Broadcasts (/admin/notifications)

BUSINESS
  Finance & Revenue (/admin/finance)
  Billing & Orders (/admin/billing)
  Smart Pricing Engine (/admin/pricing)

SYSTEM
  System Health (/admin/system)
  Security & Roles (/admin/security)
  Settings Control Plane (/admin/settings)
```

## 4. Topbar & Live Operational Status
- **Live Status Indicator**: "● All systems operational" clicking through to `/admin/system`.
- **Global Search**: `Ctrl + K` indexing all 15 administrative modules.
- **Realtime Unread Counters**: Live badges synced across Support, Feedback, Notifications, and Payments.

## 5. UI & Internationalization Standards
- **Zero Native `<select>`**: 100% custom Liquid Glass controls (`CustomSelect`, `FilterSelect`).
- **Zero Fake Data**: Accounting-grade database aggregates from PostgreSQL without placeholder data.
- **100% Bilingual Parity**: Verified with `scripts/check-translations.js`.
