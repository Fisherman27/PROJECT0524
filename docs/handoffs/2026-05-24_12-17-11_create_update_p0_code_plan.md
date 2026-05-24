# Handoff: create update P0 code plan

## Tool

- Codex

## Changed Files

- `ai-interview-replay/GUIDES/5-CodePlanOfUpdataP0.md`: new implementation planning document for the upgraded P0 scope from `UpdatePlan.md`.
- `ai-interview-replay/GUIDES/README.md`: updated guide index to include `5-CodePlanOfUpdataP0.md` and corrected the P1 plan filename reference from `30CodePlanOfP1.md` to `3-CodePlanOfP1.md`.
- `docs/handoffs/2026-05-24_12-17-11_create_update_p0_code_plan.md`: this handoff.

## Reason

- User requested a very specific implementation plan for the upgraded P0 scope before code implementation.
- The plan needed to reflect the current working tree, including already-present P1 changes such as timers, dynamic answer versions, Markdown export, homepage shared background, file upload, and existing tests.

## Git Status Summary

- Current workspace already had many modified/deleted/untracked files from prior work, including P1 implementation files.
- This session intentionally added only the new plan file, updated the guide index, and added this handoff.
- No `git add`, `git commit`, or `git push` was run.

## Suggested Commit

- Files:
  - `ai-interview-replay/GUIDES/5-CodePlanOfUpdataP0.md`
  - `ai-interview-replay/GUIDES/README.md`
  - `docs/handoffs/2026-05-24_12-17-11_create_update_p0_code_plan.md`
- Message: `add upgraded p0 implementation plan`

## Completed

- Read current `UpdatePlan.md` and extracted the P0 upgrade scope:
  - material evidence bank
  - material recall
  - risk radar
  - replay card
  - lightweight authenticity guard
- Reviewed current code implementation across:
  - report types
  - prompt builders
  - report normalizers
  - copy formatter
  - Markdown exporter
  - pre/post result components
  - pre/post forms
  - replay API routes
  - tests
- Created a concrete code plan with:
  - current implementation inventory
  - target TypeScript types
  - exact file change map
  - prompt schema changes
  - normalizer strategy
  - UI component plan
  - copy/Markdown update plan
  - test update plan
  - implementation order
  - verification checklist
  - risks and controls
  - minimal fallback slice
- Updated `GUIDES/README.md` so future tools can discover the new plan.

## Not Completed

- No runtime code implementation for the upgraded P0 was done.
- No README feature documentation was updated beyond the guide index.

## Verified

- Read the beginning and section outline of `5-CodePlanOfUpdataP0.md` after creation.
- Ran `git status --short` to inspect the working tree.
- Read the latest visible handoff `2026-05-24_15-00-00_implement_p1_timer_versions_markdown.md` after it appeared in the workspace.

## Not Verified

- Did not run `npm run build`, lint, unit tests, API tests, or browser checks because this was a documentation-only planning change.
- Did not verify deployment.

## Known Issues

- The filename uses `Updata` because the user explicitly requested `5-CodePlanOfUpdataP0.md`.
- The working tree contains existing P1 changes and deleted scaffold files from prior sessions; this session did not reconcile or stage them.
- The upgraded P0 implementation still needs to be done.

## Next Notes

- Implement upgraded P0 in this order:
  1. report types
  2. normalizer fallbacks
  3. prompt schema
  4. copy/Markdown formatters
  5. shared report UI components
  6. pre/post result integration
  7. tests
  8. README and handoff
- Do not remove existing P1 files (`use-pre-answer-timer.ts`, `use-answer-versions.ts`, Markdown export files) while implementing the upgraded P0.
- Keep the upgrade single-call and no-database.

## Env / Dependencies / Deployment Changes

- No environment variable changes.
- No dependency changes.
- No deployment command changes.
