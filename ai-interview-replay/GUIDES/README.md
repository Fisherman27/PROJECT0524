# GUIDES

本目录专门存放 `ai-interview-replay/` 子项目的规划类文件。

## 当前文件

- `1-ProjectProposal.md`: 产品策划书，定义用户、痛点、双模式流程、报告结构和 P0/P1/P2 功能边界。
- `2-CodePlanOfP0.md`: P0 实现规划，定义前端、后端、前后端协同、系统架构、代码结构和验收标准。
- `30CodePlanOfP1.md`: P1 实现规划，定义 5 秒开始作答、限时锁定、动态回答版本和 Markdown 导出。

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
