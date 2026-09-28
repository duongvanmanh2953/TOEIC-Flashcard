# VocabFlow AI — Domain Boundary Map (Phase 0)

> **Mandatory Rule**: Do NOT conflate or merge distinct operational concepts.  
> Each domain possesses distinct business logic, data models, routes, lifecycle stages, and permission gates.

---

## 1. Domain Separation Matrix

| Domain | Canonical Route | Core Entity | Primary Actor | Key Purpose | Realtime Event |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Support Conversation** | `/admin/conversations` (alias `/admin/support`) | `SupportConversation`, `SupportMessage` | User ↔ Agent/Admin | Direct 2-way real-time messaging for user troubleshooting & assistance | `CONVERSATION_CREATED`, `SUPPORT_MESSAGE_CREATED` |
| **User Feedback** | `/admin/feedback` | `Feedback`, `FeedbackVote` | User → Product Team | Community ideas, usability opinions, general suggestions | `FEEDBACK_CREATED`, `FEEDBACK_STATUS_CHANGED` |
| **Feature Request** | `/admin/feedback?type=FEATURE_REQUEST` | `Feedback (type: FEATURE_REQUEST)` | User → Roadmap | Concrete feature suggestions eligible for public voting & roadmap | `FEATURE_REQUEST_SUBMITTED` |
| **Bug Report** | `/admin/feedback?type=BUG_REPORT` | `Feedback` + Bug Details (severity, env, browser) | User → QA/Dev | Structured defect reports requiring technical reproduction & resolution | `BUG_REPORTED` |
| **Payment Issue** | `/admin/finance` & `/admin/conversations?tag=BILLING` | `PaymentOrder`, `Subscription` | User → Billing Support | Failed payments, bank transfer mismatches, entitlement delays | `PAYMENT_REVIEW_REQUIRED`, `PAYMENT_FAILED` |
| **Notification** | `/admin/notifications` (Admin) & `/notifications` (User) | `Notification` | System → User / Admin | Transient or persistent operational alerts & status broadcasts (delivery mechanism only) | `NOTIFICATION_DISPATCHED` |
| **Announcement** | `/admin/notifications?tab=announcements` | `AdminAnnouncement` | Admin → All/Segmented Users | Broadcast news, maintenance alerts, platform releases | `ANNOUNCEMENT_BROADCASTED` |

---

## 2. Detailed Domain Specifications

### 2.1 Domain: Support Conversation
- **Definition**: Direct, real-time customer support dialogue between a specific user and administrative staff.
- **Route**:
  - User: CSKH modal popup in `AppShell` or `/support` (redirects to active modal)
  - Admin: `/admin/conversations` (and `/admin/support`)
- **Key Fields**:
  - `ticketId` (e.g. `SUP-20260907-89123`)
  - `userId`, `userLocale`
  - `status`: `OPEN` | `WAITING` | `RESOLVED` | `CLOSED`
  - `priority`: `LOW` | `NORMAL` | `HIGH` | `URGENT`
  - `tags`: `BILLING` | `TECHNICAL` | `VOCABULARY` | `GENERAL`
  - `assignedAdminId`
  - `lastMessageAt`
- **Messages**:
  - `isInternalNote` (boolean): internal staff-only notes hidden from users.
  - `readAt`: read receipt timestamp.
- **Lifecycle Flow**:
  ```text
  User opens chat / sends message
    ↓ [Socket / REST]
  SupportConversation created (Status: OPEN)
    ↓
  Domain Event: CONVERSATION_CREATED / SUPPORT_MESSAGE_CREATED
    ↓
  Admin notified in real-time (Badge counter + Sound/Toast)
    ↓
  Admin replies (Status: WAITING) or writes Internal Note
    ↓
  User receives real-time reply + read receipt
    ↓
  Issue resolved (Status: RESOLVED)
  ```

---

### 2.2 Domain: User Feedback & Feature Requests
- **Definition**: One-way or asynchronous user suggestions, UX critiques, and general product feedback.
- **Route**:
  - User: `/feedback` (submit feedback, vote on public roadmap)
  - Admin: `/admin/feedback`
- **Distinction from Support**: Feedback is NOT a live chat thread. It does not possess real-time chat messages. It has an admin review status, official admin reply, and community upvoting.
- **Lifecycle Flow**:
  ```text
  User submits feedback / feature idea
    ↓
  Feedback record created (Status: NEW)
    ↓
  Domain Event: FEEDBACK_CREATED
    ↓
  Admin Notification Center alerts team (Badge: +1 Feedback)
    ↓
  Admin reviews → Status changed (UNDER_REVIEW / PLANNED / IN_PROGRESS / RESOLVED / DECLINED)
    ↓
  Admin enters official reply
    ↓
  User receives notification: "Your feedback status was updated to [Planned]"
  ```

---

### 2.3 Domain: Bug Report
- **Definition**: Technical issue reports containing environmental context for engineering triage.
- **Data Attributes**:
  - `title`, `description`
  - `severity`: `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`
  - `environment`: OS, Browser, App Version, Screen Resolution
  - `attachments`: Screenshots, logs, error stack traces
  - `status`: `NEW` | `CONFIRMED` | `IN_FIX` | `RESOLVED` | `CANNOT_REPRODUCE`
- **Rule**: Never bury high-severity bug reports in general feedback. High/Critical bugs must dispatch a `HIGH` priority operational alert to the Admin Alert Center.

---

### 2.4 Domain: Payment & Billing Issues
- **Definition**: Discrepancies in subscription activation, bank transfer / VietQR validation delays, card failures, or refund requests.
- **Route**:
  - User: Initiated via Billing page or Support modal with tag `BILLING`
  - Admin: Managed in `/admin/finance` and `/admin/conversations?tag=BILLING`
- **Rule**: Never route payment disputes to Feature Requests or general feedback. Payments tie directly to `PaymentOrder`, `Subscription`, and provider transaction references.

---

### 2.5 Domain: Notification (Operational vs. User)
- **Definition**: Notifications are a **delivery channel**, never a domain database replacement for Conversations or Feedback.
- **Two Completely Segregated Channels**:
  1. **User Notification Center (`/notifications`)**:
     - Audience: End users
     - Types: `SUPPORT_REPLY`, `FEEDBACK_REPLY`, `ACHIEVEMENT_UNLOCKED`, `REVIEW_DUE`, `STREAK_WARNING`, `ANNOUNCEMENT`.
     - Template-based: Rendered dynamically based on current user locale (`t('notifications.feedbackReply')`).
  2. **Admin Operational Alert Center (`/admin/notifications`)**:
     - Audience: System Administrators and Moderators
     - Types: `NEW_SUPPORT_MESSAGE`, `NEW_CONVERSATION`, `NEW_FEEDBACK`, `NEW_FEATURE_REQUEST`, `NEW_BUG_REPORT`, `PAYMENT_REVIEW_REQUIRED`, `PAYMENT_FAILED`, `SUBSCRIPTION_CHANGED`, `AI_PROVIDER_ERROR`, `SYSTEM_ERROR`, `SECURITY_ALERT`, `HIGH_PRIORITY_SUPPORT`, `SLA_BREACH`.
     - Severity: `INFO`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
     - Direct Actionable Deep Links: Clicking notification navigates straight to the relevant ticket, feedback, payment order, or AI error log.
