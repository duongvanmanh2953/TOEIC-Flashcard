# VocabFlow AI — Real-time Support Architecture

## 1. Domain Separation
- **Learner Experience**: Embedded support launcher & live floating chat modal (`SupportFloatingModal.tsx`). Learner does not have or need an administrative support workspace.
- **Admin Command Center**: Dedicated route `/admin/conversations` (aliasing `/admin/support`) featuring virtual scroll message history, ticket status lifecycle (`OPEN`, `WAITING`, `RESOLVED`, `CLOSED`), internal agent notes, and live audio chimes.

## 2. Retention Policy
- Content of messages older than 3 days can be purged via `POST /api/v1/support/admin/cleanup-old-messages` to maintain lean database storage.
- Support tickets (conversation metadata, timestamps, learner context) are permanently retained for auditing and SLAs.

## 3. Realtime Gateway
- `SupportGateway` powered by Socket.io on port `:4000`.
- Broadcasts operational events to admins via `admin_event:new` and `admin_badge_update`.
