# 2026-05-24 17:33:08 调整质量优化 P0/P1 规划

## 本次使用的工具

- Codex
- PowerShell 只读检查
- apply_patch 文档修改

## 修改了哪些文件

- `ai-interview-replay/GUIDES/8-CodePlanOfQualityOpt.md`
- `docs/handoffs/2026-05-24_17-33-08_adjust_quality_opt_p0_p1.md`

## 为什么修改

用户要求把 `8-CodePlanOfQualityOpt.md` 中的质量优化方案调整为后续两阶段代码实现指南：

- 给“可行性评估”中的建议标清 P0/P1。
- 舍弃原先“暂不建议做”的内容，不让它进入 P0/P1 实现任务。
- 仍然保持与 `7-QualityOptimizationPlan.md` 的质量优化方向一致。

## Git 状态摘要

本次只修改了质量优化规划文档并新增本交接记录。接手前工作区已经存在多项未提交改动，本次没有处理或回退这些改动。

当前 `git status --short` 中可见的既有改动包括：

```text
 M ai-interview-replay/GUIDES/README.md
 M ai-interview-replay/next.config.ts
 M ai-interview-replay/src/app/api/parse-file/route.ts
 M ai-interview-replay/src/app/page.tsx
 M ai-interview-replay/src/components/agent-pipeline.tsx
 M ai-interview-replay/src/components/material-file-manager.tsx
 M ai-interview-replay/src/lib/agents/material-agent.ts
?? ai-interview-replay/GUIDES/7-QualityOptimizationPlan.md
?? ai-interview-replay/GUIDES/8-CodePlanOfQualityOpt.md
?? ai-interview-replay/GUIDES/FrontendOptimizationPlan.md
?? ai-interview-replay/GUIDES/ProductEvolution.md
?? docs/handoffs/2026-05-24_17-14-57_add_quality_optimization_code_plan.md
```

本交接文件新增后，`docs/handoffs/2026-05-24_17-33-08_adjust_quality_opt_p0_p1.md` 也应出现在未跟踪文件中。

## 建议提交文件和 commit message

建议提交文件：

```text
ai-interview-replay/GUIDES/8-CodePlanOfQualityOpt.md
docs/handoffs/2026-05-24_17-33-08_adjust_quality_opt_p0_p1.md
```

建议 commit message：

```text
refine quality optimization p0 p1 plan
```

## 已完成内容

- 将 `8-CodePlanOfQualityOpt.md` 重构为 Quality Opt P0 / Quality Opt P1 两阶段实现计划。
- 在可行性评估中明确：
  - P0：证据驱动与安全回答闭环。
  - P1：诊断分层、置信度扩展与训练建议增强。
- 将原“暂不建议做”的复杂能力从 P0/P1 代码任务中剔除，只作为“不纳入两阶段实现”的范围说明。
- 对类型、Agent、Runner、Composer、前端、Copy/Markdown、测试、实现顺序和验收标准分别拆分 P0/P1。

## 未完成内容

- 未实现任何代码功能。
- 未修改 `7-QualityOptimizationPlan.md`。
- 未修改 `GUIDES/README.md`。

## 实际验证结果

- 使用 `Select-String` 检查文档中已出现 `Quality Opt P0`、`Quality Opt P1`、`不纳入两阶段实现的内容` 等关键结构。
- 使用 `git status --short` 查看当前工作区状态。

## 未验证内容和原因

- 未运行 `npm run build`，因为本次只调整 Markdown 规划文档，没有修改运行时代码。
- 未运行 API 测试，原因同上。

## 已知问题

- 工作区已有多项未提交代码和文档改动，不属于本次修改范围。
- `ai-interview-replay/GUIDES/8-CodePlanOfQualityOpt.md` 当前在 Git 中仍显示为未跟踪文件，具体是否提交由用户决定。

## 下一位工具或人需要注意什么

- 后续实现 Quality Opt P0 时，应以 `8-CodePlanOfQualityOpt.md` 的 P0 范围为准，先做证据 ID、证据引用、压力测试、安全回答和 Verifier。
- 不要把“不纳入两阶段实现”的内容重新加入近期代码任务。
- 如果开始代码实现，完成后仍需新增 handoff，并明确实际运行过哪些验证。

## 是否涉及环境变量、依赖、部署命令变化

- 不涉及环境变量变化。
- 不涉及依赖变化。
- 不涉及部署命令变化。
