# LexiMind AI — Vocabulary Master Bank (`/admin/vocabulary`)

## 1. Overview
The Vocabulary Management Module provides complete administrative control over the canonical vocabulary dictionary.

## 2. Features & Capabilities
- **CRUD Operations**: Create, view, update, and delete vocabulary records.
- **Search Engine**: Exact word matching, phonetic query, and substring definition search.
- **Filter Controls**:
  - CEFR Level (`A1`, `A2`, `B1`, `B2`, `C1`, `C2`)
  - Part of Speech (`noun`, `verb`, `adjective`, `adverb`, `phrase`)
  - Difficulty rating (1.0 to 5.0)
- **Content Quality Scoring**:
  - Automatically computes quality score (0 - 100%) based on completeness:
    - Definition completeness (+25%)
    - IPA phonetic presence (+15%)
    - Example sentences (+20%)
  - Flags content with missing components (`Thiếu định nghĩa`, `Thiếu IPA`, `Thiếu ví dụ`).
- **Bulk Operations**:
  - Multi-select rows with sticky action toolbar.
  - Bulk assign CEFR levels.
  - Bulk delete selected entries.
- **Batch Import Pipeline with Pre-Validation Preview**:
  - Accepts CSV (`word,partOfSpeech,cefr,definition,phonetic`) or JSON.
  - Validates syntax and deduplicates before writing to database.
  - Previews breakdown (`Valid: X`, `Duplicate: Y`, `Invalid: Z`) requiring admin confirmation.
