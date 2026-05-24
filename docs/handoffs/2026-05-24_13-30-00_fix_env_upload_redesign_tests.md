# Handoff: fix env, add file upload, redesign UI, add tests

## Tool

- OpenCode

## Changed Files

### Fixes
- `ai-interview-replay/src/lib/env.ts`: expanded env key detection to support `LLM_API_KEY`, `DEEPSEEK_API_KEY`, `ZHIPU_API_KEY` (user had `DEEPSEEK_API_KEY` but code read `LLM_API_KEY`).
- `ai-interview-replay/.env.example`: updated to show both generic and vendor-specific env var names.
- `.gitignore` (subproject): fixed `.env*` to allow `.env.example` commit via `!.env.example`.

### Feature: File Upload (Word/PDF/txt)
- `ai-interview-replay/src/app/api/parse-file/route.ts`: New API route. Parses `.txt`, `.md`, `.docx` (via mammoth), `.pdf` (via pdfjs-dist 4). Max 5MB, truncates to 5000 chars.
- `ai-interview-replay/src/components/file-upload.tsx`: Drag-and-drop file upload component with loading state and file format validation.
- `ai-interview-replay/package.json`: Added `mammoth` and `pdfjs-dist@4` as runtime dependencies.

### Feature: Interview Background on Homepage
- `ai-interview-replay/src/lib/interview-context.ts`: localStorage-backed shared state hook for interview background (type, direction, school, materials). Persists across pre/post pages.
- `ai-interview-replay/src/app/page.tsx`: Complete redesign. Now includes interview background panel with form fields + file upload at top, then mode selection cards below.
- `ai-interview-replay/src/app/pre/page.tsx`: Now reads defaults from `useInterviewContext` and passes to form.
- `ai-interview-replay/src/app/post/page.tsx`: Same.
- `ai-interview-replay/src/features/pre-replay/pre-replay-form.tsx`: Added `defaults` prop to pre-fill fields from homepage context.
- `ai-interview-replay/src/features/post-replay/post-replay-form.tsx`: Same.

### UI Polish
- `ai-interview-replay/src/app/layout.tsx`: Updated with logo badge, backdrop-blur header, footer.
- `ai-interview-replay/src/app/globals.css`: Updated colors (`#f1f5f9` bg, `#0f172a` text), anti-aliased fonts.
- `ai-interview-replay/src/components/mode-card.tsx`: Updated with rounded-2xl, hover translate, better color scheme.

### Testing
- `ai-interview-replay/tests/test-functions.ts`: 27 unit tests covering schemas, normalizers, sanitizers, copy formatters, prompt builders. All pass.
- `ai-interview-replay/tests/test-api.mjs`: 26 integration tests against live dev server covering all 3 API routes and validation. All pass.
- `AGENTS.md` section 6: added requirement to test backend APIs with mock data after every code change.

### Root
- `README.md`: Updated with project intro, `cd ai-interview-replay` instructions, and file structure.
- `AGENTS.md`: Added backend API testing requirement to section 6.

## Reason

1. User's `.env.local` had `DEEPSEEK_API_KEY` but code only read `LLM_API_KEY` — fixed by supporting multiple env var names.
2. User requested file upload for background materials (.docx/.pdf/.txt).
3. User wanted interview background moved to homepage (shared between both modes).
4. User said layout "doesn't look good" — polished with better colors, backdrop blur, card styles, footer.
5. Per AGENTS.md new rule, wrote comprehensive backend tests.

## Git Status Summary

