# Interview Replay 多 Agent 升级 P0 实现规划

本文档规划 `UpdatePlan.md` 中“P0：真实轻量多 Agent 诊断链”的代码实现。上一版规划把多角色诊断压缩成单次 LLM 调用，这不符合当前产品方向。本文档明确：本轮 P0 要实现真实的轻量多 Agent 编排。

文件名沿用用户指定的 `5-CodePlanOfUpdataP0.md`。

## 1. 核心结论

`UpdatePlan.md` 中的“多角色诊断链”和“结构化复盘系统”不冲突。

正确关系是：

```text
多 Agent 是实现方式
结构化复盘字段是输出结果
```

因此，本轮 P0 不再采用：

```text
单次 LLM 调用 -> 一个大 JSON 报告
```

而是采用：

```text
多个角色 Agent 独立分析
  -> 每个 Agent 输出结构化 JSON
  -> Composer 聚合为最终报告
  -> 前端展示结构化复盘
```

P0 采用项目内自研轻量 Agent Runner，不引入 LangChain、CrewAI 等重框架。原因是当前是比赛项目，稳定、可部署、可解释比复杂框架更重要。

## 2. 当前代码状态

当前工作区已有这些能力：

```text
Next.js App Router
服务端 LLM 调用 callLLM()
面试前 /api/replay/pre
面试后 /api/replay/post
问题生成 /api/questions
报告 normalizer
复制文本 formatter
Markdown 导出
面试前计时器
面试后动态回答版本
首页背景材料 localStorage 复用
文件上传解析
测试脚本
```

当前关键链路：

```text
route.ts
  -> validate request
  -> buildPrePrompt / buildPostPrompt
  -> callLLM
  -> sanitizeJsonBlock
  -> normalizePreReport / normalizePostReport
  -> format copyText
```

本轮改造后关键链路应变为：

```text
route.ts
  -> validate request
  -> runPreReplayAgents / runPostReplayAgents
  -> each agent calls callLLM with its own prompt
  -> normalize each agent output
  -> composePreReport / composePostReport
  -> format copyText
```

## 3. P0 多 Agent 范围

P0 必须实现以下 Agent：

```text
Material Analyst Agent
Question Intent Agent
Evidence Mapper Agent
Skeptical Professor Agent
Gap Diagnoser Agent / Answer Diff Diagnoser Agent
Answer Synthesizer Agent
Training Planner Agent
Report Composer
```

说明：

- 面试前使用 `Gap Diagnoser Agent`；
- 面试后使用 `Answer Diff Diagnoser Agent`；
- `Report Composer` 不一定调用 LLM，P0 建议先用 TypeScript 纯函数聚合，减少一次模型调用和失败点；
- 每个 Agent 都要有独立 prompt 和独立结构化输出。

## 4. 不做什么

P0 明确不做：

```text
外部复杂 Agent 框架
Agent 自主循环规划
数据库
RAG 知识库
长期记忆
院校/导师爬虫
账号系统
多轮历史画像
```

P0 允许多个 LLM 调用，但必须控制调用次数和输出长度。

建议调用次数：

```text
面试前：6 次 LLM + 1 次本地 composer
面试后：6 次 LLM + 1 次本地 composer
```

如果模型响应太慢，可在 P1 再做并行优化；P0 先保证链路正确。

## 5. 新增目录结构

建议新增：

```text
src/lib/agents/
  types.ts
  json.ts
  runner.ts
  material-agent.ts
  intent-agent.ts
  evidence-agent.ts
  professor-agent.ts
  gap-agent.ts
  diff-agent.ts
  synthesizer-agent.ts
  training-agent.ts
  composer.ts
```

职责：

- `types.ts`：定义 Agent 输入、输出、中间结果和最终 compose 类型；
- `json.ts`：复用或封装 `sanitizeJsonBlock`，提供 agent JSON 解析；
- `runner.ts`：编排面试前和面试后 Agent 链；
- `*-agent.ts`：每个 Agent 的 prompt builder、normalizer 和 run 函数；
- `composer.ts`：把所有 Agent 输出聚合为 `PreReplayReport` / `PostReplayReport`。

