# 2026-05-24 18:31:08 实现 Quality Opt P0

## 本次使用的工具

- Codex
- PowerShell 只读检查
- apply_patch 代码修改

## 修改了哪些文件

### 新增文件

- `ai-interview-replay/src/lib/agents/quality-normalizers.ts`
- `ai-interview-replay/src/lib/agents/verifier-agent.ts`
- `ai-interview-replay/src/components/evidence-claim-list.tsx`
- `ai-interview-replay/src/components/professor-pressure-test-list.tsx`
- `ai-interview-replay/src/components/safe-answer-panel.tsx`
- `ai-interview-replay/src/components/answer-verification-panel.tsx`
- `docs/handoffs/2026-05-24_18-31-08_implement_quality_opt_p0.md`

### 修改文件

- `ai-interview-replay/src/types/replay.ts`
- `ai-interview-replay/src/lib/agents/types.ts`
- `ai-interview-replay/src/lib/agents/material-agent.ts`
- `ai-interview-replay/src/lib/agents/evidence-planner-agent.ts`
- `ai-interview-replay/src/lib/agents/evidence-agent.ts`
- `ai-interview-replay/src/lib/agents/professor-agent.ts`
- `ai-interview-replay/src/lib/agents/synthesizer-agent.ts`
- `ai-interview-replay/src/lib/agents/runner.ts`
- `ai-interview-replay/src/lib/agents/composer.ts`
- `ai-interview-replay/src/lib/ai/report-normalizer.ts`
- `ai-interview-replay/src/features/pre-replay/pre-replay-result.tsx`
- `ai-interview-replay/src/features/post-replay/post-replay-result.tsx`
- `ai-interview-replay/src/lib/copy-format.ts`
- `ai-interview-replay/src/lib/markdown-export.ts`
- `ai-interview-replay/tests/test-functions.ts`
- `ai-interview-replay/tests/test-api.mjs`

## 为什么修改

根据 `GUIDES/7-QualityOptimizationPlan.md` 和 `GUIDES/8-CodePlanOfQualityOpt.md`，实现质量提升计划 P0：证据驱动与安全回答闭环。

核心目标：

- 关键诊断结论能绑定证据卡、信息缺口和置信度。
- Professor 从风险标签升级为导师压力测试。
- Synthesizer 输出 30 秒 / 60 秒安全回答。
- 新增 Verifier Agent，对最终回答做单轮安全校验。
- 最终报告、复制文本和 Markdown 能展示 P0 质量优化结果。

## Git 状态摘要

当前 `git status --short` 显示本轮质量优化相关文件已经出现在 Git 状态中。注意：本轮没有主动执行 `git add`、`git commit`、`git push`。

执行只读检查时看到的状态摘要包括：

```text
A  ai-interview-replay/src/components/answer-verification-panel.tsx
A  ai-interview-replay/src/components/evidence-claim-list.tsx
A  ai-interview-replay/src/components/professor-pressure-test-list.tsx
A  ai-interview-replay/src/components/safe-answer-panel.tsx
M  ai-interview-replay/src/features/post-replay/post-replay-result.tsx
M  ai-interview-replay/src/features/pre-replay/pre-replay-result.tsx
M  ai-interview-replay/src/lib/agents/composer.ts
M  ai-interview-replay/src/lib/agents/evidence-agent.ts
M  ai-interview-replay/src/lib/agents/evidence-planner-agent.ts
M  ai-interview-replay/src/lib/agents/material-agent.ts
M  ai-interview-replay/src/lib/agents/professor-agent.ts
A  ai-interview-replay/src/lib/agents/quality-normalizers.ts
M  ai-interview-replay/src/lib/agents/runner.ts
M  ai-interview-replay/src/lib/agents/synthesizer-agent.ts
M  ai-interview-replay/src/lib/agents/types.ts
A  ai-interview-replay/src/lib/agents/verifier-agent.ts
M  ai-interview-replay/src/lib/ai/report-normalizer.ts
M  ai-interview-replay/src/lib/copy-format.ts
M  ai-interview-replay/src/lib/markdown-export.ts
M  ai-interview-replay/src/types/replay.ts
M  ai-interview-replay/tests/test-api.mjs
M  ai-interview-replay/tests/test-functions.ts
```

另外，工作区仍有此前已有的规划文档改动，例如 `7-QualityOptimizationPlan.md`、`8-CodePlanOfQualityOpt.md`、`FrontendOptimizationPlan.md`、`ProductEvolution.md`。

