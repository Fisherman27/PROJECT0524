# 2026-05-24 18:00:23 修复侧边栏 Agent 状态显示

## 本次使用的工具

- Codex
- PowerShell 只读检查
- apply_patch 代码修改

## 修改了哪些文件

- `ai-interview-replay/src/components/agent-pipeline.tsx`
- `ai-interview-replay/src/app/pre/page.tsx`
- `ai-interview-replay/src/app/post/page.tsx`
- `docs/handoffs/2026-05-24_18-00-23_fix_agent_pipeline_status.md`

## 为什么修改

用户反馈侧边栏 Agent 状态和真实流程不一致：

- 首页点击“分析材料”时，侧边栏像是整条 Agent 链都执行了一遍。
- 进入复盘模式后，已经完成的材料分析没有在侧边栏体现。
- 问题分析完成后，表单提示已完成，但侧边栏仍然显示待命。

检查后确认：侧边栏组件同时支持真实 `agentTrace` 和模拟动画，但表单阶段没有把材料预分析、问题预分析的真实状态传给侧边栏；首页材料分析动画已经传入 `maxStage="material"`，但该能力此前不完整，容易造成“整条链都在跑”的错觉。

## Git 状态摘要

本次只修改侧边栏状态相关代码并新增本交接记录。接手前工作区已有多项未提交改动，本次没有回退或处理无关改动。

当前工作区仍包含其他既有改动，例如：

```text
 M ai-interview-replay/GUIDES/README.md
 M ai-interview-replay/next.config.ts
 M ai-interview-replay/src/app/api/parse-file/route.ts
 M ai-interview-replay/src/app/layout.tsx
 M ai-interview-replay/src/app/page.tsx
 M ai-interview-replay/src/components/material-file-manager.tsx
 M ai-interview-replay/src/lib/agents/material-agent.ts
?? ai-interview-replay/GUIDES/7-QualityOptimizationPlan.md
?? ai-interview-replay/GUIDES/8-CodePlanOfQualityOpt.md
?? ai-interview-replay/GUIDES/FrontendOptimizationPlan.md
?? ai-interview-replay/GUIDES/ProductEvolution.md
```

本次新增/修改还包括：

```text
 M ai-interview-replay/src/app/pre/page.tsx
 M ai-interview-replay/src/app/post/page.tsx
 M ai-interview-replay/src/components/agent-pipeline.tsx
?? docs/handoffs/2026-05-24_18-00-23_fix_agent_pipeline_status.md
```

## 建议提交文件和 commit message

建议提交文件：

```text
ai-interview-replay/src/components/agent-pipeline.tsx
ai-interview-replay/src/app/pre/page.tsx
ai-interview-replay/src/app/post/page.tsx
docs/handoffs/2026-05-24_18-00-23_fix_agent_pipeline_status.md
```

建议 commit message：

```text
fix agent pipeline live preanalysis status
```

## 已完成内容

- `AgentPipeline` 新增 `runningStages`，支持在最终报告 trace 出来前显示某个阶段正在执行。
- 侧边栏真实 trace 文案从“角色已完成”改为“真实记录”，避免把部分预分析状态误导成整条链路完成。
- 面试前页面表单阶段 now 会把材料分析和问题规划 trace 传给侧边栏。
- 面试后页面表单阶段 now 会把材料分析和问题规划 trace 传给侧边栏。
- 问题规划请求执行中时，侧边栏 question 阶段对应 Agent 显示“执行中”。

## 未完成内容

- 未删除侧边栏，因为可以通过小改修正为真实状态展示。
- 未做浏览器手动点击验证。

## 实际验证结果

- `npx.cmd tsc --noEmit`：通过。

## 未验证内容和原因

- 未运行 `npm run build`，本次改动范围较小且已运行 TypeScript 检查。
- 未启动浏览器手动验证首页材料分析、pre/post 问题规划和最终报告侧边栏状态，原因是本轮优先修复代码逻辑。
- 未运行 live API 集成测试，需要真实 LLM key 和 dev server。

## 已知问题

- 最终报告生成时的 loading 侧边栏仍然是模拟进度，因为真实 agent trace 只有 API 返回后才可用。
- 如果需要“每个 Agent 实时流式状态”，需要后端改成 SSE/WebSocket 或轮询任务状态；当前实现是前端阶段状态 + API 返回后的真实 trace。

## 下一位工具或人需要注意什么

- 后续如果继续优化侧边栏，不要把模拟动画当成真实执行记录展示。
- 表单阶段侧边栏现在能反映材料预分析和问题预分析，但最终报告生成中的每个 Agent 仍然只能在完成后展示真实 trace。
- 建议下一步用浏览器实际点一遍：首页分析材料、pre 问题规划、post 问题规划、提交报告。

## 是否涉及环境变量、依赖、部署命令变化

- 不涉及环境变量变化。
- 不涉及依赖变化。
- 不涉及部署命令变化。
