# Handoff: add quality optimization code plan

## Tool

- Codex

## Changed Files

- `ai-interview-replay/GUIDES/8-CodePlanOfQualityOpt.md`: added a detailed code implementation plan for quality optimization based on `7-QualityOptimizationPlan.md` and the current P0/P1 multi-Agent code state.
- `ai-interview-replay/GUIDES/README.md`: added `7-QualityOptimizationPlan.md` and `8-CodePlanOfQualityOpt.md` to the guide index.

## Reason

- User asked to read `7-QualityOptimizationPlan.md`, analyze feasibility against the current code completion state, and produce a complete, detailed `8-CodePlanOfQualityOpt.md`.

## Git Status Summary

- Guide docs changed/added.
- `ai-interview-replay/src/app/api/parse-file/route.ts` is modified in the working tree but was not touched by this task.
- No git add/commit/push was run.

## Suggested Commit

- Files:
  - `ai-interview-replay/GUIDES/7-QualityOptimizationPlan.md`
  - `ai-interview-replay/GUIDES/8-CodePlanOfQualityOpt.md`
  - `ai-interview-replay/GUIDES/README.md`
  - this handoff file
- Message: `add quality optimization implementation plan`

## Completed

- Read the quality optimization guide and current P0/P1 staged Agent implementation.
- Assessed feasibility:
  - high feasibility for evidence references, professor pressure tests, safe answer output, Verifier Agent, and report display;
  - medium feasibility for maturity levels, conflict-resolution display, and broader confidence/missing-info rollout;
  - lower priority for full automated evaluation platforms or multi-round verifier loops.
- Added a detailed implementation plan covering:
  - type changes;
  - Agent prompt and normalizer changes;
  - new Verifier Agent;
  - runner and composer changes;
  - frontend result components;
  - copy/Markdown changes;
  - tests and fixtures;
  - implementation order;
  - risks and acceptance criteria.

## Not Completed

- No runtime code implementation was done.
- No tests or build were run.

## Verified

- Used `rg` and `Get-Content` to confirm `8-CodePlanOfQualityOpt.md` contains the expected sections and `GUIDES/README.md` references the new quality documents.

## Not Verified

- Build/test not run because this task changed planning documents only.

## Known Issues

- `ai-interview-replay/src/app/api/parse-file/route.ts` remains modified from another change and was not inspected in this task.
- `7-QualityOptimizationPlan.md`, `FrontendOptimizationPlan.md`, and `ProductEvolution.md` remain untracked as of this handoff.

## Next Notes

- If implementing this plan, start with stable evidence card IDs and evidence references before adding Verifier. The Verifier depends on reliable evidence references to be useful.
- Keep Verifier as a single extra LLM call and avoid multi-round self-correction in this project stage.
- Preserve backwards compatibility with current report fields so existing UI and copy/export do not break.

## Env / Dependencies / Deployment Changes

- No environment variable changes.
- No dependency changes.
- No deployment command changes.
