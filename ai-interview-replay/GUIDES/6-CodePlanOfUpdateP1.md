# Interview Replay 多 Agent 升级 P1 实现规划

本文档规划 `UpdatePlan.md` 中“P1：分阶段 Agent 预分析与并行诊断”的代码实现。

P0 已经把复盘报告从单次 LLM 调用升级为真实多 Agent 链路。P1 的重点不是继续堆报告字段，而是优化前后端交互：让系统在用户填写材料、确定问题、完成回答的不同阶段逐步工作，最终提交时复用前置分析结果，并行执行回答相关诊断。

文件名使用用户指定的 `6-CodePlanOfUpdateP1.md`。当前 `GUIDES/` 中已有 `6-ProductEvolution.md`，两者并存：前者是代码实现计划，后者是对外展示说明。

---

## 1. 核心结论

P1 要从 P0 的：

```text
用户点击生成报告
↓
后端串行运行 7 个 Agent
↓
一次性返回完整报告
```

升级为：

```text
用户确认背景材料
↓
Material Analyst 预分析材料
↓
用户确定面试问题
↓
Question Intent + Evidence Planner 预分析问题和应调用材料
↓
用户完成回答
↓
Evidence Mapper / Professor / Gap 或 Diff 并行诊断
↓
Synthesizer + Training Planner + Composer 生成最终报告
```

这不是为了炫技，而是解决三个实际问题：

1. **等待时间过长**：P0 最终提交后才开始全部 Agent 调用。
2. **产品感不足**：用户看不到系统在填写过程中逐步理解材料和问题。
3. **材料召回率不够自然**：P0 的“应调用材料”和“实际使用材料”都在最终提交后一次性判断，P1 应提前规划 expected evidence。

---

## 2. 当前代码基础

当前工作区已有 P0 多 Agent 能力：

```text
src/lib/agents/material-agent.ts
src/lib/agents/intent-agent.ts
src/lib/agents/evidence-agent.ts
src/lib/agents/professor-agent.ts
src/lib/agents/gap-agent.ts
src/lib/agents/diff-agent.ts
src/lib/agents/synthesizer-agent.ts
src/lib/agents/training-agent.ts
src/lib/agents/composer.ts
src/lib/agents/runner.ts
```

当前 API 主链路：

```text
/api/replay/pre  -> runPreReplayAgents
/api/replay/post -> runPostReplayAgents
```

当前前端状态：

```text
首页维护面试背景材料
/pre 页面收集问题、临场回答、冷静回答
/post 页面收集问题和多个回答版本
报告页展示多 Agent 聚合结果
```

P1 应在此基础上做增量改造，不推翻 P0。

---

## 3. P1 产品交互流程

### 3.1 首页：背景材料阶段

用户填写：

```text
面试类型
目标方向
目标院校
背景材料
```

新增交互：

```text
按钮：分析材料
状态：未分析 / 分析中 / 已完成 / 失败
展示：材料证据库预览
```

触发 API：

```text
POST /api/agents/material
```

返回：

```ts
{
  evidenceCards: EvidenceCard[];
  summary: string;
  agentTrace: AgentTraceItem[];
  inputFingerprint: string;
}
```

缓存位置：

```text
React state + localStorage
```

说明：

- localStorage 只缓存用户自己的材料分析结果，不涉及 API Key。
- 缓存只能作为当前浏览器体验优化，不作为长期训练记录。
- `inputFingerprint` 用于后端判断最终提交时预分析结果是否仍匹配当前输入。

### 3.2 问题确定阶段

触发时机：

```text
/pre：用户手动输入问题或 AI 生成问题成功
/post：用户填写真实面试问题
```

新增交互：

```text
状态：问题分析中 / 已完成 / 失败
展示：
  面试后复盘可以直接展示问题意图和推荐调用材料
  面试前模拟只显示“问题分析已完成”，避免提前泄露答案思路
```

触发 API：

```text
POST /api/agents/question-plan
```

返回：

