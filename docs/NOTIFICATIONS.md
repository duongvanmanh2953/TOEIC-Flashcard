# LetStuN AI — Notifications & Operational Alert Center

## 1. Separation of Notification Planes
- **Learner In-App Notifications**: Study reminders, streak alerts, feedback replies, and system announcements.
- **Admin Operational Alerts**: Critical exceptions, SLA breaches, new bug submissions, payment failures, and security events.

## 2. Severity Hierarchy
- `CRITICAL`: Immediate platform outages, payment gateway failures.
- `HIGH`: Unhandled exceptions, SLA breaches, bug submissions.
- `MEDIUM`: New learner feedback, incoming customer support tickets.
- `LOW` / `INFO`: Informational logs, periodic digests.

## 3. Operational Features
- Alert categorization tabs (`ALL`, `UNREAD`, `CRITICAL`, `SUPPORT`, `FEEDBACK`, `BILLING`, `AI`, `SECURITY`, `SYSTEM`, `BROADCAST`).
- Broadcast Studio: Target announcements to `ALL`, `FREE`, `PREMIUM`, or `INACTIVE_7D` users.
- Batch clear all alerts with modal confirmation via `DELETE /api/v1/notifications/admin/all`.
