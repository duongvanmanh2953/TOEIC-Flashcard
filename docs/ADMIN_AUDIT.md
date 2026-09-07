# LexiMind AI — Admin Operations & Architecture Audit (Phase 0)

> **Core Standard**: The Admin Dashboard must feel like a high-velocity **Product Operations Center**, not a generic CRUD admin portal.

---

## 1. Executive Operations Assessment

The administrative interface (`/admin/*`) currently consists of 12 pages in `apps/web/src/pages/admin`. While functionally capable of displaying metrics and managing users, tickets, and vocabulary, several operational pillars require modernization:

1. **Information Hierarchy**: The overview page currently renders multiple cards in flat grid arrangements without visual prioritization. It must be organized into a purposeful visual flow:
   ```text
   Needs Attention (Critical Alerts)
     ↓
   Executive KPIs (Users, Revenue, Retention)
     ↓
   User Growth & Conversion Funnel
     ↓
   Learning & Vocabulary Mastery Health
     ↓
   Support & Feedback Workflows
     ↓
   AI & System Operational Vitals
   ```
2. **Operational Notification Center**: Missing dedicated `/admin/notifications` operational center. Administrators currently have no unified view of system anomalies, high-priority support breaches, or pending payment reviews.
3. **Sidebar Realtime Badges**: The sidebar shows navigation links but lacks dynamic, real-time unread badges (e.g. Conversations: 3, Feedback: 7, Bug Reports: 2, Payments: 1, Notifications: 5).
4. **Form Controls**: Native HTML `<select>` elements appear in several admin filters, detracting from the sleek Liquid Glass theme and causing inconsistent rendering across browsers.

---

## 2. Target Component & Workflow Specifications

### 2.1 Top "Needs Attention" Operational Banner
Positioned at the very top of `/admin` and `/admin/overview`:
- Highlights high-priority items requiring immediate administrative intervention:
  - 🔴 Urgent support conversations waiting > 15m
  - 🟠 Unreviewed bug reports or critical feedback
  - 🟡 Pending payment verification orders
  - 🔵 AI provider fallback or elevated error rates
- Clicking any badge instantly navigates to the pre-filtered queue.

### 2.2 Reusable Admin Table System
All tabular pages (`/admin/users`, `/admin/conversations`, `/admin/feedback`, `/admin/notifications`, `/admin/finance`) will utilize a standardized table system:
- **`DataTable`**: Fixed header, horizontal scrolling for overflow, striped liquid glass rows, loading skeletons, empty state illustrations.
- **`FilterBar`**: Pure custom UI controls (no native select). Quick date ranges (Today, 7d, 30d, Custom), status chips, priority dropdowns.
- **`BulkActionsBar`**: Floating pill appearing when items are checked, providing contextual actions (e.g. `Assign`, `Change Status`, `Archive`, `Delete`) with confirmation dialogs.
- **Column Picker & Export**: Ability to toggle visible columns and export filtered datasets to CSV.

### 2.3 Dedicated Admin Notification Center (`/admin/notifications`)
- **Tabs**:
  - `All`
  - `Unread`
  - `Critical`
  - `Support`
  - `Feedback`
  - `Billing`
  - `AI`
  - `Security`
  - `System`
- **Item Design**:
  - Distinct severity badge (`INFO`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
  - Domain icon (Headphones for support, Lightbulb for feedback, Bug for errors, CreditCard for payments)
  - Relative timestamp ("2 minutes ago")
  - Action button: `[Open]` deep-links directly to target item.
  - Actions: `Mark Read`, `Mark Unread`, `Delete`, `Mark All as Read`, `Clear Resolved`.

### 2.4 Expanded Admin Settings Control Plane (`/admin/settings`)
Restructure settings from a cluttered single page into 13 organized, searchable sections:
1. **General**: Site name, meta description, timezone, default currency, support email.
2. **Branding**: Logo, favicon, brand accent gradient, theme defaults.
3. **Localization**: Enabled languages, default locale, fallback cascade.
4. **Learning Engine**: Daily word quotas, review intervals, XP multipliers, streak rules.
5. **AI Services**: Provider keys (status only, secrets in ENV), default model, daily tier quotas.
6. **Support & SLA**: Ticket categories, default priority, auto-assignment rules, offline message.
7. **Feedback & Roadmap**: Public roadmap visibility, voting toggles, anonymous feedback rules.
8. **Notifications**: Push & email gateway toggles, quiet hours, delivery rate limits.
9. **Billing & Plans**: Currency format, tax rates, tier features, grace periods.
10. **Security & Sessions**: Session duration, login rate limits, admin 2FA enforcement.
11. **Users & Permissions**: Role matrix, staff assignments, default deny rules.
12. **Feature Flags**: Dynamic runtime feature rollout toggles (percentage rollouts).
13. **System Health**: Maintenance mode toggle, cache flush, API rate limits.

**Settings UX**:
- Sticky search bar: "Search settings..." with keyword filtering across all sections.
- Per-section unsaved changes banner with individual section `[Save Changes]` button.
- Comprehensive audit log entry created on every critical setting update.
