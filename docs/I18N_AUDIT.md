# LetStuN AI — Internationalization (i18n) Audit (Phase 0)

> **Mandatory Rule**: All UI text must stem from the internationalization engine (`t("...")`).  
> Zero hardcoded English or Vietnamese in UI components, tables, buttons, toasts, tooltips, or empty states.  
> Zero mixed languages on a single locale.

---

## 1. Current State Assessment

### 1.1 Existing Setup
- Location: `apps/web/src/i18n/index.tsx`
- Provider: `I18nProvider` storing locale in `localStorage` (`letstun_locale`).
- Files: Monolithic dictionary files: `apps/web/src/i18n/locales/en.ts` and `vi.ts`.
- Fallback logic: Current locale → English dictionary fallback → key string.

### 1.2 Identified Gaps & Deficiencies
1. **Monolithic Dictionary Bloat**: Keeping all translations in single `en.ts` and `vi.ts` files makes parallel development difficult and increases merge conflict risk.
2. **Hard-coded Vietnamese & English**:
   - `AdminOverviewPage.tsx`: KPI labels ("Học viên hoạt động", "Hội thoại mở", "Doanh thu tháng"), table headers, and activity logs are partially hard-coded in Vietnamese.
   - `AdminSupportPage.tsx`: Internal note indicators ("Ghi chú nội bộ"), ticket priority pills ("Cao", "Khẩn cấp", "Thường"), filter pills ("Tất cả", "Chờ nhận", "Đã trả lời", "Đã xong") contain raw strings.
   - `AdminFeedbackPage.tsx`: Type tags ("Tính năng mới", "Báo lỗi", "Sửa nội dung") and status options are hardcoded.
   - `AdminSettingsPage.tsx`: Form labels, placeholders, and action buttons lack translation keys.
   - `AdminBillingPage.tsx`: Pricing plan names, metric descriptions, and financial table headers contain raw strings.
   - Toasts & Alert dialogs: `alert('...')` or raw string notifications are scattered in event handlers.
3. **No Automated Translation Validation**: No build-time or CI verification exists to detect missing keys between `en` and `vi`, resulting in silent fallback to English or raw key identifiers.

---

## 2. Target Translation Architecture

### 2.1 Domain-Based Namespace Structure
Translations will be split into domain-specific modules under `apps/web/src/i18n/locales/`:

```text
apps/web/src/i18n/locales/
  en/
    common.ts        // Navigation, buttons, pagination, confirmations, generic status
    auth.ts          // Login, register, forgot password, guest mode, OAuth
    learning.ts      // Study sessions, quizzes, placement test, streaks, XP
    vocabulary.ts    // Word explorer, word bank, CEFR levels, mastery badges
    review.ts        // FSRS / SRS review engine, cards, intervals, grades
    ai.ts            // AI tutor, grammar explanation, story generator, quotas
    support.ts       // CSKH tickets, realtime chat, internal notes, SLA
    feedback.ts      // Feedback portal, feature requests, bug reports, roadmap
    notifications.ts // User notifications, admin operational alerts, announcement templates
    admin.ts         // Admin dashboard, KPI metrics, tables, user management, audit logs
    finance.ts       // Financial intelligence, MRR/ARR, payment orders, refunds
    settings.ts      // Admin control plane, general/branding/learning/AI/security settings
  vi/
    [identical file hierarchy for Vietnamese parity]
```

### 2.2 Domain Key Naming Convention
Every key must follow hierarchical, dot-separated taxonomy:
- `admin.overview.kpi.totalUsers`
- `admin.support.filter.all`
- `admin.support.priority.urgent`
- `admin.feedback.status.planned`
- `admin.finance.metrics.mrr`
- `support.chat.placeholder`
- `common.actions.save`
- `common.status.success`

### 2.3 User-Generated Content vs. UI Translation Rule
- **UI Chrome & System Copy**: Fully translated via `t(...)`.
- **User-Generated Content**: Ticket subjects, messages, and feedback descriptions represent raw user input and are **never** mutated or translated automatically unless explicitly requested via an AI translation toggle.
- **Support Language Tracking**: Every support conversation persists `userLocale` so support staff immediately know the customer's interface language.

---

## 3. Automated Translation Verification Script

Create `scripts/check-translations.js` to run in pre-commit and CI:
- Recursively loads both `en` and `vi` dictionary trees.
- Detects missing keys in either language.
- Detects extraneous/orphan keys not present in both.
- Detects malformed interpolated variables (e.g. `{count}` present in EN but missing in VI).
- Emits clean formatted summary and exits with code 1 on mismatch.