## 6. 类型设计

修改 `src/types/replay.ts`，新增最终报告字段。

### 6.1 通用输出类型

```ts
export type EvidenceCard = {
  title: string;
  type: "project" | "research" | "course" | "competition" | "statement" | "other";
  content: string;
  supportedQuestions: string[];
  abilities: string[];
  possibleFollowUps: string[];
  usageRisk: string;
  suggestedExpression: string;
};

export type MaterialRecall = {
  expectedCount: number;
  usedCount: number;
  usedEvidence: string[];
  missingEvidence: string[];
  recallSummary: string;
  improvementHint: string;
};

export type RiskLevel = "低" | "中" | "高";

export type RiskRadarItem = {
  dimension:
    | "空泛表达风险"
    | "证据不足风险"
    | "贡献不清风险"
    | "过度包装风险"
    | "导师匹配不足风险"
    | "追问承接不足风险";
  level: RiskLevel;
  reason: string;
  action: string;
};

export type AuthenticityWarning = {
  expression: string;
  riskType: string;
  reason: string;
  saferAlternative: string;
};

export type ReplayCard = {
  biggestProblem: string;
  keyImprovement: string;
  nextFormula: string;
  rescueSentence: string;
  nextQuestion: string;
};
```

### 6.2 Agent Trace 类型

为了证明是多 Agent，而不是黑盒单 Prompt，建议最终报告带一个轻量 trace。

```ts
export type AgentTraceItem = {
  agentName: string;
  summary: string;
  status: "success" | "failed";
  durationMs?: number;
};
```

P0 前端可以展示，也可以先只用于调试和复制文本。若展示，建议放在报告底部“多角色诊断链”模块。

### 6.3 最终报告类型扩展

`PreReplayReport` 和 `PostReplayReport` 都新增：

```ts
evidenceCards: EvidenceCard[];
materialRecall: MaterialRecall;
riskRadar: RiskRadarItem[];
authenticityWarnings: AuthenticityWarning[];
replayCard: ReplayCard;
agentTrace: AgentTraceItem[];
```

保留已有字段：

- 面试前继续保留 `liveLossAnalysis`、`bestMergedAnswer`、`rescueTemplate`；
- 面试后继续保留 `answerRanking`、`versionReviews`、`transferableFormula`。

## 7. Agent 输入输出设计

### 7.1 Material Analyst Agent

文件：

```text
src/lib/agents/material-agent.ts
```

输入：

```ts
{
  backgroundMaterials: string;
  targetDirection?: string;
  targetSchool?: string;
}
```

输出：

```ts
{
  evidenceCards: EvidenceCard[];
  summary: string;
}
```

Prompt 重点：

- 从用户材料中抽取最多 4 张证据卡；
- 不编造用户没有写出的经历；
- 每张卡写清可证明能力和潜在追问；
- 如果材料很少，返回少量卡片并说明信息不足。

### 7.2 Question Intent Agent

文件：

```text
src/lib/agents/intent-agent.ts
```

输入：

```ts
{
  question: string;
  interviewType?: string;
  targetDirection?: string;
  targetSchool?: string;
}
```

输出：

```ts
{
  questionIntent: string;
  evaluationFocus: string[];
  idealAnswerLayers: string[];
  commonPitfalls: string[];
}
```

最终 `questionIntent` 写入报告；其他字段可供后续 Agent 使用。

### 7.3 Evidence Mapper Agent

文件：

```text
src/lib/agents/evidence-agent.ts
```

输入：

```ts
{
  question: string;
  answersText: string;
  evidenceCards: EvidenceCard[];
  questionIntent: string;
}
```

输出：

```ts
{
  materialRecall: MaterialRecall;
  missingEvidence: ReportBullet[];
  summary: string;
}
```

面试前 `answersText` 包含临场回答和冷静回答；面试后包含所有回答版本。

### 7.4 Skeptical Professor Agent

文件：

