# LetStuN AI — Learner Shared Vocabulary Vault (`/admin/shared-vocabulary`)

## 1. Purpose
The Learner Shared Vocabulary Vault manages community-contributed vocabulary decks submitted by learners.

## 2. Moderation Workflow
```text
Learner Submission
       ↓
Pre-Validation & DB Record
       ↓
AI Quality Scoring & Flagging
       ↓
Admin Inspection Drawer
       ↓
Approve / Reject (with feedback reason)
       ↓
Publish to Master Dictionary (Optional)
       ↓
In-App Notification to Contributor
```

## 3. Key Components
- **AI Quality Score**: Evaluates definitions, phonetics, and contextual examples across all words in the deck.
- **Drawer Inspection**: Full word list inspection with part-of-speech, definition, and contextual usage examples.
- **Publish to Master**: Instantly synchronizes approved community deck words into the canonical master `Vocabulary` bank with automated deduplication.
- **Polite Notifications**:
  - Approved: *"Chúc mừng! Bộ từ vựng của bạn đã được kiểm duyệt và công khai trên hệ thống."*
  - Rejected: *"Bộ từ vựng chưa được xuất bản. Góp ý từ quản trị viên: [Lý do]."*