```ts
{
  questionIntent: string;
  evaluationFocus: string[];
  idealAnswerLayers: string[];
  commonPitfalls: string[];
  expectedEvidence: ExpectedEvidenceItem[];
  summary: string;
  agentTrace: AgentTraceItem[];
  inputFingerprint: string;
}
```

### 3.3 最终提交阶段

用户完成回答后提交：

```text
/api/replay/pre
/api/replay/post
```

请求体新增可选字段：

```ts
materialAnalysis?: MaterialPreAnalysis;
questionPlan?: QuestionPreAnalysis;
```

后端规则：

1. 如果预分析存在且 fingerprint 匹配当前输入，则复用。
2. 如果预分析缺失、过期或不匹配，则后端兜底重新运行对应 Agent。
3. 后端不能无条件信任前端传来的证据卡，必须做结构化校验和字段裁剪。

最终阶段运行：

```text
Evidence Mapper
Skeptical Professor
Gap / Diff Diagnoser
Answer Synthesizer
Training Planner
Composer
```

---

## 4. 新增和调整的类型

修改：

```text
src/types/replay.ts
src/lib/agents/types.ts
```

新增：

```ts
export type ExpectedEvidenceItem = {
  title: string;
  evidenceCardTitle: string;
  reason: string;
  priority: "high" | "medium" | "low";
  suggestedUse: string;
};

export type MaterialPreAnalysis = {
  evidenceCards: EvidenceCard[];
  summary: string;
  inputFingerprint: string;
  agentTrace: AgentTraceItem[];
};

export type QuestionPreAnalysis = {
  questionIntent: string;
  evaluationFocus: string[];
  idealAnswerLayers: string[];
  commonPitfalls: string[];
  expectedEvidence: ExpectedEvidenceItem[];
  summary: string;
  inputFingerprint: string;
  agentTrace: AgentTraceItem[];
};
```

扩展 `AgentTraceItem`：

```ts
export type AgentTraceItem = {
  agentName: string;
  agentVersion?: string;
  stage?: "material" | "question" | "diagnosis" | "synthesis" | "training" | "compose";
  summary: string;
  status: "success" | "failed" | "skipped";
  durationMs?: number;
  usedCachedInput?: boolean;
  errorCode?: string;
};
```

请求类型扩展：

```ts
PreReplayRequest {
  materialAnalysis?: MaterialPreAnalysis;
  questionPlan?: QuestionPreAnalysis;
}

PostReplayRequest {
  materialAnalysis?: MaterialPreAnalysis;
  questionPlan?: QuestionPreAnalysis;
}
```

注意：

- TypeScript 类型只说明结构，不代表信任前端输入。
- 后端 route 仍必须做 runtime validation。

---

## 5. 新增 Agent：Evidence Planner

新增文件：

```text
src/lib/agents/evidence-planner-agent.ts
```

定位：

```text
问题确定后，基于 evidenceCards 和 questionIntent，预判这道题应该调用哪些材料。
```

输入：

```ts
{
  question: string;
  questionIntent: string;
  evidenceCards: EvidenceCard[];
}
```

输出：

```ts
{
  expectedEvidence: ExpectedEvidenceItem[];
  summary: string;
}
```

Prompt 要求：

```text
最多选择 3 项 expectedEvidence
只允许从现有 evidenceCards 中选择
说明为什么这道题需要调用该材料
给出一句建议用法
不编造新的经历
只输出 JSON
```

与 P0 `Evidence Mapper` 的关系：

```text
Evidence Planner：回答前，判断应该用什么材料
Evidence Mapper：回答后，判断实际用了什么材料，并计算召回率
```

P1 可以先让 `Evidence Mapper` 接收 `expectedEvidence`，优先用它计算 `expectedCount` 和 `missingEvidence`。

---

## 6. 新增 API Route

### 6.1 材料预分析 API

新增：

```text
src/app/api/agents/material/route.ts
```

职责：

```text
validate request
runMaterialAgent
generate inputFingerprint
return MaterialPreAnalysis
```

请求：

```ts
{
  interviewType?: string;
  targetDirection?: string;
  targetSchool?: string;
  backgroundMaterials: string;
}
```