```text
src/lib/agents/professor-agent.ts
```

输入：

```ts
{
  question: string;
  answersText: string;
  evidenceCards: EvidenceCard[];
  materialRecall: MaterialRecall;
  targetDirection?: string;
}
```

输出：

```ts
{
  riskRadar: RiskRadarItem[];
  followUpRisks: RiskItem[];
  authenticityWarnings: AuthenticityWarning[];
  summary: string;
}
```

风险雷达固定 6 项，不允许模型自由增删维度。

### 7.5 Gap Diagnoser Agent

文件：

```text
src/lib/agents/gap-agent.ts
```

仅用于面试前模式。

输入：

```ts
{
  question: string;
  liveAnswer: string;
  calmAnswer: string;
  evidenceCards: EvidenceCard[];
  materialRecall: MaterialRecall;
}
```

输出：

```ts
{
  liveAnswerDiagnosis: ReportBullet[];
  calmAnswerImprovements: ReportBullet[];
  liveLossAnalysis: ReportBullet[];
  summary: string;
}
```

### 7.6 Answer Diff Diagnoser Agent

文件：

```text
src/lib/agents/diff-agent.ts
```

仅用于面试后模式。

输入：

```ts
{
  question: string;
  answers: PostReplayRequest["answers"];
  evidenceCards: EvidenceCard[];
  materialRecall: MaterialRecall;
}
```

输出：

```ts
{
  answerRanking: PostReplayReport["answerRanking"];
  versionReviews: PostReplayReport["versionReviews"];
  sentenceDiagnosis: SentenceDiagnosis[];
  summary: string;
}
```

### 7.7 Answer Synthesizer Agent

文件：

```text
src/lib/agents/synthesizer-agent.ts
```

输入：

```ts
{
  question: string;
  answersText: string;
  evidenceCards: EvidenceCard[];
  questionIntent: string;
  materialRecall: MaterialRecall;
  riskRadar: RiskRadarItem[];
  authenticityWarnings: AuthenticityWarning[];
}
```

输出：

```ts
{
  bestMergedAnswer: string;
  summary: string;
}
```

要求：

- 使用用户真实材料；
- 降低真实性风险；
- 不编造经历、指标、论文、导师方向；
- 适合口述。

### 7.8 Training Planner Agent

文件：

```text
src/lib/agents/training-agent.ts
```

输入：

```ts
{
  mode: "pre" | "post";
  question: string;
  questionIntent: string;
  materialRecall: MaterialRecall;
  riskRadar: RiskRadarItem[];
  authenticityWarnings: AuthenticityWarning[];
  bestMergedAnswer: string;
}
```

输出：

```ts
{
  rescueTemplate?: string;
  transferableFormula?: string;
  nextPracticeAdvice?: ReportBullet[];
  nextInterviewChecklist?: string[];
  replayCard: ReplayCard;
  summary: string;
}
```

## 8. Runner 设计

文件：

```text
src/lib/agents/runner.ts
```

导出：

```ts
export async function runPreReplayAgents(req: PreReplayRequest): Promise<PreReplayReport>;
export async function runPostReplayAgents(req: PostReplayRequest): Promise<PostReplayReport>;
```

面试前顺序：

```text
material
intent
evidence
professor
gap
synthesizer
training
composer
```

面试后顺序：

```text
material
intent
evidence
professor
diff
synthesizer
training
composer
```

P0 先顺序执行。P1 再做并行优化。

Runner 要记录 `agentTrace`：

```ts
const start = Date.now();
// run agent
durationMs: Date.now() - start
```

错误策略：

- P0 推荐任何核心 Agent 失败就返回 `MODEL_RESPONSE_INVALID` 或 `MODEL_REQUEST_FAILED`；
- 不要静默吞掉 Agent 错误；
- 错误信息不要包含 API key、原始请求头或堆栈。

## 9. Composer 设计

文件：

```text
src/lib/agents/composer.ts
```

导出：

```ts
export function composePreReport(parts: PreAgentOutputs): PreReplayReport;
export function composePostReport(parts: PostAgentOutputs): PostReplayReport;
```

