# Handoff: implement Quality Opt P1

## Tool

- OpenCode

## Changed Files

### Modified
- `src/types/replay.ts` — Added `AnswerMaturityLevel`, `AnswerMaturity`, `QualitySummary` types. Extended `PreReplayReport` with `gapClaims`, `qualitySummary`, `answerMaturity`. Extended `PostReplayReport` with `versionClaims`, `qualitySummary`, `answerMaturity`.
- `src/lib/agents/types.ts` — Added `gapClaims: DiagnosisClaim[]` to `GapAgentOutput`, `versionClaims: DiagnosisClaim[]` to `DiffAgentOutput`.
- `src/lib/agents/gap-agent.ts` — Added `gapClaims` output. Updated normalizer to accept `evidenceCards` and normalize claims via `normalizeDiagnosisClaims`. Updated prompt to bind evidenceRefs/missingInfo on each claim, requiring evidence card references for "证据损失" and "边界损失". Updated system prompt.
- `src/lib/agents/diff-agent.ts` — Added `versionClaims` output. Updated normalizer to accept `evidenceCards` and normalize claims. Updated prompt to require per-version analysis of evidence addition/risk introduction/oral friendliness/follow-up handling. Updated system prompt.
- `src/lib/agents/composer.ts` — Added exported `assessMaturity()` function (L1-L5 maturity levels). Added exported `buildQualitySummary()` function (oneSentenceDiagnosis, topRisk, topMissingInfo, evidenceRecallText, answerSafety, maturity, conflictNotes). Added `resolveConflicts()` with deterministic priority rules (Verifier high severity > Professor pressureTests > Evidence missingInfo > Synthesizer riskControls; safety over maturity). Updated `composePreReport` and `composePostReport` signatures to accept and include `qualitySummary` and `maturity`.
- `src/lib/agents/training-agent.ts` — Extended input to accept `qualitySummary`, `answerVerification`, `maturity`. Updated prompt to use topRisk, safety status, maturity level/label/upgrade for generating next question recommendation with trigger reason, rescue templates covering top risk, and transferable formulas with maturity upgrade direction.
- `src/lib/agents/runner.ts` — Added Phase 6.5: builds `qualitySummary` and `maturity` after verifier, before training. Passes qualitySummary, answerVerification, and maturity to training agent. Passes to composer. Fixed empty fallback objects for GapAgentOutput and DiffAgentOutput to include new fields.
- `src/lib/ai/report-normalizer.ts` — Added `gapClaims`, `qualitySummary`, `answerMaturity` to `normalizePreReport`. Added `versionClaims`, `qualitySummary`, `answerMaturity` to `normalizePostReport`.
- `src/lib/copy-format.ts` — Added `formatQualitySummary()` helper. Updated `formatPreCopyText` with "质量摘要" as first section and "临场差距诊断". Updated `formatPostCopyText` with "质量摘要" as first section and "版本差异诊断".
- `src/lib/markdown-export.ts` — Added `mdQualitySummary()` helper with maturity, missing info, and conflict notes rendering. Updated `formatPreMarkdown` with quality summary as first section, added gap claims and reordered sections. Updated `formatPostMarkdown` with quality summary as first section, added version claims and reordered sections.
- `src/features/pre-replay/pre-replay-result.tsx` — Added `QualitySummaryCard` component with maturity badge (L1-L5 color coded), evidence recall, safety status, top risk, and conflict notes. Reordered sections per P1 layout: summary → answer → risk → evidence → maturity → training. Added gapClaims section and answerMaturity detail section.
- `src/features/post-replay/post-replay-result.tsx` — Added same `QualitySummaryCard` component. Reordered sections per P1 layout. Added versionClaims section and answerMaturity detail section.
- `tests/test-functions.ts` — Added P1 test section for assessMaturity (L1/L3/L5), normalizer P1 field preservation, copy/markdown P1 section presence, and fixture validation (5 quality fixtures).

### New
- `tests/fixtures/quality/motivation.json` — Motivation-type quality sample
- `tests/fixtures/quality/project_intro.json` — Project intro-type quality sample
- `tests/fixtures/quality/contribution_boundary.json` — Contribution boundary-type quality sample
- `tests/fixtures/quality/pressure_question.json` — Pressure question-type quality sample
- `tests/fixtures/quality/future_plan.json` — Future plan-type quality sample

## Reason

Implemented Quality Opt P1 per `GUIDES/8-CodePlanOfQualityOpt.md` §5–§15. Core additions on top of P0:
1. **Answer Maturity L1-L5**: Pure-function assessment based on evidence recall, evidence claims, pressure tests, and verification
2. **Quality Summary**: One-sentence diagnosis, top risk, top missing info, evidence recall text, answer safety, maturity, conflict notes
3. **Lightweight conflict rules**: Verifier high severity > Professor pressureTests > Evidence missingInfo > Synthesizer riskControls; safety over maturity
4. **Gap Agent gapClaims**: Each live loss claim now requires evidence card references or missing info
5. **Diff Agent versionClaims**: Per-version analysis of evidence addition, risk introduction, oral friendliness, follow-up handling
6. **Layered report display**: Summary card at top → safe answer → risks → evidence → maturity → training → trace
7. **Training Planner enhanced**: Uses topRisk, safety status, maturity level to generate trigger-reason-based next question recommendations and maturity-appropriate formulas
8. **5 static quality fixtures**: Motivation, project intro, contribution boundary, pressure question, future plan with expected risks and forbidden phrases