响应：

```ts
{
  evidenceCards: EvidenceCard[];
  summary: string;
  inputFingerprint: string;
  agentTrace: AgentTraceItem[];
}
```

### 6.2 问题规划 API

新增：

```text
src/app/api/agents/question-plan/route.ts
```

职责：

```text
validate request
runIntentAgent
runEvidencePlannerAgent
generate inputFingerprint
return QuestionPreAnalysis
```

请求：

```ts
{
  question: string;
  interviewType?: string;
  targetDirection?: string;
  targetSchool?: string;
  evidenceCards: EvidenceCard[];
  materialFingerprint: string;
}
```

响应：

```ts
{
  questionIntent: string;
  evaluationFocus: string[];
  idealAnswerLayers: string[];
  commonPitfalls: string[];
  expectedEvidence: ExpectedEvidenceItem[];
  summary: string;
  inputFingerprint: string;
  agentTrace: AgentTraceItem[];
}
```

### 6.3 Fingerprint 工具

新增：

```text
src/lib/agents/fingerprint.ts
```

实现：

```ts
import crypto from "node:crypto";

export function createInputFingerprint(value: unknown): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}
```

用途：

```text
防止用户修改材料或问题后，继续误用旧的预分析结果。
```

---

## 7. 前端状态设计

修改：

```text
src/lib/interview-context.ts
```

新增状态：

```ts
materialAnalysis?: MaterialPreAnalysis;
questionPlans?: Record<string, QuestionPreAnalysis>;
```

建议 key：

```text
questionPlan key = mode + question + targetDirection + materialFingerprint
```

localStorage 存储：

```text
interviewContext.data
interviewContext.materialAnalysis
interviewContext.questionPlans
```

清空逻辑：

```text
用户清空背景材料 -> 同时清空 materialAnalysis 和 questionPlans
用户修改背景材料 -> materialAnalysis 标记为 stale
用户重新分析材料 -> 覆盖旧 materialAnalysis
```

---

## 8. 首页改造

修改：

```text
src/app/page.tsx
```

新增 UI：

```text
分析材料按钮
材料分析状态
材料证据库预览
材料分析失败重试
```

按钮规则：

```text
背景材料为空：禁用
材料未变化且已有分析：显示“已完成”
材料变化：显示“重新分析材料”
请求中：显示“分析中...”
失败：显示错误和重试按钮
```

首页不需要展示完整报告，只展示轻量预览：

```text
证据卡标题
类型
可证明能力
潜在风险
```

---

## 9. 面试前页面改造

修改：

```text
src/features/pre-replay/pre-replay-form.tsx
src/features/pre-replay/pre-replay-client.ts
src/app/pre/page.tsx
```

新增逻辑：

```text
当 question 确定后，触发 question-plan API
AI 生成问题成功后，也触发 question-plan API
面试前临场作答前，不展开显示完整 questionIntent 和 expectedEvidence
只显示“问题分析已完成，可开始临场作答”
最终提交时携带 materialAnalysis 和 questionPlan
```

避免干扰临场模拟：

```text
不要在用户临场回答前直接展示“应该调用哪些材料”
详细意图和 expectedEvidence 放到复盘报告里展示
```

---

## 10. 面试后页面改造

修改：

```text
src/features/post-replay/post-replay-form.tsx
src/features/post-replay/post-replay-client.ts
src/app/post/page.tsx
```

新增逻辑：

```text
用户输入真实问题后触发 question-plan API
可以直接展示问题意图和推荐调用材料
最终提交时携带 materialAnalysis 和 questionPlan
```

面试后复盘没有临场干扰问题，因此可以展示：

```text
这题真正考察什么
建议调用哪几张材料
哪些材料不建议用于这题
```

---

## 11. Replay Runner 改造

修改：

```text
src/lib/agents/runner.ts
src/lib/agents/evidence-agent.ts
```

目标：

```text
如果预分析可用，复用 Material 和 Intent/Planner 输出
如果预分析不可用，回退到 P0 完整链路
回答相关 Agent 尽量并行
```

