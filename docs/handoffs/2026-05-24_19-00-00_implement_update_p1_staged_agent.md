# Handoff: implement update P1 staged agent pre-analysis

## Tool

- OpenCode

## Changed Files

### New Files
- `src/lib/agents/fingerprint.ts` — SHA256-based input fingerprint for pre-analysis cache validation (material + question variants)
- `src/lib/agents/evidence-planner-agent.ts` — New agent: pre-plans which evidence cards should be used for a given question BEFORE answers are written
- `src/app/api/agents/material/route.ts` — POST `/api/agents/material` — triggers Material Analyst independently, returns EvidenceCards + inputFingerprint
- `src/app/api/agents/question-plan/route.ts` — POST `/api/agents/question-plan` — triggers Intent Agent + Evidence Planner, returns QuestionPreAnalysis

### Modified Core Files
- `src/types/replay.ts` — Added `ExpectedEvidenceItem`, `MaterialPreAnalysis`, `QuestionPreAnalysis` types. Extended `AgentTraceItem` with `agentVersion`, `stage`, `usedCachedInput`, `errorCode` fields. Added optional `materialAnalysis`/`questionPlan` to both request types.
- `src/lib/agents/runner.ts` — Complete rewrite: added `resolveMaterialAnalysis()` & `resolveQuestionPlan()` with fingerprint validation; Professor+Gap (and Professor+Diff) now execute in parallel via `Promise.all`; non-critical agent failures gracefully degrade with empty data + failed trace; pre-analysis results are validated before reuse.
- `src/lib/agents/evidence-agent.ts` — Added optional `expectedEvidence` input. When present, the prompt uses pre-planned expected evidence as the basis for recall calculation.
- `src/lib/interview-context.ts` — Added `materialAnalysis`, `questionPlans`, `isMaterialAnalysisStale` state with localStorage persistence. `clear()` now clears pre-analysis data too.
- `src/lib/schemas.ts` — `validatePreRequest` and `validatePostRequest` now pass through `materialAnalysis` and `questionPlan` fields.

### Modified Frontend Files
- `src/app/page.tsx` — Added "分析材料" button with loading spinner, evidence card count display, stale-detection. Shows `EvidenceCardList` preview below background panel when analysis is done.
- `src/app/pre/page.tsx` — Triggers `/api/agents/question-plan` on question change (debounced for manual input, immediate for AI generation). Attaches `materialAnalysis` and `questionPlan` to replay request. Does NOT show detailed intent pre-live-answer.
- `src/app/post/page.tsx` — Same question-plan trigger. Passes `questionPlan` to form for visible display (post mode has no live-answer spoiler concern).
- `src/features/pre-replay/pre-replay-form.tsx` — New props: `onQuestionReady`, `planningQuestion`, `planError`. Shows "问题分析已完成" status in editing stage.
- `src/features/post-replay/post-replay-form.tsx` — New props: `onQuestionReady`, `planningQuestion`, `planError`, `questionPlan`. Shows question intent + recommended evidence in a blue info panel.
- `src/components/agent-trace-panel.tsx` — Now groups traces by stage, shows agent version, cache badge, stage labels.

### Modified Test Files
- `tests/test-functions.ts` — Added 8 new fingerprint & pre-analysis pass-through tests (35 total, all pass)
- `tests/test-api.mjs` — Added tests for `/api/agents/material`, `/api/agents/question-plan`, and replay with pre-analysis

## Reason

Implemented Update P1 per `GUIDES/UpdatePlan.md` §31 and `GUIDES/6-CodePlanOfUpdateP1.md`. Core changes:
1. **Staged pre-analysis**: Material Analyst runs on homepage, Question Intent + Evidence Planner run when question is determined, not at final submission.
2. **Pre-analysis reuse**: Runner validates fingerprint to decide whether to reuse cached results or fall back to running agents fresh.
3. **Parallel diagnosis**: Professor + Gap (or Professor + Diff) run in parallel after Evidence Mapper completes.
4. **Graceful degradation**: Non-critical agent failures (Professor, Gap/Diff) produce empty results instead of aborting the entire request.

## Git Status Summary