```
 M AGENTS.md
 M README.md
 M ai-interview-replay/GUIDES/1-ProjectProposal.md
 M ai-interview-replay/GUIDES/README.md
?? ai-interview-replay/.env.example
?? ai-interview-replay/.gitignore
?? ai-interview-replay/GUIDES/3-CodePlanOfP1.md
?? ai-interview-replay/GUIDES/UpdatePlan.md
?? ai-interview-replay/README.md
?? ai-interview-replay/eslint.config.mjs
?? ai-interview-replay/next.config.ts
?? ai-interview-replay/package-lock.json
?? ai-interview-replay/package.json
?? ai-interview-replay/postcss.config.mjs
?? ai-interview-replay/public/
?? ai-interview-replay/src/
?? ai-interview-replay/tests/
?? ai-interview-replay/tsconfig.json
?? docs/handoffs/2026-05-24_11-07-23_ai_interview_replay_p1_plan.md
?? docs/handoffs/2026-05-24_12-00-00_implement_p0_full_stack.md
```

Note: `GUIDES/3-CodePlanOfP1.md`, `GUIDES/UpdatePlan.md`, `docs/handoffs/2026-05-24_11-07-23_ai_interview_replay_p1_plan.md` are from another session/tool. Do not overwrite.

## Suggested Commit

- Files: all changed/modified files in `ai-interview-replay/` + root `README.md` + root `AGENTS.md` + `docs/handoffs/2026-05-24_*` handoffs
- Message: `fix env vars, add file upload, redesign homepage, add backend tests`

## Completed

- Fixed env var mismatch: `DEEPSEEK_API_KEY` now recognized alongside `LLM_API_KEY`.
- File upload: .txt, .md, .docx (mammoth), .pdf (pdfjs-dist) — all parse to text.
- Homepage redesign: interview background panel at top, shared via localStorage.
- UI polish: backdrop-blur header, better colors, rounded-2xl cards, footer, logo badge.
- 27 unit tests (all pass): schemas, normalizers, sanitizers, copy format, prompt builders.
- 26 integration tests (all pass): hit all 3 API routes with real LLM, validated responses and error codes.
- `npm run build` passes with 8 routes (5 dynamic, 3 static).
- AGENTS.md updated with backend testing requirement.

## Not Completed

- No `.env.local` committed (per rules).
- File upload only tested with .txt manually; .docx/.pdf parsing not manually tested with real files.
- No E2E browser testing.
- P1 features (timer, dynamic answers, Markdown export, history) not implemented.
- `GUIDES/3-CodePlanOfP1.md` and `UpdatePlan.md` are untracked from another session — need review before commit.

## Verified

- `npm run build`: PASSED, all routes compiled.
- 27 unit tests: PASSED (0 failures).
- 26 API integration tests with real LLM: PASSED (0 failures).
- .env.local not tracked (confirmed via git status — not listed).
- No hardcoded keys in committed files.
- Frontend uses relative API paths, no `localhost` hardcoded.

## Not Verified

- .docx and .pdf file upload parsing with real binary files.
- Cross-browser rendering.
- Production `npm start` runtime.
- Server deploy flow.

## Known Issues

- `pdfjs-dist` warning about missing canvas during build (cosmetic, not functional).
- `GUIDES/` contains files from another session (`UpdatePlan.md`, `3-CodePlanOfP1.md`) — review before committing.
- File upload UI only shows in homepage background section; pre/post pages read from localStorage.

## Next Notes

- Test file upload with real .docx and .pdf files.
- Review and reconcile `GUIDES/UpdatePlan.md` and `GUIDES/3-CodePlanOfP1.md` from other session.
- P1 priorities: timer countdown, dynamic answer add/remove, Markdown export.
- Run `npm run lint` before commit to ensure no ESLint issues.
- Do not run `git add`/`git commit`/`git push` unless explicitly requested.
- For server deploy: `cd ai-interview-replay && npm install && cp .env.example .env.local && npm run build && npm start`.

## Env / Dependencies / Deployment Changes

- New dependencies: `mammoth` (docx parsing), `pdfjs-dist@4` (pdf parsing). Removed: `pdf-parse` (runtime issues in Next.js).
- Env vars: `env.ts` now reads `LLM_API_KEY` || `DEEPSEEK_API_KEY` || `ZHIPU_API_KEY`. `.env.example` reflects all options.
- No deployment command changes.
- New test scripts: `npx tsx tests/test-functions.ts` (unit) and `node tests/test-api.mjs` (integration).
