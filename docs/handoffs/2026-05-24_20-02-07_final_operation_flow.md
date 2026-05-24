# Handoff: final operation flow document

## Tool

- Codex
- PowerShell read-only checks
- apply_patch documentation edit

## Changed Files

- `ai-interview-replay/GUIDES/FinalOperationFlow.md`: Added a flowchart-oriented operation flow document covering the complete user journey, pre-analysis stages, pre/post mode branches, final review Agent sequence, report display, cache reuse, error handling, and diagram drawing suggestions.
- `docs/handoffs/2026-05-24_20-02-07_final_operation_flow.md`: Added this handoff.

## Reason

- The user asked for another GUIDE document focused on the complete operation sequence, to use with a large model for drawing flowcharts.

## Git Status Summary

- The worktree already contained many uncommitted runtime and documentation changes before this task.
- This task intentionally added only:
  - `ai-interview-replay/GUIDES/FinalOperationFlow.md`
  - `docs/handoffs/2026-05-24_20-02-07_final_operation_flow.md`

## Suggested Commit

- Files:
  - `ai-interview-replay/GUIDES/FinalOperationFlow.md`
  - `docs/handoffs/2026-05-24_20-02-07_final_operation_flow.md`
- Message:
  - `document final operation flow`

## Completed

- Added a standalone operation-flow document for flowchart generation.
- Covered homepage material analysis, mode selection, pre-mode branch, post-mode branch, final review, report display, cache reuse, error handling, and Agent status display.

## Not Completed

- Did not modify runtime code.
- Did not update README, because this is a GUIDE-only documentation artifact.

## Verified

- Confirmed project workflow context and latest handoff before editing.
- The new document was authored to align with the previously reviewed routes and Agent runner flow.

## Not Verified

- Did not run build, tests, API calls, or browser checks because this is documentation-only.

## Known Issues

- The existing worktree still contains unrelated uncommitted code and documentation changes.
- Some existing files display mojibake in PowerShell due to terminal encoding, but this task did not modify runtime source files.

## Next Notes

- This document is best suited for a user journey flowchart or swimlane diagram.
- For system architecture diagrams, use `ai-interview-replay/GUIDES/FinalImplementationArchitecture.md`.

## Env / Dependencies / Deployment Changes

- No environment variable changes.
- No dependency changes.
- No deployment command changes.
