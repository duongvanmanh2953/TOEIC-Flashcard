# AI Interview Studio — Production Code Review & Architecture Audit

> **Target:** AI Interview Studio (`apps/web`, `apps/api`, `services/app-api`, `packages/shared`)  
> **Review Standard:** `code-review-expert` (SOLID, Security, Robustness, Mobile UX, Multilingual Voice Pipeline)  
> **Date:** October 31, 2026  
> **Status:** COMPLETED & ACTIONABLE

---

## 1. Executive Summary

A comprehensive code review and penetration audit was conducted on the AI Interview Studio module across frontend, backend, shared packages, voice subsystem, and database access layers.

### Overall Assessment: `REQUEST_CHANGES` (13 Critical & High-Priority Defects Detected)
The current implementation contained severe security bypasses, completely disconnected voice-to-text pipelines, locale-ignorant text-to-speech, taxonomy fallbacks that routed Hospitality candidates to React architecture questions, and arbitrary ungrounded scoring.

| ID | Category | Severity | Description | Location | Status |
|---|---|---|---|---|---|
| **SEC-01** | Security / Entitlement | **P0 (Critical)** | Free users can bypass Pro paywall via local fallback simulation (`session_local_`) | `apps/web/src/pages/AIInterviewStudioPage.tsx:342` | Must Fix |
| **SEC-02** | Security / AuthZ | **P0 (Critical)** | Backend billing service allows free users 2 sessions/day; endpoints lack fail-closed Pro check | `interview-billing.service.ts:44` | Must Fix |
| **VOICE-01** | Speech Pipeline | **P1 (High)** | Mic recorder does not transcribe speech (`recordedTranscript = ''` hardcoded) | `AIInterviewStudioPage.tsx:155` | Must Fix |
| **VOICE-02** | Speech / Locale | **P1 (High)** | TTS audio synthesis only supports `vi-VN` or `en-US`, failing for Japanese, Korean, Chinese | `AIInterviewStudioPage.tsx:274` | Must Fix |
| **LANG-01** | Multilingual Context | **P1 (High)** | No unified `InterviewLanguageContext`; UI language conflated with Interview Language | Shared / API / Web | Must Fix |
| **TRANS-01** | Translation System | **P1 (High)** | Translation endpoint lacks source language, purpose, glossary term preservation | `interview.service.ts:291` | Must Fix |
| **AI-01** | Domain Relevance | **P1 (High)** | Hospitality/Marketing/Education fall back to TECH questions (React/System Design for Receptionists) | `interview.service.ts:562` | Must Fix |
| **AI-02** | Personas & Scripts | **P1 (High)** | Opening greeting is generic and English-only, ignoring candidate seniority, role, and language | `interview.service.ts:481` | Must Fix |
| **AI-03** | Adaptive Intelligence | **P2 (Medium)** | Follow-up logic uses word-count threshold (`< 25 words`) instead of missing STAR dimensions | `interview.service.ts:510` | Must Fix |
| **SCORE-01** | Scoring Architecture | **P1 (High)** | Single arbitrary prompt score without separating Professional Competency, Communication, Language, Performance | `interview.service.ts:386` | Must Fix |
| **SCORE-02** | Translation-Awareness | **P1 (High)** | Translated answers scored as if directly spoken; no distinction between native speech and translated text | `interview.service.ts:396` | Must Fix |
| **UX-01** | Mobile UX | **P1 (High)** | Wizard 3-step grid (`grid-cols-3`) overflows and truncates step titles on screens < 390px | `AIInterviewStudioPage.tsx:738` | Must Fix |
| **UX-02** | Mobile UX | **P1 (High)** | Studio header badges and action buttons wrap awkwardly on mobile viewports (320px–375px) | `AIInterviewStudioPage.tsx:683` | Must Fix |

---

## 2. In-Depth Root Cause Analysis

### 2.1. Critical Security Vulnerability: Pro Paywall Bypass (SEC-01 & SEC-02)
- **Root Cause:** In `AIInterviewStudioPage.tsx` (`handleStartSession`), the `try/catch` block caught any network error or 403 Forbidden response and silently instantiated a local mock session:
  ```ts
  const mockId = `session_local_${Date.now()}`;
  setSessionId(mockId);
  // Full interview continues locally with simulated responses
  ```
  Consequently, non-subscribers who were rejected by the backend or who simply simulated a failure could complete unlimited interview sessions with full score reports.
- **Backend Flaw:** `InterviewBillingService.checkEntitlement` allowed free users 2 sessions per day (`sessionsToday < 2`), violating the requirement that AI Interview Studio is an exclusive Pro feature requiring active subscription.

### 2.2. Disconnected Voice-to-Text Pipeline (VOICE-01 & VOICE-02)
- **Root Cause:** In `AIInterviewStudioPage.tsx`:
  ```ts
  const { isRecording, startRecording, stopRecording } = useVoiceRecorder();
  const recordedTranscript = ''; // Hardcoded empty string!
  ```
  `useVoiceRecorder` only recorded raw audio into a MediaRecorder blob without running Speech Recognition or calling an STT endpoint. The candidate had to type all answers manually.
