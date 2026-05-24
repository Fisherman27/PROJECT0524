# Handoff: collapsible report layout

## Tool

- OpenCode

## Changed Files

### Modified
- `ai-interview-replay/src/components/report-section.tsx` — Added `collapsible`, `defaultOpen`, `badge` props. Collapsible sections show a chevron toggle and animate open/close. Non-collapsible sections keep original behavior. Added `useState` import.
- `ai-interview-replay/src/features/pre-replay/pre-replay-result.tsx` — Full layout restructure: grouped sections into 5 logical tiers (摘要 always visible → 风险诊断 default open → 证据与分析 default closed → 训练与复盘 default open → 技术详情 default closed). Added `countItems` helper for group badge counts. QualitySummaryCard + SafeAnswer always visible at top.
- `ai-interview-replay/src/features/post-replay/post-replay-result.tsx` — Same restructure as pre mode, plus 版本对比 group for version comparison content.

## Reason

User feedback: the report page had too much visible text at once, and the vertical stacking lacked structure. Solution:
1. All sections made collapsible with chevron toggle via `ReportSection`
2. Content grouped into logical tiers: 摘要 → 风险 → 证据/版本对比 → 训练 → 技术详情
3. Important content (summary, safe answer, risk diagnosis, training) default-open; detailed evidence and technical info default-closed
4. Group headers show item count badges for quick scanning
5. Inner sections within groups independently collapsible

## Git Status Summary

```
 M ai-interview-replay/src/components/report-section.tsx
 M ai-interview-replay/src/features/pre-replay/pre-replay-result.tsx
 M ai-interview-replay/src/features/post-replay/post-replay-result.tsx
```

## Suggested Commit

- Files: above 3 files + this handoff
- Message: `add collapsible report sections with grouped layout`

## Completed

- `ReportSection`: `collapsible` prop with `useState` toggle, chevron icon, `badge` count display
- Pre result: 5-tier grouped layout with smart defaults (risk + training open, evidence + tech closed)
- Post result: 6-tier grouped layout (adds version comparison group)
- Group headers show item counts
- QualitySummaryCard + SafeAnswer always at top, always expanded
- Inner sub-sections independently collapsible within groups

## Verified

- `npx tsc --noEmit`: PASSED (zero errors)

## Not Verified

- Browser rendering of collapsible toggle interaction (click to expand/collapse)
- Visual appearance of nested borders (inner collapsible sections within outer groups)

## Known Issues

- Nested collapsible sections create double borders (parent group border + child section border) — intentional for visual clarity but may look busy; easy to tone down later
- No CSS animation for expand/collapse — simple show/hide via state toggle

## Next Notes

- Verify browser rendering: click chevrons to expand/collapse, check nested section ordering
- Can tune defaultOpen values per section after seeing real report data
