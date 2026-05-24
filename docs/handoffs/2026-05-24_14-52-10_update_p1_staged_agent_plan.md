# Handoff: update p1 staged agent plan

## Tool

- Codex

## Changed Files

- `ai-interview-replay/GUIDES/UpdatePlan.md`: rewrote P1 from simple Agent parallelism into staged Agent pre-analysis plus parallel diagnosis.
- `ai-interview-replay/GUIDES/6-CodePlanOfUpdateP1.md`: added concrete P1 code implementation plan for staged material analysis, question planning, replay-time diagnosis, fallback, types, API routes, frontend state, and tests.
- `ai-interview-replay/GUIDES/README.md`: added the new P1 code plan to the guide index.

## Reason

- User pointed out that material analysis should not wait until final report submission.
- P1 should improve product interaction, not only reduce backend latency with `Promise.all`.
- The new plan makes Agent work start at the earliest valid product stage:
  - material stage,
  - question stage,
  - answer diagnosis stage,
  - final synthesis/training stage.

## Git Status Summary

- Existing runtime code changes remain in the working tree and were not modified in this task.
- New/modified guide files remain unstaged.
- No git add/commit/push was run.

## Suggested Commit

- Files:
  - `ai-interview-replay/GUIDES/UpdatePlan.md`
  - `ai-interview-replay/GUIDES/6-CodePlanOfUpdateP1.md`
  - `ai-interview-replay/GUIDES/README.md`
  - this handoff file
- Message: `plan staged agent preanalysis for update p1`

## Completed

- Updated `UpdatePlan.md` P1 to define:
  - background material confirmation triggering Material Analyst;
  - question confirmation triggering Question Intent and Evidence Planner;
  - final answer submission triggering Evidence Mapper, Professor, and Gap/Diff diagnosis;
  - Agent timeline, prompt versioning, and fallback behavior.
- Added detailed implementation plan with:
  - new APIs `/api/agents/material` and `/api/agents/question-plan`;
  - new `Evidence Planner Agent`;
  - pre-analysis types and fingerprints;
  - localStorage-based frontend caching;
  - replay API fallback when pre-analysis is missing or stale;
  - validation and build/test plan.

## Not Completed

- No runtime code implementation was done in this task.
- Did not modify API routes or React components.

## Verified

- Read back relevant sections with `rg` and `Get-Content`.
- Confirmed `UpdatePlan.md`, `6-CodePlanOfUpdateP1.md`, and `GUIDES/README.md` reference the new staged P1 plan.

## Not Verified

- Build/test not run because this task changed planning documents only.

## Known Issues

- `GUIDES/` now contains both `6-CodePlanOfUpdateP1.md` and `6-ProductEvolution.md`; this is intentional because the user requested the exact P1 code plan filename, while `6-ProductEvolution.md` already existed as a presentation document.
- Several runtime code files were already modified before this task; they were intentionally not touched.

## Next Notes

- When implementing this P1 plan, inspect current changes in `src/app/page.tsx` and `src/lib/interview-context.ts` first because they are already modified in the working tree.
- Do not treat frontend-provided pre-analysis as trusted; use fingerprint validation and backend fallback.
- Keep API keys server-only.

## Env / Dependencies / Deployment Changes

- No environment variable changes.
- No dependency changes.
- No deployment command changes.
