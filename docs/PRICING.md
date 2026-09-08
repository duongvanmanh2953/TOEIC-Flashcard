# LexiMind AI — Smart Pricing & Cost Model Engine (`/admin/pricing`)

## 1. Overview
The Pricing Engine models unit economics, dynamically calculates sustainable subscription prices, and configures tier usage quotas without hard-coding business logic.

## 2. Unit Economics & Cost Model Inputs
- **Variable Costs (per active user / month)**:
  - AI Tutor inference cost
  - Hosting and server infrastructure
  - Database and file storage
  - Support and operations
- **Transaction Fees**:
  - Payment provider fee % (e.g. 3.65% + 2,000 VND fixed fee)
- **Target Margin**:
  - Target gross margin % (e.g. 70%)

## 3. Mathematical Engine Outputs
- **Minimum Sustainable Price**: Covers total variable costs and transaction fees with 0% margin.
- **Recommended Price**: Satisfies the target gross margin percentage.
- **Comfortable Price**: 25% buffer for growth and marketing reinvestment.
- **Scenarios**:
  - Conservative (80% margin)
  - Balanced (70% margin)
  - Growth (50% margin)

## 4. Annual Plan Discounting
- Configurable annual discount (10%, 15%, 20%, 25%).
- Automated savings calculation: `monthly * 12 - annual`.
- Live toggle preview (Monthly vs. Yearly with `SAVE 20%` badges).

## 5. Usage Quotas Matrix
- Configures daily limits for Guest, Free, Plus, and Pro tiers:
  - AI Tutor queries / day
  - Daily review sessions
  - Custom quiz creations
  - Maximum word bank favorites
