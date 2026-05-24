# Handoff: implement frontend lightweight optimization

## Tool

- OpenCode

## Changed Files

### New Files
- `ai-interview-replay/src/components/use-guide-panel.tsx` — Homepage usage guide panel (4-step flow)
- `ai-interview-replay/src/components/material-readiness-panel.tsx` — Material readiness checklist (keyword-based, no LLM)
- `ai-interview-replay/src/components/step-guide.tsx` — Step guide bar for pre/post pages
- `ai-interview-replay/src/components/report-reading-guide.tsx` — Report reading order hint + trust note
- `ai-interview-replay/src/lib/demo-data.ts` — Fictional demo interview context data

### Modified
- `ai-interview-replay/src/app/page.tsx` — Added UseGuidePanel, MaterialReadinessPanel, LoadDemo button, mode card fitFor/needs props
- `ai-interview-replay/src/components/mode-card.tsx` — Added optional `fitFor` and `needs` props
- `ai-interview-replay/src/components/loading-state.tsx` — Added optional `steps?: string[]` prop with bullet list display
- `ai-interview-replay/src/app/pre/page.tsx` — Added StepGuide, no-material-analysis warning, LoadingState with diagnostic steps
- `ai-interview-replay/src/app/post/page.tsx` — Added StepGuide, no-material-analysis warning, LoadingState with diagnostic steps
- `ai-interview-replay/src/features/pre-replay/pre-replay-form.tsx` — Updated placeholder text, added live-answer hint, updated calm-answer hint
- `ai-interview-replay/src/features/post-replay/post-replay-form.tsx` — Updated placeholder text, added version explanation
- `ai-interview-replay/src/features/pre-replay/pre-replay-result.tsx` — Added ReportReadingGuide (pre mode)
- `ai-interview-replay/src/features/post-replay/post-replay-result.tsx` — Added ReportReadingGuide (post mode)
- `docs/handoffs/2026-05-24_20-43-51_implement_frontend_lightweight_optimization.md` — This handoff

## Reason

Implemented lightweight frontend optimization per `GUIDES/FrontendOptimizationPlan.md` and `GUIDES/10-CodePlanOfFrontOpt.md`. Goals:
1. Help users understand the product flow on first sight
2. Provide step-by-step guidance without changing backend Agent flow
3. Enable quick demo via sample data
4. Make report reading order clear
5. Fill empty states and error prompts

All changes are frontend-only, no backend/API/Agent modifications.

## Git Status Summary

All changes are in the `ai-interview-replay/` subproject working tree:

```
 M ai-interview-replay/src/app/page.tsx
 M ai-interview-replay/src/app/pre/page.tsx
 M ai-interview-replay/src/app/post/page.tsx
 M ai-interview-replay/src/components/mode-card.tsx
 M ai-interview-replay/src/components/loading-state.tsx
 M ai-interview-replay/src/features/pre-replay/pre-replay-form.tsx
 M ai-interview-replay/src/features/post-replay/post-replay-form.tsx
 M ai-interview-replay/src/features/pre-replay/pre-replay-result.tsx
 M ai-interview-replay/src/features/post-replay/post-replay-result.tsx
?? ai-interview-replay/src/components/use-guide-panel.tsx
?? ai-interview-replay/src/components/material-readiness-panel.tsx
?? ai-interview-replay/src/components/step-guide.tsx
?? ai-interview-replay/src/components/report-reading-guide.tsx
?? ai-interview-replay/src/lib/demo-data.ts
```

Worktree still has uncommitted changes from prior Quality Opt P1, Update P1, and documentation tasks.

## Suggested Commit

- Files: all modified + new files listed above + this handoff
- Message: `implement frontend lightweight optimization: usage guide, demo data, step indicators, report reading tips`

## Completed

1. **UseGuidePanel** — 4-step flow on homepage: Fill materials → Analyze → Choose mode → Generate review
2. **MaterialReadinessPanel** — Keyword-based checklist (length, project keywords, contribution, direction, quantifiable results), shows "已覆盖/建议补充"
3. **StepGuide** — Pre page: Confirm question → Live answer → Calm rewrite → Generate review. Post page: Enter question → Add versions → Compare → Extract formula
4. **LoadDemo button** — Fills interviewType, targetDirection, targetSchool, backgroundMaterials with fictional content
5. **ModeCard fitFor/needs** — Pre: "适合：正式面试前... 你需要：一道问题 + 临场回答...". Post: "适合：真实面试后... 你需要：真实问题 + 至少两个回答版本"
6. **Material warning on pre/post** — Amber info bar when no materialAnalysis, with link back to homepage
7. **LoadingState steps** — Pre: 5-step diagnostic list. Post: 5-step diagnostic list. Old calls still work without steps
8. **Form placeholder improvements** — Pre: clearer question example, live-answer hint about real expression, calm-answer hint about evidence. Post: better question placeholder, version explanation
9. **ReportReadingGuide** — Reading order suggestion + trust note ("本报告由材料分析、问题意图、证据匹配...角色共同生成")
10. **Chinese curly quotes fix** — Replaced `\u201c\u201d` with `\u300c\u300d` in source to avoid TypeScript parsing conflicts

## Not Completed

- Browser rendering tests (did not visually check new components in browser)
- P1 items from FrontendOptimizationPlan (mobile layout, demo mode expansion, complete empty state pass)
- Complex active step tracking in StepGuide (static display only as planned)

## Verified

- `npx tsc --noEmit`: PASSED (zero errors)
- `npm run build`: PASSED (compiled successfully, all routes generated)

## Not Verified

- Browser rendering of UseGuidePanel, MaterialReadinessPanel, StepGuide, ReportReadingGuide
- LoadDemo button interaction (fills context fields, doesn't break analysis)
- LoadingState with steps visual appearance
- Pre/post material-warning bar with return link
- ReportReadingGuide rendering in both pre and post result pages

## Known Issues

- MaterialReadinessPanel keyword matching is simplistic (no semantic understanding) — intentional per plan, should not be called "scoring"
- StepGuide has no active state detection — first version is static only per plan
- Demo data button does not confirm before overwriting user input — intentional per plan to reduce interaction complexity
- Old LoadingState calls (without steps) still show the former "大模型正在处理，请稍候" fallback text

## Next Notes

- The next natural step is deployment preparation, browser integration testing, or remaining P1 frontend items (mobile layout, demo mode expansion)
- Do not run git add/commit/push unless explicitly requested
- All new components are pure display, no state management, no API calls — safe to deploy

## Env / Dependencies / Deployment Changes

- No environment variable changes
- No dependency changes
- No deployment command changes
- No backend, API route, or Agent modifications
