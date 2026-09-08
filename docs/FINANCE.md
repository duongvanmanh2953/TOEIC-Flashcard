# LexiMind AI — Financial Intelligence & Accounting Ledger

## 1. Zero Fake Data Commitment
Financial intelligence displays authentic ledger calculations computed from real `PaymentOrder` and `Subscription` records. When no payment transactions exist, honest empty states are presented.

## 2. Definitions & Formulae
- **Gross Revenue**: Total sum of all orders with status `PAID` within the selected timeframe.
- **Net Revenue**: Gross Revenue minus estimated payment gateway transaction processing fees (1.5%).
- **MRR (Monthly Recurring Revenue)**: Sum of `plan.priceMonthly` across all subscriptions currently in `ACTIVE` status.
- **ARR (Annual Run Rate)**: `MRR * 12`.
- **ARPU (Average Revenue Per User)**: `Gross Revenue / Total Users`.
- **Failed Payment Analysis**: Audit of orders with status `FAILED`, `CANCELED`, or `EXPIRED`.

## 3. Dedicated Financial Endpoints
- `GET /api/v1/admin/finance/overview`: Unified financial report accepting `?range=Today|7d|30d|90d|year`.
- Transactions ledger includes: Date, Transaction ID, Learner Email, Plan Tier, Amount, Currency (VND), Status, and Payment Method.
- Complete CSV export functionality for financial audits.
