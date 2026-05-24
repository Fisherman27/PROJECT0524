# Handoff: fix agent pipeline resume during final review

## Tool

- Codex
- PowerShell read-only checks
- apply_patch code edits

## Changed Files

- `ai-interview-replay/src/components/agent-pipeline.tsx`: Updated sidebar pipeline animation so it can start from the first unfinished stage when existing pre-analysis traces are available.
- `ai-interview-replay/src/app/pre/page.tsx`: Passed existing material/question pre-analysis traces into the loading sidebar while final review is running.
- `ai-interview-replay/src/app/post/page.tsx`: Same loading sidebar fix for post-replay mode.
- `docs/handoffs/2026-05-24_19-45-44_fix_agent_pipeline_resume.md`: Added this handoff.

## Reason

- User reported that after clicking start review, the sidebar appeared to restart the full Agent flow from the first card.
- Code inspection showed the loading branch rendered `<AgentPipeline animating />` without existing pre-analysis traces, so the component could only simulate from the material stage.
- The backend runner may reuse pre-analysis correctly, but the sidebar UI did not reflect that during loading.

## Git Status Summary

Current worktree already contains many uncommitted Quality Opt P1 and documentation changes from earlier work. This task only intentionally changed:

```text
ai-interview-replay/src/components/agent-pipeline.tsx
ai-interview-replay/src/app/pre/page.tsx
ai-interview-replay/src/app/post/page.tsx
docs/handoffs/2026-05-24_19-45-44_fix_agent_pipeline_resume.md
```

Relevant existing uncommitted files were left untouched.

## Suggested Commit

- Files:
  - `ai-interview-replay/src/components/agent-pipeline.tsx`
  - `ai-interview-replay/src/app/pre/page.tsx`
  - `ai-interview-replay/src/app/post/page.tsx`
  - `docs/handoffs/2026-05-24_19-45-44_fix_agent_pipeline_resume.md`
- Message:
  - `fix agent pipeline loading resume from pre-analysis`

## Completed

- Loading sidebar now receives `getPreAnalysisTraces()` in both pre and post review pages.
- `AgentPipeline` now computes the initial animated stage from existing traces.
- If material and question pre-analysis traces exist, the sidebar keeps those cards completed/cached and begins status animation from the diagnosis stage.
- If only material analysis exists, question cards become the next running stage.
- If no pre-analysis exists, behavior remains the old full animation from material stage.

## Not Completed

- Did not change backend runner logic.
- Did not add automated tests.
- Did not visually test in browser.

## Verified

- Reviewed targeted diff for the three changed runtime files.
- Checked that `agent-pipeline.tsx` no longer contains the accidental mojibake introduced during editing and that the diff only contains intended logic changes.

## Not Verified

- Did not run `npm run build`, `npx tsc --noEmit`, unit tests, API tests, or browser tests per the user's recent preference to avoid build/test runs and rely on code inspection.

## Known Issues

- The sidebar is still a visual progress indicator; during final report generation it does not stream actual live backend Agent completion events. It preserves completed pre-analysis state and simulates the remaining stage progression until the final report trace arrives.
- Existing uncommitted Quality Opt P1 files remain in the worktree.

## Next Notes

- Manual test path:
  1. On homepage, run material analysis.
  2. Enter pre or post mode and wait until question analysis finishes.
  3. Click final review.
  4. Confirm the first three sidebar cards do not reset to pending/running from zero; the remaining diagnosis/synthesis/training cards should progress.

## Env / Dependencies / Deployment Changes

- No environment variable changes.
- No dependency changes.
- No deployment command changes.
