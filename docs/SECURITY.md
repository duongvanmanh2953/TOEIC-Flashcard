# VocabFlow AI — Security, RBAC & Secret Hygiene

## 1. Role-Based Access Control (RBAC)
- Supported Roles: `USER`, `PREMIUM_USER`, `ADMIN`, `SUPER_ADMIN`.
- Endpoints under `/admin/*` require `JwtAuthGuard` and `RolesGuard` matching `ADMIN` or `SUPER_ADMIN`.
- Regular learners attempting administrative routes receive HTTP 403 Forbidden.

## 2. Secrets & Token Isolation
- JWT secrets, database connection strings, and payment credentials are kept strictly within server environment variables.
- Sensitive credentials, passwords, refresh tokens, and payment card details are never exposed in logs or API response DTOs.