Composer 只做确定性聚合，不调用 LLM。

面试前聚合：

```ts
{
  questionIntent: intent.questionIntent,
  evidenceCards: material.evidenceCards,
  materialRecall: evidence.materialRecall,
  liveAnswerDiagnosis: gap.liveAnswerDiagnosis,
  calmAnswerImprovements: gap.calmAnswerImprovements,
  liveLossAnalysis: gap.liveLossAnalysis,
  missingEvidence: evidence.missingEvidence,
  riskRadar: professor.riskRadar,
  authenticityWarnings: professor.authenticityWarnings,
  followUpRisks: professor.followUpRisks,
  bestMergedAnswer: synthesizer.bestMergedAnswer,
  rescueTemplate: training.rescueTemplate,
  nextPracticeAdvice: training.nextPracticeAdvice,
  replayCard: training.replayCard,
  agentTrace,
}
```

面试后聚合类似。

## 10. JSON 解析与 normalizer

继续复用现有 `sanitizeJsonBlock` 思路，但建议为 Agent 新增局部 parser：

```text
src/lib/agents/json.ts
```

导出：

```ts
export function parseAgentJson<T>(raw: string): T;
```

每个 Agent 文件内部再写自己的 normalizer，例如：

```ts
normalizeMaterialOutput(value: unknown): MaterialAgentOutput
normalizeProfessorOutput(value: unknown): ProfessorAgentOutput
```

不要只依赖 TypeScript cast。

现有 `src/lib/ai/report-normalizer.ts` 仍保留，用于兼容旧报告或测试；最终 route 可以不再直接使用 `normalizePreReport` / `normalizePostReport`，而是由 Agent composer 返回已经标准化的 report。

## 11. API Route 改造

修改：

```text
src/app/api/replay/pre/route.ts
src/app/api/replay/post/route.ts
```

面试前从：

```ts
const userPrompt = buildPrePrompt(validated);
const raw = await callLLM(SYSTEM_PROMPT, userPrompt);
const report = normalizePreReport(cleaned);
```

改为：

```ts
const report = await runPreReplayAgents(validated);
```

面试后同理：

```ts
const report = await runPostReplayAgents(validated);
```

保留：

```ts
formatPreCopyText(report)
formatPostCopyText(report)
统一错误返回
```

可以保留 `buildPrePrompt` / `buildPostPrompt`，但升级后它们不再是主链路。后续可以作为 legacy prompt 或问题生成以外的备用方案。

## 12. 前端报告展示

新增或复用组件：

```text
src/components/evidence-card-list.tsx
src/components/material-recall-panel.tsx
src/components/risk-radar-panel.tsx
src/components/authenticity-warning-list.tsx
src/components/replay-card-panel.tsx
src/components/agent-trace-panel.tsx
```

面试前报告顺序：

```text
问题真实意图
材料证据库
材料召回率
临场回答诊断
临场损失分析
风险雷达
真实性风险
导师追问风险
最佳融合回答
下次救场模板
复盘卡片
多角色诊断链
```

面试后报告顺序：

```text
问题真实意图
材料证据库
材料召回率
回答综合排名
各版本优缺点
逐句诊断
风险雷达
真实性风险
导师可能追问
最佳融合回答
可迁移回答公式
复盘卡片
多角色诊断链
```

P0 的 `AgentTracePanel` 可以很简单，只展示：

```text
Agent 名称
一句话结论 summary
状态
耗时
```

这对 Demo 很关键，能证明不是单次 Prompt 套壳。

## 13. Copy 和 Markdown

修改：

```text
src/lib/copy-format.ts
src/lib/markdown-export.ts
```

必须加入：

```text
材料证据库
材料召回率
风险雷达
真实性风险
复盘卡片
多角色诊断链摘要
```

不要输出完整原始 Agent JSON。

## 14. 测试计划

### 14.1 纯函数测试

修改：

```text
tests/test-functions.ts
```

新增测试：

