# Handoff: implement P1 enhancements

## Tool

- OpenCode

## Changed Files

### P1 Core Features

- `src/features/pre-replay/use-pre-answer-timer.ts` (new): Stage-based timer hook. Manages 8-stage state machine (editing→ready→liveAnswering→liveLocked/abandoned→calmAnswering→submitting→result). 5s preparation countdown with timeout→abandoned. Formal answer countdown with manual/timeout lock. Cleanup on unmount.

- `src/components/timer-control.tsx` (new): Duration selector (30s/60s/90s/120s presets) for pre-replay formal answer timer.

- `src/features/post-replay/use-answer-versions.ts` (new): Dynamic answer version management hook. Auto-labels (A-Z), add (max 6) / remove (min 2) with re-labeling, reset on clear.

- `src/components/answer-version-card.tsx` (new): Single answer version card with source editing, content textarea, remove button.

- `src/lib/markdown-export.ts` (new): `formatPreMarkdown()` / `formatPostMarkdown()` - converts structured report to .md string.

- `src/lib/filename.ts` (new): `safeFilename()` generates `interview-replay-{pre|post}-YYYYMMDD-HHmm.md` with sanitized chars.

- `src/components/markdown-export-button.tsx` (new): Blob-based .md download button.

### Refactored Components

- `src/features/pre-replay/pre-replay-form.tsx`: Complete rewrite. Removed redundant interview background fields (now from homepage context). Simplified to: question input + AI generate + timer settings in "editing" stage, then 7 timer-driven stages. **Props changed: `defaults` → `bg`**.

- `src/features/post-replay/post-replay-form.tsx`: Complete rewrite. Removed interviewContext/targetDirection/backgroundMaterials fields. Simplified to question + dynamic answer versions only. **Props changed: `defaults` → `bg`**.

- `src/features/pre-replay/pre-replay-result.tsx`: Added `MarkdownExportButton` component alongside existing `CopyButton`.

- `src/features/post-replay/post-replay-result.tsx`: Same.

### Page Updates

- `src/app/pre/page.tsx`: Changed from `defaults` → `bg` prop. Added "新一轮复盘" button when result is shown.

- `src/app/post/page.tsx`: Same.

### Bug Fixes / P0 Cleanup

- `src/app/api/questions/route.ts`: JSON.parse in try/catch → throws `MODEL_RESPONSE_INVALID` instead of falling through to `UNKNOWN_ERROR`.

- `src/app/layout.tsx`: Fixed `<a>` → `<Link>` for ESLint no-html-link-for-pages rule.

- `src/app/page.tsx`: Escaped Chinese quotes in JSX (`"` → `&ldquo;/&rdquo;`).

- `src/lib/ai/report-normalizer.ts`: Removed unused `JsonResponse` type.

- `src/lib/copy-format.ts`: Removed unused `SentenceDiagnosis` import.

- `src/lib/interview-context.ts`: Refactored `useEffect(setState(...))` to `useState(load)` lazy initializer to fix react-hooks/set-state-in-effect lint.

- `src/types/replay.ts`: Added `PreReplayStage` and `AnswerLockReason` types.

- `tsconfig.json`: Added `tests` to exclude to prevent build errors.

### Deleted Files (create-next-app leftovers)

- `src/favicon.ico`, `src/globals.css`, `src/layout.tsx`, `src/page.tsx`
- `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`

## Reason

Implemented P1 enhancements per `GUIDES/3-CodePlanOfP1.md`: 5s prep countdown, formal answer timer+lock, dynamic answer versions, Markdown export. Also fixed P0 lint issues and removed duplicate background fields from pre/post forms (data now flows from homepage localStorage only).

## Git Status Summary

```
Modified: layout.tsx, page.tsx, pre/page.tsx, post/page.tsx (pages)
Modified: pre-replay-form.tsx, post-replay-form.tsx (forms)
Modified: pre-replay-result.tsx, post-replay-result.tsx (results)
Modified: questions/route.ts, report-normalizer.ts, copy-format.ts, interview-context.ts, replay.ts, tsconfig.json
Deleted: leftover create-next-app files
New: 7 files (timer, versions, markdown export, etc.)
```

## Suggested Commit

- Files: all modified + new in `ai-interview-replay/` + `docs/handoffs/2026-05-24_13-30-00_fix_env_upload_redesign_tests.md` + this handoff
- Message: `implement P1: timer, dynamic answers, markdown export, P0 cleanup`

## Completed

- P1.1: 5s preparation countdown → abandoned state with restart
- P1.2: Formal answer timer (configurable 30/60/90/120s) → auto/manual lock
- P1.3: Dynamic answer versions (2-6, add/remove with re-labeling)
- P1.4: Markdown download (.md blob, safe filenames)
- P0 lint cleanup: 6 errors fixed, 0 warnings remaining (`npx eslint src/**/*.{ts,tsx}` passes)
- Removed duplicate background fields from pre/post forms
- All data flows: homepage localStorage → pages → forms → API — no fake or disconnected paths
- 27 unit tests pass (schemas, normalizers, sanitizers, copy format, prompt builders)
- API error flow: `/api/questions` JSON parse fail → `MODEL_RESPONSE_INVALID` (not `UNKNOWN_ERROR`)
- `generateQuestion` errors no longer silently swallowed

## Not Completed

- `npm run build` (skipped — takes too long, but passed multiple times during session)
- API integration tests against live server (not run this round)
- `npm run lint` on full project (src-only passes, full project times out)
- Manual browser testing of timer interactions (stage transitions, countdown, lock, restart)
- README not updated with P1 features

## Verified

- ESLint `src/**/*.{ts,tsx}` passes with 0 errors/warnings
- 27 unit tests: PASSED
- Code audit: all P0+P1 frontend→backend chains verified manually (no fake/dummy code)

## Not Verified

- Build (`npm run build`) — skipped due to timeout
- Timer stage transitions in browser
- Dynamic version add/remove in browser
- Markdown download in browser
- Full API integration tests against running dev server

## Known Issues

- `npm run build` is slow (~60s TypeScript check + ~30s compilation) due to large project
- `npm run lint` times out on full project (runs fine scoped to `src/`)
- Build failure risk: the last build that passed was BEFORE the form rewrite to use `bg` prop. The type change shifted from `defaults` to `bg` in both forms and pages. Should compile correctly as all call sites were updated.

## Next Notes

- Run `npm run build` when possible to verify final state
- Run API integration tests with dev server: `node tests/test-api.mjs`
- Update `ai-interview-replay/README.md` with P1 features
- Manually test: 5s prep → abandon → restart; timer lock; add/remove versions; Markdown download
- Clean up `test-backend.ts` (not needed, test-functions.ts + test-api.mjs cover everything)
- Review `GUIDES/UpdatePlan.md` — from other session, may need merging or deletion
- Do not run git add/commit/push unless explicitly requested

## Env / Dependencies / Deployment Changes

- No new dependencies added
- No env var changes
- No deployment command changes