## 建议提交文件和 commit message

建议提交文件：

```text
ai-interview-replay/src/types/replay.ts
ai-interview-replay/src/lib/agents/*
ai-interview-replay/src/lib/ai/report-normalizer.ts
ai-interview-replay/src/features/pre-replay/pre-replay-result.tsx
ai-interview-replay/src/features/post-replay/post-replay-result.tsx
ai-interview-replay/src/components/evidence-claim-list.tsx
ai-interview-replay/src/components/professor-pressure-test-list.tsx
ai-interview-replay/src/components/safe-answer-panel.tsx
ai-interview-replay/src/components/answer-verification-panel.tsx
ai-interview-replay/src/lib/copy-format.ts
ai-interview-replay/src/lib/markdown-export.ts
ai-interview-replay/tests/test-functions.ts
ai-interview-replay/tests/test-api.mjs
docs/handoffs/2026-05-24_18-31-08_implement_quality_opt_p0.md
```

建议 commit message：

```text
implement quality optimization p0
```

## 已完成内容

- `EvidenceCard` 增加稳定 `id` 和 `missingInfo`。
- 新增 `EvidenceReference`、`MissingInfoItem`、`DiagnosisClaim`、`ProfessorPressureTest`、`SafeAnswerOutput`、`AnswerVerification` 类型。
- Material Agent prompt/normalizer 支持证据卡稳定 ID。
- Evidence Planner 输出 `evidenceCardId`。
- Evidence Mapper 输出 `evidenceClaims`。
- Professor 输出 `pressureTests`。
- Synthesizer 输出 `safeAnswer`，保留兼容字段 `bestMergedAnswer`。
- 新增 Verifier Agent，单轮检查最终回答是否编造、夸大、答偏或不可承接。
- Runner 在 Synthesizer 后接入 Verifier，并在 Verifier 失败时降级保留融合回答。
- Composer 聚合 `evidenceClaims`、`pressureTests`、`safeAnswer`、`answerVerification`，并在有 `revisedAnswer` 时采用安全修正版。
- 前端报告页展示证据依据、导师压力测试、安全融合回答、回答安全校验。
- Copy 和 Markdown 导出新增 P0 质量优化章节。
- 测试文件增加 P0 新字段断言。

## 未完成内容

- 未实现 Quality Opt P1。
- 未做浏览器手动验证，用户表示会手动测试。
- 未运行 live API 集成测试。
- 未验证真实 LLM 输出是否稳定满足新 JSON 结构。

## 实际验证结果

- `npx.cmd tsc --noEmit`：通过。
- `npm.cmd run build`：在用户要求停止测试前已经执行并通过。
- 后续用户明确表示不用再测试，因此没有继续执行测试命令。
- 代码层面只读检查了字段链路：types、Agent outputs、runner、composer、result components、copy/markdown、test assertions 的字段名一致。

## 未验证内容和原因

- 未继续运行 `npx tsx tests/test-functions.ts`：第一次尝试时因为本地没有 `tsx`，`npx` 试图访问 npm registry/cache 并因权限失败；随后用户表示不用再测试。
- 未运行 `tests/test-api.mjs`：需要 dev server 和真实 LLM key，用户表示会手动测试。
- 未做浏览器点击验证：用户会手动测试。

## 已知问题

- P0 新 JSON 字段更复杂，真实 LLM 输出可能偶尔缺字段；已通过 normalizer 做兜底，但真实效果需要手动测试观察。
- Verifier 会新增一次 LLM 调用，最终报告耗时和 token 成本会增加。
- Verifier 当前是单轮校验，不做多轮修正，符合 P0 规划。
- 如果 Verifier 失败，报告会保留 Synthesizer 原始安全回答并记录失败 trace。

## 下一位工具或人需要注意什么

- 手动测试重点：
  - 首页材料分析后证据卡是否带 `card_1` 等稳定 ID。
  - 问题规划结果是否包含 `evidenceCardId`。
  - 最终报告是否出现“证据依据”“导师压力测试”“安全融合回答”“回答安全校验”。
  - Verifier 失败时报告是否仍能正常显示。
  - 复制文本和 Markdown 是否包含质量优化章节。
- 如果真实 LLM 输出质量不稳定，优先微调对应 Agent prompt，不要引入复杂外部 Agent 框架。

## 是否涉及环境变量、依赖、部署命令变化

- 不涉及环境变量变化。
- 不涉及依赖变化。
- 不涉及部署命令变化。
