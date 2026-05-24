# Handoff: reframe update P0 as multi agent

## Tool

- Codex

## Changed Files

- `ai-interview-replay/GUIDES/UpdatePlan.md`: reframed P0 from a single structured LLM response into a real lightweight multi-Agent diagnostic chain; reframed P1 as multi-Agent explainability, parallelism, and robustness enhancements.
- `ai-interview-replay/GUIDES/5-CodePlanOfUpdataP0.md`: rewrote the implementation plan to use an internal lightweight Agent Runner with independent role prompts, independent LLM calls, agent outputs, and a Composer.
- `ai-interview-replay/GUIDES/README.md`: updated the guide index description for `5-CodePlanOfUpdataP0.md` to reflect the multi-Agent implementation direction.
- `docs/handoffs/2026-05-24_12-29-01_reframe_update_p0_as_multi_agent.md`: this handoff.

## Reason

- User clarified that the intended upgrade is a real multi-Agent / multi-role framework as described in `UpdatePlan.md` section 4, not a single LLM call that merely simulates multiple roles inside one prompt.
- The previous planning document conflicted with that intent by recommending a single-call architecture.

## Git Status Summary

- Current workspace already contains many modified/deleted/untracked files from previous sessions, especially P1 implementation files.
- This session modified planning documents only and added this handoff.
- No `git add`, `git commit`, or `git push` was run.

## Suggested Commit

- Files:
  - `ai-interview-replay/GUIDES/UpdatePlan.md`
  - `ai-interview-replay/GUIDES/5-CodePlanOfUpdataP0.md`
  - `ai-interview-replay/GUIDES/README.md`
  - `docs/handoffs/2026-05-24_12-29-01_reframe_update_p0_as_multi_agent.md`
- Message: `reframe update p0 as lightweight multi agent chain`

## Completed

- Clarified in `UpdatePlan.md` that:
  - structure is the output/product layer;
  - multi-Agent is the implementation layer;
  - P0 should implement a real lightweight multi-Agent chain.
- Defined P0 agent nodes:
  - Material Analyst Agent
  - Question Intent Agent
  - Evidence Mapper Agent
  - Skeptical Professor Agent
  - Gap / Diff Diagnoser Agent
  - Answer Synthesizer Agent
  - Training Planner Agent
  - Report Composer
- Defined P1 as:
  - agent execution trace display
  - partial parallelism
  - retry/fallback strategy
  - prompt version management
- Rewrote `5-CodePlanOfUpdataP0.md` to include:
  - target `src/lib/agents/` directory structure
  - individual agent input/output contracts
  - runner design
  - composer design
  - route migration plan
  - UI trace panel plan
  - copy/Markdown updates
  - tests and validation plan
  - risk controls

## Not Completed

- No runtime multi-Agent code was implemented.
- No tests, build, or browser validation were run.

## Verified

- Used `Select-String` to confirm the updated docs now mention real multi-Agent, Agent Runner, independent prompts, and multiple LLM calls.
- Ran `git status --short` after edits.

## Not Verified

- Did not run `npm run build`, lint, unit tests, API tests, or browser checks because this was documentation-only.
- Did not verify deployment.

## Known Issues

- `5-CodePlanOfUpdataP0.md` keeps the misspelling `Updata` because the user explicitly requested that filename.
- The multi-Agent P0 will increase LLM calls and latency. The plan recommends P0 sequential execution first, P1 parallel optimization later.
- Existing P1 code changes are still uncommitted and should not be overwritten during implementation.

## Next Notes

- Implement P0 by adding `src/lib/agents/` rather than trying to extend `buildPrePrompt` / `buildPostPrompt` into a larger single prompt.
- Keep external dependencies unchanged unless explicitly approved.
- When implementing, update tests to verify `agentTrace` and at least 5 agent outputs in API responses.

## Env / Dependencies / Deployment Changes

- No environment variable changes.
- No dependency changes.
- No deployment command changes.
