# GUIDES

本目录专门存放 `ai-interview-replay/` 子项目的规划类文件。

## 当前文件

- `1-ProjectProposal.md`: 产品策划书，定义用户、痛点、双模式流程、报告结构和 P0/P1/P2 功能边界。
- `2-CodePlanOfP0.md`: P0 实现规划，定义前端、后端、前后端协同、系统架构、代码结构和验收标准。
- `3-CodePlanOfP1.md`: P1 实现规划，定义 5 秒开始作答、限时锁定、动态回答版本和 Markdown 导出。
- `5-CodePlanOfUpdataP0.md`: 多 Agent 升级版 P0 实现规划，定义轻量 Agent Runner、材料分析器、问题意图分析器、证据匹配器、导师风险审查员、差距/差异诊断器、回答重构器和训练规划器的代码落地方案。
- `6-CodePlanOfUpdateP1.md`: 多 Agent 升级版 P1 实现规划，定义分阶段 Agent 预分析、材料确认后提前分析、问题确定后提前规划、最终提交时复用预分析和并行诊断的代码落地方案。
- `7-QualityOptimizationPlan.md`: 多 Agent 质量优化方案，说明如何通过职责边界、证据引用、导师压力测试、安全回答和 Verifier 提升复盘判断质量。
- `8-CodePlanOfQualityOpt.md`: 质量优化代码实现规划，结合当前 P0/P1 代码状态，定义证据引用、Professor 压力测试、Synthesizer 安全回答、Verifier Agent、报告展示和测试的落地方案。
- `ProductEvolution.md`: 产品形态演进说明，用非代码语言说明从 Proposal P0 到 Update P1 每个阶段完成后的产品样子、功能和展示话术。
- `FrontendOptimizationPlan.md`: 前端优化方案，规划首页工作台、使用说明、分步骤引导、Loading 阶段反馈、报告摘要卡、示例数据和空状态等作品形态优化。

## 使用规则

- 代码实现前，先读取与任务相关的规划文件；
- 新增重大设计、架构调整或阶段计划时，可以继续按编号新增文件；
- `GUIDES/` 不放运行时代码；
- 规划变更要同步反映到 README、`.env.example` 或实现代码中，避免文档和代码脱节；
- 修改本目录后，要按根目录 `AGENTS.md` 要求新增 handoff。

## 建议编号

```text
1-ProjectProposal.md
2-CodePlanOfP0.md
3-DeploymentPlan.md
4-DemoScript.md
5-PostP0IterationPlan.md
```
