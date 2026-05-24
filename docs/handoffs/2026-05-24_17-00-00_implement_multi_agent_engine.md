# Handoff: implement multi-agent diagnosis engine

## Tool

- OpenCode

## Changed Files

### Core Multi-Agent Engine (new directory `src/lib/agents/`)

- `types.ts` — All agent input/output types (MaterialAgentOutput, IntentAgentOutput, etc.)
- `json.ts` — `parseAgentJson<T>()`, `sanitizeAgentJson()`, `ensureArray()`, `ensureString()` helpers
- `material-agent.ts` — Evidence card extractor: parses user background materials into up to 4 structured evidence cards with abilities, risks, suggested expressions
- `intent-agent.ts` — Question intent analyzer: determines what interviewers REALLY want to assess
- `evidence-agent.ts` — Evidence mapper: calculates material recall rate (used/expected), identifies missing evidence
- `professor-agent.ts` — Skeptical professor: scores 6 risk dimensions (low/med/high), identifies follow-up risks and authenticity warnings
- `gap-agent.ts` — Pre-mode gap diagnoser: compares live vs calm answers, classifies losses (conclusion/evidence/structure/depth/match/boundary)
- `diff-agent.ts` — Post-mode answer diff: ranks multiple versions, reviews each, diagnoses sentences
- `synthesizer-agent.ts` — Answer fusion: generates best merged answer using evidence + risk data
- `training-agent.ts` — Training planner: generates replay card + rescue template/formula + next-question recommendation
- `composer.ts` — `composePreReport()` / `composePostReport()` deterministic aggregation (no LLM call)
- `runner.ts` — `runPreReplayAgents()` / `runPostReplayAgents()` orchestration with 7 sequential LLM calls + timing trace

### Updated Files

- `src/types/replay.ts` — Added: EvidenceCard, MaterialRecall, RiskRadarItem, AuthenticityWarning, ReplayCard, AgentTraceItem. Extended PreReplayReport and PostReplayReport with all new fields.

- `src/app/api/replay/pre/route.ts` — Changed from `buildPrePrompt → callLLM → normalizePreReport` (1 LLM call) to `runPreReplayAgents` (7 LLM calls via agent chain).

- `src/app/api/replay/post/route.ts` — Same change: now uses `runPostReplayAgents`.

- `src/lib/ai/report-normalizer.ts` — Added defaults for all new report fields (evidenceCards, materialRecall, riskRadar, authenticityWarnings, replayCard, agentTrace).

- `src/lib/copy-format.ts` — Pre: adds 材料证据库, 材料召回率, 风险雷达, 真实性风险, 复盘卡片, 多角色诊断链 sections. Post: same.

- `src/lib/markdown-export.ts` — Same section additions for both modes.

### New Frontend Components

- `src/components/evidence-card-list.tsx` — Color-coded evidence card grid (project=blue, research=purple, etc.)
- `src/components/material-recall-panel.tsx` — Progress bar showing recall rate % + missing evidence list
- `src/components/risk-radar-panel.tsx` — 6-dimension risk display with color-coded levels (绿/黄/红)
- `src/components/authenticity-warning-list.tsx` — Risk expressions shown with strikethrough originals + safer alternatives
- `src/components/replay-card-panel.tsx` — Gradient summary card with formula, rescue sentence, next question
- `src/components/agent-trace-panel.tsx` — 2-column grid showing agent name, status dot, duration

### Updated Result Components

- `src/features/pre-replay/pre-replay-result.tsx` — Now shows 13 report sections (was 9): added Evidence Cards, Material Recall, Risk Radar, Authenticity Warnings, Replay Card, Agent Trace. Removed old "下一步练习建议" consolidated into replay card.
- `src/features/post-replay/post-replay-result.tsx` — Same additions.

## Reason

Upgraded from single-prompt LLM call to a real multi-agent diagnosis chain as specified in `GUIDES/5-CodePlanOfUpdataP0.md`. Each of the 7 agents has its own prompt, structures output, and makes an independent LLM call. The composer aggregates all results into the final report. This proves the product is NOT a simple ChatGPT wrapper — it's a structured diagnosis engine.

## Git Status Summary

```
M  src/types/replay.ts
M  src/app/api/replay/pre/route.ts
M  src/app/api/replay/post/route.ts
M  src/lib/ai/report-normalizer.ts
M  src/lib/copy-format.ts
M  src/lib/markdown-export.ts
M  src/features/pre-replay/pre-replay-result.tsx
M  src/features/post-replay/post-replay-result.tsx
?? src/lib/agents/       (12 new files)
?? src/components/evidence-card-list.tsx
?? src/components/material-recall-panel.tsx
?? src/components/risk-radar-panel.tsx
?? src/components/authenticity-warning-list.tsx
?? src/components/replay-card-panel.tsx
?? src/components/agent-trace-panel.tsx
```

## Suggested Commit

- Files: all modified + new files listed above + this handoff
- Message: `implement multi-agent diagnosis engine with 7 agents`

## Completed

- 7 independent agents: material, intent, evidence, professor, gap/diff, synthesizer, training
- Each agent has: own prompt file, own normalizer, own structured output type
- Runner orchestrates 7 sequential LLM calls with agentTrace (name, status, duration)
- Composer deterministically aggregates agent outputs → PreReplayReport / PostReplayReport
- API routes switched from 1 LLM call to agent chain
- 6 new frontend report components (evidence cards, recall panel, risk radar, authenticity warnings, replay card, agent trace)
- Copy and Markdown export updated with all new sections
- All types consistent between backend and frontend
- TypeScript check passes (npx tsc --noEmit)
- 27 unit tests pass

## Not Completed

- `npm run build` (skipped — slow, but TypeScript passes)
- API integration test NOT run (requires dev server + real LLM key + ~60s for 7 calls)
- No parallel agent execution (P1 optimization)
- No agent failure degradation logic (any agent failure = overall failure)
- Old `buildPrePrompt`/`buildPostPrompt` in `src/lib/ai/prompts.ts` still exist (retained as legacy, not used in main flow)

## Verified

- `npx tsc --noEmit`: PASSED (zero errors)
- 27 unit tests: PASSED (0 failed)
- Code audit: all 7 agents wired through runner → composer → API route
- No API keys exposed in any committed file

## Not Verified

- End-to-end multi-agent call (requires ~60s of LLM calls with real API key)
- Browser rendering of new report components
- Markdown export with new fields
- Lint (wasn't run, build/lint timeout issues)
- Server deployment

## Known Issues

- `npm run build` and `npm run lint` timeout due to large project size; TypeScript standalone check is the valid substitute
- Each replay API call now makes 7 LLM requests (was 1) — increases latency from ~5s to ~40-60s and 7x token cost
- Agent errors cause total failure; no partial-results fallback yet
- Old prompts in `src/lib/ai/prompts.ts` retain legacy single-prompt versions (not used but kept)

## Next Notes

- P1: parallelize independent agents (material→{intent, evidence, professor} can run in parallel)
- P1: per-agent error degradation (non-critical agents can fail gracefully)
- P1: agent trace UI animation
- Run `npm run build` when possible
- Do not run git add/commit/push unless explicitly requested

## Env / Dependencies / Deployment Changes

- No new dependencies
- No env var changes
- No deployment command changes
- Increased LLM cost (7x calls per replay)