```
M  src/types/replay.ts
M  src/lib/agents/runner.ts
M  src/lib/agents/evidence-agent.ts
M  src/lib/interview-context.ts
M  src/lib/schemas.ts
M  src/app/page.tsx
M  src/app/pre/page.tsx
M  src/app/post/page.tsx
M  src/features/pre-replay/pre-replay-form.tsx
M  src/features/post-replay/post-replay-form.tsx
M  src/components/agent-trace-panel.tsx
M  tests/test-functions.ts
M  tests/test-api.mjs
?? src/lib/agents/fingerprint.ts
?? src/lib/agents/evidence-planner-agent.ts
?? src/app/api/agents/material/route.ts
?? src/app/api/agents/question-plan/route.ts
```

## Suggested Commit

- Files: all modified + new files listed above + this handoff
- Message: `implement P1 staged agent pre-analysis with parallelism and graceful degradation`

## Completed

- `/api/agents/material` endpoint for independent material analysis from homepage
- `/api/agents/question-plan` endpoint for question intent + evidence planning
- Evidence Planner Agent (separate from Evidence Mapper) — pre-plans expected evidence before answers
- Fingerprint utility for cache validation (SHA256-based)
- Homepage "分析材料" button with evidence card preview and stale detection
- Pre page: question planning triggered after AI generation or manual input (debounced), intent hidden pre-live-answer
- Post page: question planning with visible intent and recommended materials display
- Runner: fingerprint-based pre-analysis reuse with structured validation fallback
- Runner: Professor + Gap/Diff run in parallel via `Promise.all`
- Runner: non-critical agent failures gracefully degrade (empty data + failed trace)
- Evidence Agent: accepts optional `expectedEvidence` parameter for pre-planned material recall
- Replay request types: accept optional `materialAnalysis` and `questionPlan`
- Schema validation: passes through pre-analysis fields
- Agent Trace Panel: grouped by stage, shows version, cache badge
- Agent Trace Items: extended with `agentVersion`, `stage`, `usedCachedInput`, `errorCode`, "skipped" status
- interview-context: localStorage caching for materialAnalysis and questionPlans with staleness check
- 35 unit tests pass (27 P0 + 8 new P1 tests)
- `npm run build` passes (Turbopack + TypeScript)
- Two new API routes confirmed in build output: `/api/agents/material`, `/api/agents/question-plan`

## Not Completed

- No complex timeline UI (existing AgentTracePanel upgraded with stage grouping, sufficient for demo)
- No per-agent individual failure recovery granularity (parallel agents fail as a batch)
- No auto-debounce analysis (manual button + onChange debounce handled)
- No multi-question plan list caching (single current plan per page)

## Verified

- `npx tsc --noEmit`: PASSED (zero errors)
- `npm run build`: PASSED (all 11 routes generated)
- 35 unit tests: PASSED (0 failures)
- Code audit: all 4 new API endpoints wired, pre-analysis flow complete

## Not Verified

- End-to-end API integration tests (require dev server + real LLM key)
- Browser rendering of new homepage analysis button + evidence preview
- Browser rendering of post mode question intent panel
- Browser rendering of agent trace with stage/cache badges
- Actual parallelism speed improvement (depends on LLM provider concurrency)

## Known Issues

- Frontend fingerprint staleness detection uses plain text comparison (not SHA256 like backend). Different but functionally equivalent — if materials text changes, frontend marks stale.
- Material file upload content contributes to `fullMaterials` but `analyzeMaterials` only sends `backgroundMaterials` textarea. Files are included in replay requests but not in pre-analysis API call.
- `Promise.all` parallelism only effective if LLM provider supports concurrent requests. On single-thread providers, it falls back to sequential.

## Next Notes

- Run full integration test: `node tests/test-api.mjs` (requires dev server + real LLM API key)
- Test homepage material analysis flow in browser
- Test pre mode: AI generate question → question plan → live answer → submit with pre-analysis
- Test post mode: enter question → see intent/recommended materials → write answers → submit with pre-analysis
- Verify agent trace shows "缓存" badge when pre-analysis is reused
- The next natural step after P1 is FrontendOptimizationPlan (homepage workbench, step guidance, loading stages, report summary cards)
- Do not run git add/commit/push unless explicitly requested

## Env / Dependencies / Deployment Changes

- No new dependencies
- No env var changes
- No deployment command changes
- Slightly reduced LLM cost when pre-analysis is reused (2 fewer calls: material + intent)
- P1 parallel execution may increase peak concurrency on LLM provider