推荐新增内部函数：

```ts
resolveMaterialAnalysis(req)
resolveQuestionPlan(req, material)
runPreDiagnosisAgents(...)
runPostDiagnosisAgents(...)
```

面试前 P1 runner：

```ts
const material = await resolveMaterialAnalysis(req);
const questionPlan = await resolveQuestionPlan(req, material);

const evidence = await runEvidenceAgent({
  question,
  answersText,
  evidenceCards: material.evidenceCards,
  questionIntent: questionPlan.questionIntent,
  expectedEvidence: questionPlan.expectedEvidence,
});

const [professor, gap] = await Promise.all([
  runProfessorAgent(...),
  runGapAgent(...),
]);

const synthesizer = await runSynthesizerAgent(...);
const training = await runTrainingAgent(...);
return composePreReport(...);
```

说明：

- `Evidence Mapper` 需要先跑，因为 `Professor` 和 `Gap/Diff` 都依赖 `materialRecall`。
- `Professor` 与 `Gap/Diff` 可以并行。
- `Synthesizer` 必须等风险和差距诊断完成。
- `Training Planner` 必须等最佳融合回答完成。

面试后同理：

```text
material / questionPlan resolved
↓
Evidence Mapper
↓
Professor + Diff 并行
↓
Synthesizer
↓
Training
↓
Composer
```

---

## 12. Evidence Mapper 改造

修改：

```text
src/lib/agents/evidence-agent.ts
```

输入新增：

```ts
expectedEvidence?: ExpectedEvidenceItem[];
```

Prompt 改造：

```text
如果提供 expectedEvidence：
  以 expectedEvidence 作为本题应调用材料清单
  判断用户回答实际使用了哪些
  missingEvidence 从 expectedEvidence 中计算
如果没有 expectedEvidence：
  保持 P0 行为，直接根据 question + evidenceCards 判断
```

这样能保证 P1 向后兼容 P0。

---

## 13. Agent Trace / Timeline 改造

修改：

```text
src/components/agent-trace-panel.tsx
```

或新增：

```text
src/components/agent-timeline-panel.tsx
```

P1 建议展示：

```text
材料阶段
问题阶段
诊断阶段
生成阶段
训练阶段
```

每条记录显示：

```text
Agent 名称
版本
状态
一句话结论
耗时
是否使用预分析缓存
```

Demo 表达：

```text
你可以看到系统不是最后才生成报告，而是在材料、问题、回答三个阶段持续分析。
```

---

## 14. 容错策略

P1 必须实现清晰降级。

### 14.1 材料预分析失败

前端：

```text
显示“材料分析失败，可稍后重试”
允许用户继续进入 pre/post
```

后端：

```text
最终提交时如果没有 materialAnalysis，则正常运行 P0 material-agent
```

### 14.2 问题规划失败

前端：

```text
显示“问题分析暂不可用，最终复盘时会自动补充”
```

后端：

```text
最终提交时补跑 intent-agent 和 evidence-planner-agent
```

### 14.3 非核心诊断失败

建议 P1 暂时只对非核心 Agent 做降级：

```text
Professor 失败：风险雷达显示失败，但保留 Gap/Diff 和融合回答
Gap/Diff 失败：报告显示该角色失败，但仍保留材料和风险
Training 失败：复盘卡片用降级模板生成
```

核心失败：

```text
Material 和 Intent 同时失败时，返回清晰错误
```

---

## 15. 测试计划

### 15.1 纯函数测试

更新：

```text
tests/test-functions.ts
```

新增断言：

```text
fingerprint 对相同输入稳定
fingerprint 对材料变化会改变
Evidence Planner normalizer 能处理缺字段
Evidence Mapper 接收 expectedEvidence 后能保留 expectedCount
Runner 在没有预分析时仍能使用 P0 兜底路径
```

### 15.2 API 测试

更新：

```text
tests/test-api.mjs
```

新增测试：