- **TTS Locale Breakdown:**
  ```ts
  utterance.lang = (interviewLang || activeLanguage?.id || 'en') === 'vi' ? 'vi-VN' : 'en-US';
  ```
  When the candidate studied Japanese (`ja`), Korean (`ko`), or Chinese (`zh`), the speech synthesis uttered CJK characters using an English voice engine (`en-US`), causing unintelligible phonetic gibberish.

### 2.3. Missing Domain Knowledge Taxonomy & Broken Fallbacks (AI-01 & AI-02)
- **Root Cause:** In `interview.service.ts`, `getCuratedFallbackQuestions`:
  ```ts
  const list = questionsByIndustry[industryCode] || questionsByIndustry.TECH;
  ```
  Industries `HOSP` (Hospitality), `MKT` (Marketing), and `EDU` (Education) were not populated. When a candidate selected Hotel Receptionist (`HOSP_REC`), the system served questions about distributed NestJS caching and React state management.
- Furthermore, fallback questions were hardcoded in English, completely ignoring the candidate's chosen Interview Language (`ja`, `ko`, `zh`).

### 2.4. Translation Pipeline Lacking Direction & Purpose (TRANS-01)
- **Root Cause:** `translateContent` accepted only `text` and `targetLang` (defaulting to `vi`). It could not determine whether it was translating a Question (EN -> VI), a Candidate Answer (VI -> EN), a Hint, or Feedback.
- If source and target were identical, it still fired unnecessary LLM calls.
- There was no glossary to protect technical keywords (e.g. "Redis", "State Management", "Check-in/Check-out") from unnatural translation.

### 2.5. Scoring Architecture Flaws (SCORE-01 & SCORE-02)
- **Root Cause:** Evaluation generated a single monolithic `overallScore` without separating the 4 core pillars:
  1. **Professional Competency** (domain knowledge, technical accuracy, problem solving).
  2. **Communication** (clarity, structure, conciseness).
  3. **Language Proficiency** (grammar, vocabulary, syntax).
  4. **Interview Performance** (STAR method, supporting evidence, confidence).
- Crucially, if a candidate answered in Vietnamese and the system translated it to English, the LLM scored English grammar and vocabulary on translated text as if the candidate spoke fluent English, corrupting learning diagnostics.

### 2.6. Mobile UX Cutoffs & Viewport Blockers (UX-01 & UX-02)
- On screens ≤ 375px (iPhone SE, Galaxy S8, standard mobile):
  - Stepper used `grid-cols-3` with multi-line badges, causing `truncate` to hide step labels.
  - Page header stacked 3 separate badges and 2 modal buttons in flex rows that wrapped into multiple jagged lines.
  - Candidate textarea had a static height and was pushed off-screen when the virtual keyboard opened.

---

## 3. Targeted Resolution Architecture

### 3.1. Unified Multilingual Context Object (`InterviewLanguageContext`)
Introduce a strict typed context contract in `@vocabflow/shared`:
```ts
export interface InterviewLanguageContext {
  languageSpaceId: string;
  interviewLanguage: string;
  interviewLocale: string;
  supportLanguage: string;
  uiLanguage: string;
  expectedSpeechLocales: string[];
  ttsVoiceId?: string;
  transcriptionCapability: boolean;
  translationCapability: boolean;
  pronunciationAssessmentCapability: boolean;
}
```

### 3.2. Centralized Translation Service (`TranslationRequest`)
Support bidirectional pairs:
- `en` <-> `vi`
- `ja` <-> `vi`
- `ko` <-> `vi`
- `zh` <-> `vi`
With explicit `purpose`: `question` | `answer` | `hint` | `sample_answer` | `feedback` | `explanation`.

### 3.3. Two-Case Voice-to-Target Pipeline
- **Case A (Target Language Spoken):** Transcribe in interview locale, score both domain competency and language proficiency.
- **Case B (Support Language Spoken):** Transcribe in support language (e.g. `vi-VN`), translate to interview language for domain evaluation, mark answer as translated, and exclude target-language fluency/grammar scoring.

### 3.4. Fail-Closed Backend Pro Entitlement Guard
- Require `Role.PREMIUM_USER`, `Role.ADMIN`, or `Role.SUPER_ADMIN` on all interview endpoints.
- Return explicit `403 Forbidden` for non-Pro users.
- Present sleek Executive Paywall UI on frontend with feature highlights, preventing non-Pro users from opening live sessions.
- Remove all client-side local bypasses.

### 3.5. Mobile-First Responsive Stepper & Header
- Implement compact mobile stepper: `Bước X / 3 · [Tên bước]` with animated progress indicator.
- Streamline header with responsive icon actions and clean hierarchy.
- Optimize candidate response workspace with dynamic viewport awareness and auto-scrolling transcript.
