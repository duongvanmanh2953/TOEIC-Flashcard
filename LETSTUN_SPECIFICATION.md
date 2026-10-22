# LetStuN — Project Functional Specification

## 1. Product overview
LetStuN is a multilingual language-learning platform centered around vocabulary, flashcards, question banks, test sets, community content, learning progress, and child-friendly/Kids learning experiences.

The product supports:
- Multiple learning languages rather than being hard-coded to English.
- Vocabulary banks with structured words, meanings, pronunciation, audio, images, tags and metadata.
- Test/exam sets such as TOEIC and Japanese JLPT-style parts/sections (for example N1/N2/N3/N4/N5 where applicable).
- Question banks and reusable questions.
- Community sets with discovery, detail, like/dislike and comments.
- User-owned sets and community publishing.
- Smart review generated from the user's selected vocabulary/question stores instead of hard-coded samples.
- Child/Kids experiences with strong visual hierarchy, voice-first learning and interactive games.
- Subscription/package-based feature access.
- Admin dashboards, statistics and system controls.
- Responsive web and mobile layouts.

## 2. Core user roles
- **Guest**: Can browse public/auth pages and any deliberately public content. Must not receive authenticated-only actions or private data.
- **Registered user**: Can create and manage personal vocabulary/question banks, study, take tests, view progress, interact with community content according to permissions, and use any features allowed by the active package.
- **Creator / advanced user**: Can create richer public content, upload media, publish reusable sets, and use creator functions when package/permission allows.
- **VIP / paid user**: Receives the premium feature bundle configured by the current billing system. Access must be enforced both in UI and server/API authorization.
- **Admin**: Can manage users/content/configuration/statistics/packages and perform destructive system operations subject to elevated authentication.

## 3. Authentication and account rules
- Remove all demo accounts, demo login credentials, demo shortcuts, sample-account buttons, fake login data and documentation references that expose demo credentials.
- Keep seed/sample content only when it is genuinely required by product behavior; distinguish product sample content from demo authentication accounts.
- Authenticated routes must enforce authentication.
- Package-restricted actions must enforce permissions server-side where possible; UI hiding alone is insufficient.
- On logout, private state/tokens/cache must be cleared safely.
- Handle expired sessions without breaking navigation.

## 4. Navigation and layout behavior
### Desktop web
The desktop shell uses a persistent sidebar/layout region.
Expected behavior:
- Clicking a sidebar item changes the main content only.
- The sidebar must NOT visually reload/remount and jump back to the top when navigating between content pages.
- Preserve sidebar internal scroll position while moving between pages.
- The main content area should have its own scroll context where appropriate.
- When route changes, reset/position the main content scroll to the top only when that is the intended navigation behavior.
- Sidebar state such as expanded groups, active section and scroll position should persist during normal navigation.
- Do not solve the problem by adding fragile setTimeout hacks; fix the layout/component lifecycle/root cause.
- Avoid unnecessary remounting caused by route keys, parent keying, conditional layout destruction, or reinitializing large navigation components.

### Mobile
Mobile intentionally uses a drawer/off-canvas sidebar.
Expected behavior:
- Opening a new route can close the drawer.
- Resetting the drawer scroll after navigation is acceptable and may be preferable.
- Main content must still reset to its top as expected.
- Touch targets must be comfortable and not collide with browser safe areas.

### General responsive rules
Audit at minimum: 360px, 390px, 430px, 768px, 1024px, 1280px, 1440px+ width.
Do not merely shrink desktop layouts. Recompose dense interfaces where needed.

## 5. Global UX quality requirements
Every user-facing page should be checked for:
- Loading state, Empty state, Error state, Permission-restricted state.
- First-use guidance where the page contains meaningful user actions.
- Responsive spacing, Typography contrast and legibility, Button/icon consistency, Form validation.
- Disabled/loading states during mutation, Success/error feedback.
- Keyboard/focus usability on web, Touch usability on mobile.
- Overflow, clipping and horizontal-scroll problems.
- Long text, translated text and empty/large data edge cases.
- Avoid tiny or ambiguous controls. Do not use decorative elements that reduce information density or readability.

## 6. User help / how-to guidance
Pages containing meaningful user operations expose contextual guidance.
Examples include:
- Creating/editing a vocabulary bank
- Creating/editing a test set
- Importing questions, Adding audio/image media
- Publishing to community, Taking a test, Reviewing mistakes, Smart review, Package/feature management
Guidance answers: What this page/function does, What the user should do first, What each important field/option means, What the result will be, Any package/permission limitation.

## 7. Smart Pricing page
- Clear plan hierarchy, Strong primary CTA.
- Feature comparison that remains usable on narrow screens.
- Distinguish monthly/yearly billing.
- Make included quotas explicit instead of hiding important limits in tooltips.
- Show media/storage/TTS limits transparently.
- Visually separate core learning functions from creator/premium functions.
- Make the active package obvious, Make upgrade/downgrade/cancel actions unambiguous.
- Avoid overly wide cards, duplicated feature lists, dead space and inconsistent vertical alignment.
- Preserve accessible contrast and readable text sizes.

## 8. Proposed package/entitlement model
Baseline capability groups:
- **Free**: Basic study and test-taking, Limited personal storage, Limited community interaction, Limited media storage (External links allowed), Limited TTS, No bulk upload.
- **Entry paid**: ~500 MB personal storage (Image 5MB, Audio 10MB), Limited bulk import, Higher TTS quota, Larger limits.
- **VIP / premium**: ~5 GB personal storage (Image 10MB, Audio 20MB), Bulk media/question import, Full external links, High TTS quota, Advanced test/set structures, Priority access.

## 9. Media model for question banks
Question banks support optional media at question level, answer/choice or explanation level.
- Support audio/image upload, URL/external link, automatic TTS, media preview, replace/remove.
- Formats: JPEG/PNG/WebP, MP3/WAV/M4A/WebM.

## 10. Media optimization
- Oversized images resized/optimized (WebP).
- Audio duration normalized/validated.
- Preload=none for large lists to save bandwidth.

## 11. Question-bank structure and exam parts
- Supports parts/sections (e.g. TOEIC Part 1-7, JLPT N1-N5).
- Part metadata: Title, Description, Order, Time limit, Question count, Instructions, Scoring, Difficulty, Category.

## 12. Test and question UX
- Creators: Assign questions to parts, drag/reorder, bulk import, batch media, preview, validation.
- Learners: Part title, progress, question numbers, instructions, media playback controls.

## 13. Community sets
- Distinguish owned vs imported vs community.
- Visibility controls (public/private/unlisted).
- Likes, dislikes, comments.

## 14. Smart Review
- Uses user's actual selected vocabulary/question source instead of hard-coded samples.
- Considers difficulty, recency, streak, due date, question type.

## 15. Admin statistics and help icons
- Tooltips (`?` icons) on dashboard statistics to explain metrics, logic, time range, source.

## 16. Admin reset-all capability
- Special destructive "Reset all" function.
- Secured by `ADMIN_RESET_KEY` server-side secret.
- Requires explicit confirmation and phrase.
- Scope: User sets, community comments, learning history, uploaded media. (Leaves core settings/infrastructure intact).

## 17. Data integrity and security
- Authorized checks, file upload limits/sanitization, malicious SVG prevention, rate limiting.

## 18. Performance expectations
- Lazy loading, pagination/infinite scroll, virtualized lists for large datasets.

## 19. Accessibility
- Focus states, proper button semantics, labels, tooltips keyboard-accessible, sufficient contrast.