## Git Status Summary

All changes are in the ai-interview-replay/ subproject working tree (uncommitted, layered on top of prior Quality Opt P0 uncommitted changes):

```
M  src/types/replay.ts
M  src/lib/agents/types.ts
M  src/lib/agents/gap-agent.ts
M  src/lib/agents/diff-agent.ts
M  src/lib/agents/composer.ts
M  src/lib/agents/training-agent.ts
M  src/lib/agents/runner.ts
M  src/lib/ai/report-normalizer.ts
M  src/lib/copy-format.ts
M  src/lib/markdown-export.ts
M  src/features/pre-replay/pre-replay-result.tsx
M  src/features/post-replay/post-replay-result.tsx
M  tests/test-functions.ts
?? tests/fixtures/quality/
```

## Suggested Commit

- Files: All modified + new files listed above (combined with prior Quality Opt P0 work) + this handoff
- Message: `implement Quality Opt P1: diagnostic layering, maturity assessment, conflict rules, and quality fixtures`

## Completed

- `AnswerMaturity` type (L1-L5) and `QualitySummary` type in both type files
- `assessMaturity()` pure function with 5-level maturity assessment
- `buildQualitySummary()` pure function aggregating cross-Agent data
- `resolveConflicts()` deterministic conflict rules
- `gapClaims` output from Gap Agent with evidence binding in prompt and normalizer
- `versionClaims` output from Diff Agent with per-version evidence/risk/oral/follow-up analysis in prompt and normalizer
- Composer generates qualitySummary and maturity, passes to report
- Training Planner enhanced with qualitySummary/maturity/verification context
- Runner builds qualitySummary + maturity after verifier, before training; passes to both
- Frontend: QualitySummaryCard with color-coded maturity badge, layered section ordering
- Frontend: Gap claims, version claims, and maturity detail sections
- Copy/Markdown: Quality summary as first section, gap/version claims sections
- Report normalizer: All new fields with safe defaults
- 5 static quality fixtures (motivation, project_intro, contribution_boundary, pressure_question, future_plan)
- Updated test assertions (gapClaims, versionClaims, qualitySummary, answerMaturity, copy/markdown P1 sections, fixture validation)
- `npx tsc --noEmit`: PASSED (zero errors)

## Not Completed

- Full browser integration test of new frontend components (QualitySummaryCard, maturity badge, gap/version claims, layered ordering)
- API integration tests with real LLM key (require dev server + LLM API key)
- Complex collapsible UI for report layers (currently uses section-based ordering, not accordion-style collapse)
- Free-text maturity label showing "当前可训练层级" rather than "评分" — implemented in code as per plan

## Verified

- `npx tsc --noEmit`: PASSED (zero errors)
- Code review: All P1 fields wired through types → agents → runner → composer → frontend → copy/markdown → normalizers

## Not Verified

- Unit test execution (tsx/node esbuild spawn issue in current environment; test source code logically reviewed but not runtime-executed in this session)
- Browser rendering of new QualitySummaryCard, maturity badge, gap/version claims, layered ordering
- End-to-end API flow with real LLM (qualitySummary generation, maturity assessment, training with qualitySummary context)
- Copy/Markdown format with real report data containing qualitySummary and maturity

## Known Issues

- `assessMaturity` uses Chinese keyword matching for contribution clarity detection (`dangerReason.includes("贡献")` etc.) — if LLM outputs English danger reasons, contribution may be incorrectly assessed as "clear". Acceptable for Chinese-only UI.
- Quality summary topMissingInfo is deduplicated by `slice(0,3)` only — no semantic dedup across Agent outputs.
- Conflict resolution is display-only (conflictNotes array in qualitySummary) — no automatic compositing or round-trip Agent re-run.
- Training Planner prompt now includes qualitySummary/maturity data which slightly increases prompt length (~200 chars extra).

## Next Notes

- Run full integration test: `node tests/test-functions.ts` (with tsx) to verify all 104+ assertions pass
- Run API integration tests: `node tests/test-api.mjs` (requires dev server + real LLM key)
- Test browser: verify QualitySummaryCard renders on pre/post result pages; maturity badge shows correct color; gap/version claims populate correctly; section order matches plan
- Verify training agent generates maturity-aware next question with trigger reason
- The next natural step after Quality Opt P1 is FrontendOptimizationPlan (homepage workbench, step guidance, loading stages, report summary cards) — OR deployment & demo preparation per STRAT_HERE.md timeline (§14:00-24:00)
- Do not run git add/commit/push unless explicitly requested

## Env / Dependencies / Deployment Changes

- No new dependencies
- No env var changes
- No deployment command changes
- Slightly longer prompt in Training Agent (+qualitySummary/maturity context)