- 每个 Agent normalizer 能处理完整 JSON；
- 每个 Agent normalizer 对缺字段有兜底；
- composer 能把 mock Agent 输出聚合成 `PreReplayReport`；
- composer 能把 mock Agent 输出聚合成 `PostReplayReport`；
- copy formatter 包含“多角色诊断链”“材料召回率”“风险雷达”；
- markdown formatter 包含同样模块。

### 14.2 API 集成测试

修改：

```text
tests/test-api.mjs
```

新增断言：

```js
Array.isArray(report.evidenceCards)
typeof report.materialRecall === "object"
Array.isArray(report.riskRadar)
Array.isArray(report.authenticityWarnings)
typeof report.replayCard === "object"
Array.isArray(report.agentTrace)
report.agentTrace.length >= 5
```

注意：

- API 集成测试会触发多次 LLM 调用，耗时和费用都会上升；
- 没有真实 key 或 dev server 时不要声称已验证。

## 15. 实现顺序

推荐顺序：

1. 扩展 `src/types/replay.ts`；
2. 新建 `src/lib/agents/types.ts` 和 `json.ts`；
3. 实现 `material-agent.ts`；
4. 实现 `intent-agent.ts`；
5. 实现 `evidence-agent.ts`；
6. 实现 `professor-agent.ts`；
7. 实现 `gap-agent.ts` 和 `diff-agent.ts`；
8. 实现 `synthesizer-agent.ts`；
9. 实现 `training-agent.ts`；
10. 实现 `composer.ts`；
11. 实现 `runner.ts`；
12. 改造 pre/post API route；
13. 更新 copy / Markdown；
14. 新增前端报告组件；
15. 接入 pre/post result；
16. 更新测试；
17. 更新 README；
18. 运行验证；
19. 新增 handoff。

## 16. 验证命令

在 `ai-interview-replay/` 下至少运行：

```bash
npx tsx tests/test-functions.ts
npm run build
```

建议运行：

```bash
npm run lint
```

有真实 API key 和 dev server 时运行：

```bash
npm run dev
node tests/test-api.mjs
```

## 17. 风险与控制

### 17.1 多次 LLM 调用导致慢

控制：

- P0 先顺序实现，确保逻辑清楚；
- 每个 Agent prompt 限制输出长度；
- evidenceCards 最多 4 张；
- authenticityWarnings 最多 4 条；
- riskRadar 固定 6 项；
- P1 再做并行。

### 17.2 多 Agent JSON 失败率上升

控制：

- 每个 Agent 有独立 normalizer；
- 明确要求只输出 JSON；
- 只在整体 JSON 无法解析时失败；
- 错误返回清晰，不泄露内部细节。

### 17.3 与当前 P1 代码冲突

当前工作区已有 P1 改动：

```text
use-pre-answer-timer.ts
use-answer-versions.ts
markdown-export.ts
markdown-export-button.tsx
timer-control.tsx
answer-version-card.tsx
```

控制：

- 不重写 pre/post form；
- 不删除 P1 文件；
- 只改报告生成链路和报告展示层；
- Markdown 导出要基于新 report 字段扩展。

### 17.4 外部 Agent 框架风险

当前不引入外部框架。这样仍然是多 Agent，因为判断标准是：

```text
是否有多个独立角色
是否有独立 prompt
是否有独立模型调用
是否有中间结构化输出
是否由编排器整合
```

而不是是否使用某个第三方 Agent 库。

## 18. 最小可交付切片

如果时间不足，P0 最小切片是：

```text
Material Agent
Intent Agent
Evidence Agent
Professor Agent
Gap/Diff Agent
Synthesizer Agent
Training Agent
Composer
API route 改到 runner
前端展示 evidenceCards / materialRecall / riskRadar / replayCard / agentTrace
build 通过
handoff
```

可以后置：

```text
Agent 并行
Agent 失败局部降级
复杂 trace UI
README 大段介绍
API 集成测试
```

不能后置：

```text
API Key 安全
结构化输出兜底
前端不崩
Git 不自动提交
handoff
```
