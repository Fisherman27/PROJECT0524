# Handoff: review update p0 multi agent code

## Tool

- Codex

## Changed Files

- `ai-interview-replay/src/lib/agents/json.ts`: wrapped Agent JSON parsing errors as `MODEL_RESPONSE_INVALID` so API routes return the intended model-format error instead of a generic server error.
- `ai-interview-replay/src/lib/agents/professor-agent.ts`: made risk radar normalization always return the six fixed P0 risk dimensions, even if the model omits or duplicates dimensions.
- `ai-interview-replay/src/components/agent-trace-panel.tsx`: displayed each Agent trace summary in the UI so the report better demonstrates multi-role diagnosis, not only timing dots.
- `ai-interview-replay/tests/test-api.mjs`: added assertions for P0 multi-Agent report fields: `evidenceCards`, `materialRecall`, `riskRadar`, `authenticityWarnings`, `replayCard`, and `agentTrace`.

## Reason

- Reviewed uncommitted runtime code against `UpdatePlan.md` P0 requirements.
- Confirmed the main replay APIs are now wired to a real lightweight multi-Agent chain.
- Fixed reliability and P0 acceptance gaps found during code review.

## Git Status Summary

- Modified runtime/API/report/test files remain unstaged.
- New multi-Agent files under `ai-interview-replay/src/lib/agents/` remain untracked.
- New report UI components remain untracked.
- Existing documentation changes under `GUIDES/` and earlier handoff files remain untracked/modified.

## Suggested Commit

- Files: all current `ai-interview-replay/src/**` multi-Agent code and report UI changes, `ai-interview-replay/tests/test-api.mjs`, plus relevant handoff files.
- Message: `implement and harden update p0 multi agent replay`

## Completed

- Verified code-level multi-Agent implementation:
  - `/api/replay/pre` calls `runPreReplayAgents`.
  - `/api/replay/post` calls `runPostReplayAgents`.
  - Runner orchestrates seven independent Agent functions for pre and post flows.
  - Each Agent file calls `callLLM` independently with its own prompt and structured JSON output.
  - Composer aggregates Agent outputs into `PreReplayReport` and `PostReplayReport`.
  - Frontend report pages display evidence cards, material recall, risk radar, authenticity warnings, replay card, and Agent trace.
- Fixed JSON parse error mapping.
- Fixed fixed-dimension risk radar normalization.
- Improved visible Agent trace summary.
- Updated API integration test expectations for the new P0 report shape.

## Not Completed

- Did not run real end-to-end replay API calls because they require a running dev server and a real LLM key, and each replay now triggers multiple model calls.
- Did not commit or stage files.
- Did not edit planning documents in this pass.

## Verified

- `npx.cmd tsc --noEmit`: passed.
- `npm.cmd run build`: passed.
- Build output lists routes:
  - `/`
  - `/pre`
  - `/post`
  - `/api/replay/pre`
  - `/api/replay/post`
  - `/api/questions`
  - `/api/parse-file`

## Not Verified

- `node tests/test-api.mjs`: not run because it requires dev server plus valid LLM API configuration and will perform several paid/slow model calls.
- Browser UI rendering after live API result: not verified in this pass.
- `npx.cmd tsx tests/test-functions.ts`: attempted earlier but blocked by npm cache/network permission while trying to fetch `tsx`; not used as final verification.

## Known Issues

- The multi-Agent replay flow is intentionally slower and more expensive than the previous single-call flow because each replay runs seven LLM calls.
- Agent failures still fail the whole replay request; partial degradation remains a P1 item.
- Existing `src/lib/ai/prompts.ts` legacy single-prompt builders still exist but are no longer used by the replay APIs.

## Next Notes

- If demo time is tight, keep the multi-Agent trace visible because it is the strongest proof that P0 is no longer a single prompt wrapper.
- Before final submission, run an actual `/api/replay/pre` or `/api/replay/post` call with a real key and record the latency.
- If the browser shows 404 on `localhost:3000`, verify it is running from `ai-interview-replay/`; build confirms the app has `/`, `/pre`, and `/post` routes.

## Env / Dependencies / Deployment Changes

- No dependency changes.
- No environment variable changes.
- No deployment command changes.