```text
POST /api/agents/material 返回 evidenceCards 和 inputFingerprint
POST /api/agents/question-plan 返回 questionIntent 和 expectedEvidence
/api/replay/pre 接收 materialAnalysis/questionPlan
/api/replay/post 接收 materialAnalysis/questionPlan
agentTrace 中包含 usedCachedInput 或 stage 信息
```

注意：

- 真实 API 测试会触发多次 LLM 调用。
- 没有真实 key 时不要声称已完成端到端验证。

### 15.3 构建验证

至少运行：

```bash
npx.cmd tsc --noEmit
npm.cmd run build
```

如果 npm 脚本在 PowerShell 被执行策略拦截，用 `.cmd` 后缀。

---

## 16. 实现顺序

推荐按以下顺序做，避免大面积返工：

1. 扩展 `src/types/replay.ts`：新增预分析类型、expected evidence、AgentTrace 扩展字段。
2. 新增 `src/lib/agents/fingerprint.ts`。
3. 新增 `src/lib/agents/evidence-planner-agent.ts`。
4. 新增 `/api/agents/material`。
5. 新增 `/api/agents/question-plan`。
6. 修改 `src/lib/interview-context.ts`，支持 materialAnalysis 和 questionPlans 缓存。
7. 修改首页，加入“分析材料”和证据卡预览。
8. 修改 pre 页面，问题确定后触发 question-plan，但临场前不泄露详细建议。
9. 修改 post 页面，问题确定后触发 question-plan，并可展示问题意图和推荐材料。
10. 修改 replay request 类型和 client submit，把预分析结果带给后端。
11. 修改 runner，支持预分析复用和 fallback。
12. 修改 evidence-agent，支持 expectedEvidence。
13. 修改 Agent trace UI，显示阶段、版本、缓存状态。
14. 更新测试。
15. 运行 `npx.cmd tsc --noEmit` 和 `npm.cmd run build`。
16. 新增 handoff。

---

## 17. P1 验收标准

P1 完成后应满足：

```text
首页可以在最终提交前生成材料证据库
问题确定后可以生成问题意图和应调用材料
最终 replay API 可以复用预分析结果
没有预分析结果时，最终 replay API 仍可完整运行
回答相关诊断 Agent 至少有一层并行执行
Agent trace 显示阶段、状态、结论、耗时和缓存状态
前端不会把 API Key 暴露给浏览器
不引入数据库
npm run build 通过
```

---

## 18. 不做内容

P1 不做：

```text
数据库
账号系统
长期训练历史
跨用户画像
真实 RAG
外部 Agent 框架
自主规划循环
院校/导师爬虫
```

如果需要缓存，只使用浏览器 localStorage，并明确它只是当前浏览器的体验优化，不是长期数据能力。

---

## 19. 风险与控制

### 19.1 用户修改材料导致缓存过期

控制：

```text
用 inputFingerprint 判断预分析是否匹配当前材料和问题
不匹配则标记 stale，并要求重新分析或最终提交时补跑
```

### 19.2 面试前提前泄露答题思路

控制：

```text
pre 模式在临场回答前只显示“问题分析已完成”
不展示 expectedEvidence 详情
复盘报告阶段再展开展示
```

### 19.3 前端传入伪造预分析

控制：

```text
后端重新计算 fingerprint
结构化校验预分析字段
不匹配或字段异常则丢弃，回退到后端 Agent 重新分析
```

### 19.4 多阶段请求增加失败点

控制：

```text
预分析失败不阻塞用户继续流程
最终 replay API 保持 P0 fallback
错误提示清晰
```

---

## 20. 最小可交付切片

如果时间紧，P1 最小切片是：

```text
/api/agents/material
首页“分析材料”按钮和证据卡预览
/api/agents/question-plan
问题确定后预分析 questionIntent + expectedEvidence
最终 replay API 可接收并复用预分析结果
Agent trace 显示哪些结果来自预分析
build 通过
handoff
```

可以后置：

```text
复杂 timeline UI
细粒度局部失败降级
自动 debounce 分析
多问题 questionPlan 缓存列表
```

不能后置：

```text
API Key 安全
后端 fallback
fingerprint 校验
前端不崩
handoff
```
