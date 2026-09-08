# LexiMind AI — Financial Intelligence & Billing Audit (Phase 0)

> **Mandatory Rule**: The Financial Dashboard must represent a legitimate **Financial Reporting System**.  
> Never fabricate mock transactions or simulate artificial MRR.  
> If no real payments exist, render transparent, accounting-grade empty states with configuration guidance.

---

## 1. Current State Assessment

### 1.1 Existing Database Entities
In `schema.prisma`:
- `Plan`: Defines tier (`FREE`, `PLUS`, `PRO`), price (`priceMonthly`), daily AI quotas, and JSON features.
- `PaymentOrder`: Represents discrete checkout transactions with `orderCode` (Int unique), `amount`, `status` (`PENDING`, `PAID`, `FAILED`, `CANCELED`, `EXPIRED`), `paymentMethod` (`VIETQR`, `PAYOS`, `WEBHOOK`), `paidAt`, `expiresAt`.
- `Subscription`: Represents recurring user entitlements with `status` (`ACTIVE`, `CANCELED`, `EXPIRED`), `currentPeriodEnd`.

### 1.2 Existing Gaps
1. **No Dedicated Financial Intelligence Center**: Financial data is currently embedded inside `AdminBillingPage.tsx` with high-level summaries, lacking deep accounting-grade visibility.
2. **Missing Canonical Route `/admin/finance`**: Master specifications require `/admin/finance` as a standalone reporting suite separate from general billing plan configuration.
3. **No Reconciliation Workflow**: Missing verification comparison between internal `PaymentOrder` records and external provider webhook payloads (`MATCHED`, `AMOUNT_MISMATCH`, `STATUS_MISMATCH`).
4. **No Accounting CSV Export**: Administrators and finance staff cannot export filtered transaction ledgers formatted for tax and book-keeping purposes.

---

## 2. Financial Formulas & Calculations

All financial metrics MUST be calculated strictly from database truth (`PaymentOrder` and `Subscription`):

### 2.1 Gross & Net Revenue
- **Gross Revenue**:
  $$\text{Gross Revenue} = \sum \text{PaymentOrder.amount} \quad \text{where } \text{status} = \text{PAID}$$
- **Net Revenue**:
  $$\text{Net Revenue} = \text{Gross Revenue} - \text{Refunds} - \text{Provider Transaction Fees}$$

### 2.2 Monthly Recurring Revenue (MRR)
- Sum of the normalized monthly plan prices for all active paid subscriptions:
  $$\text{MRR} = \sum_{\text{sub} \in \text{ActivePaid}} \text{sub.plan.priceMonthly}$$
- Subscriptions on `FREE` tier contribute $0 to MRR.
- Churned MRR: Lost MRR from subscriptions canceled or expired during the selected period.

### 2.3 Annual Run Rate (ARR)
- Extrapolated MRR calculated only when sustained recurring subscription activity exists:
  $$\text{ARR} = \text{MRR} \times 12$$

### 2.4 Average Revenue Per User (ARPU)
$$\text{ARPU} = \frac{\text{Total Net Revenue in Period}}{\text{Total Active Users in Period}}$$

### 2.5 Conversion Funnel
$$\text{Conversion Rate} = \frac{\text{Total Paid Users}}{\text{Total Registered Users}} \times 100\%$$

---

## 3. Dedicated Financial Intelligence Center (`/admin/finance`)

### 3.1 Page Architecture
- **Timeframe Selector**: `Today`, `7d`, `30d`, `Quarter`, `Year`, `Custom Date Range`.
- **Primary Financial KPIs**:
  1. Gross Revenue
  2. Net Revenue
  3. Current MRR (with delta % vs previous period)
  4. Active Paying Subscribers
  5. Average Revenue Per User (ARPU)
  6. Payment Success Rate (%)
- **Interactive Financial Charts**:
  - Revenue Trend Line Chart (Daily / Weekly / Monthly gross vs net)
  - Revenue Breakdown by Plan (Plus vs Pro donut chart)
  - Subscription Lifecycle Bar Chart (New, Renewed, Canceled)
  - Payment Outcome Distribution (Paid, Pending, Failed, Canceled)
- **Failed Payment Report**:
  - Detailed table showing user, plan, amount, failure reason, and retry actions.
- **Accounting Transaction Ledger**:
  - Searchable, filterable table of all `PaymentOrder` transactions.
  - Columns: Transaction Date, Order Code, User Reference (Email/ID), Tier/Plan, Amount, Currency (VND/USD), Method (VietQR/PayOS), Status, Reconciliation State.

### 3.2 Accounting CSV Export
- Button: `[Xuất Báo Cáo / Export CSV]`
- Security Gate: Requires `finance.export` permission.
- Format: ISO-standard CSV containing:
  ```text
  TransactionDate,OrderCode,UserID,UserEmail,PlanTier,Amount,Currency,PaymentMethod,Status,PaidAt
  ```
- Strict Privacy: Zero card numbers, CVVs, or provider secrets are ever exported.

### 3.3 Zero Fake Data Policy
When no real transactions have occurred in the database:
- Charts display an elegant empty state with message:
  > *"Chưa có dữ liệu giao dịch tài chính. Báo cáo tài chính sẽ tự động hiển thị khi hệ thống ghi nhận các giao dịch thanh toán đầu tiên."*
- Metric cards display `$0` / `0 ₫` with neutral trend badges.
- Fake randomized numbers are strictly forbidden.
