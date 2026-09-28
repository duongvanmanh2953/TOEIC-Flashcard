# VocabFlow AI — Feedback & Public Roadmap Architecture

## 1. Domain Separation
Feedback and Bug Reports represent asynchronous user-driven suggestions, distinct from real-time customer support conversations (`/admin/conversations`).

## 2. API Contract & Endpoints
- `GET /api/v1/admin/feedback`: Admin paginated feedback list with filters (`status`, `type`, `priority`, `search`, `page`, `limit`).
- `PATCH /api/v1/admin/feedback/:id/status`: Transition workflow status (`NEW`, `ACKNOWLEDGED`, `UNDER_REVIEW`, `PLANNED`, `IN_PROGRESS`, `RESOLVED`, `DECLINED`) and record internal admin notes.
- `POST /api/v1/admin/feedback/:id/reply`: Post public reply visible to learner. Automatically triggers an in-app learner notification (`FEEDBACK_REPLY`).

## 3. Realtime Events
- When learner submits feedback:
  - Dispatches `NEW_FEEDBACK` or `NEW_BUG_REPORT` operational event via `SupportGateway.broadcastAdminEvent`.
  - Increments admin sidebar unread badge.
  - Live toast rendered across active admin sessions.
  - Admin Feedback list updates without manual page reload.
