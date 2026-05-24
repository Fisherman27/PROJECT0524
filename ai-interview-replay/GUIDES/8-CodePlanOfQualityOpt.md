# Interview Replay 质量优化代码实现规划

本文档基于 `7-QualityOptimizationPlan.md`，结合当前工作区已经完成的 P0/P1 多 Agent 代码，规划下一轮“质量优化”的两阶段代码落地方案。

目标不是继续堆功能，而是提升多 Agent 复盘系统的判断质量、协作质量和输出稳定性。之后代码实现建议分两阶段推进：

```text
Quality Opt P0：证据驱动与安全回答闭环
Quality Opt P1：诊断分层、置信度扩展与训练建议增强
```

---

## 1. 核心结论

当前项目已经具备比较完整的功能和交互基础：

```text
P0：真实多 Agent 复盘链路
P1：材料阶段预分析、问题阶段预规划、最终提交时复用预分析、部分 Agent 并行、失败降级
前端：双模式流程、材料分析入口、问题规划、报告展示、Agent Trace
```

因此，质量优化不建议做大规模架构重写，而应在现有多 Agent 链路上做增量增强：

```text
1. 让关键结论绑定证据卡或信息缺口
2. 强化 Professor，让风险从“标签”升级为“导师追问压力测试”
3. 强化 Synthesizer，让最终回答从“漂亮回答”升级为“安全可承接回答”
4. 新增 Verifier，只检查最终回答是否编造、夸大、不可承接
5. 在第二阶段补齐成熟度、置信度、冲突规则、报告分层和训练建议
```

两阶段边界：

```text
Quality Opt P0：先解决“回答是否有证据、是否安全、是否能承接追问”
Quality Opt P1：再解决“报告是否更好读、诊断是否更细、训练建议是否更准”
```

---

## 2. 当前代码完成情况

### 2.1 已经完成的能力

当前工作区已经有这些 Agent 代码基础：

```text
src/lib/agents/material-agent.ts
src/lib/agents/intent-agent.ts
src/lib/agents/evidence-planner-agent.ts
src/lib/agents/evidence-agent.ts
src/lib/agents/professor-agent.ts
src/lib/agents/gap-agent.ts
src/lib/agents/diff-agent.ts
src/lib/agents/synthesizer-agent.ts
src/lib/agents/training-agent.ts
src/lib/agents/composer.ts
src/lib/agents/runner.ts
src/lib/agents/fingerprint.ts
```

当前链路已经实现：

```text
首页 /api/agents/material：提前运行 Material Analyst
问题阶段 /api/agents/question-plan：提前运行 Question Intent + Evidence Planner
最终 /api/replay/pre 或 /api/replay/post：复用预分析，运行 Evidence Mapper、Professor、Gap/Diff、Synthesizer、Training
```

当前质量相关基础：

```text
Evidence Planner 已从 Evidence Mapper 中拆出
Evidence Mapper 支持 expectedEvidence
Professor 已有 riskRadar、followUpRisks、authenticityWarnings
Synthesizer 已有不编造、不过度包装、适合口述等 prompt 约束
Runner 已支持预分析复用、fingerprint 校验、Professor + Gap/Diff 并行
AgentTraceItem 已包含 stage、agentVersion、usedCachedInput、errorCode
```

这说明 `7-QualityOptimizationPlan.md` 中的主要方向已经具备落地基础，不需要从零实现。

### 2.2 当前主要不足

从代码结构看，目前质量不足集中在：

```text
证据卡没有稳定 ID，结论无法可靠引用 evidenceRefs
Evidence Planner / Mapper 输出还没有 claim / evidenceRefs / confidence / missingInfo
Professor 输出仍偏“风险项”，不是完整“追问压力测试”
Synthesizer 只输出 bestMergedAnswer，没有 30秒/60秒、安全说明、使用证据
没有 Verifier / Critic 最终校验环节
Composer 只是聚合字段，没有做质量摘要或冲突解决
前端报告没有显示证据引用、信息缺口、置信度、Verifier 结果
测试主要验证结构存在，还没有质量样例测试
```

---

## 3. 可行性评估与阶段划分

### 3.1 Quality Opt P0：高可行，第一阶段必须做

这些改动主要是类型、prompt、normalizer、runner、composer 和报告展示增强，不需要引入新依赖或数据库，适合优先作为第一阶段实现。

```text
EvidenceCard 增加稳定 id
新增 EvidenceReference / MissingInfoItem / DiagnosisClaim 类型
Evidence Planner 输出 expectedEvidence 时绑定 evidenceCardId
Evidence Mapper 输出 evidenceClaims：claim + evidenceRefs + missingInfo + confidence
Professor 输出 pressureTests
Synthesizer 输出 safeAnswer：30秒/60秒回答、usedEvidence、riskControls
新增 Verifier Agent 检查最终回答
Runner 在 Synthesizer 后、Training 前接入 Verifier
Composer 聚合 verifier 结果，必要时采用 revisedAnswer
报告页展示证据依据、信息缺口、压力测试、安全回答和校验结果
Copy/Markdown 包含质量优化关键结果
纯函数测试覆盖 normalizer、composer、formatter
```

P0 风险：

```text
报告字段会变多，需要保持前端空状态不崩
LLM 输出 JSON 更复杂，需要 normalizer 兜底
新增 Verifier 会增加一次 LLM 调用
Verifier 失败不能影响整份报告生成
```

P0 总体判断：高可行，且对 Demo 质量提升最明显。

### 3.2 Quality Opt P1：中等可行，第二阶段再做

这些能力仍然契合 `7-QualityOptimizationPlan.md`，但会影响报告结构、用户理解和前端取舍，建议在 P0 稳定后实现。

```text
回答成熟度 L1-L5
更多 Agent 输出 confidence / missingInfo
Gap Agent 输出 gapClaims
Diff Agent 输出 versionClaims
轻量冲突解决规则与 qualitySummary
报告分层展示：摘要层、证据层、风险层、训练层
Training Planner 根据最高风险、Verifier 结果和成熟度生成更精准下一题
3 到 5 个静态质量样例，用轻量断言检查 forbiddenPhrases、风险覆盖、证据召回
```

P1 风险：

```text
展示太多会让报告变长，需要分层和折叠
成熟度 L1-L5 容易被用户理解成绝对评分，需要谨慎文案
冲突规则不能做成复杂 Agent 自主协调，只做确定性聚合规则
静态质量样例只做轻量断言，不扩展成评测平台
```

P1 总体判断：可做，但应该在 P0 的证据与安全闭环稳定后再做。

### 3.3 不纳入两阶段实现的内容

以下内容从本文件的实现计划中舍弃，不作为 P0/P1 代码任务：

```text
完整样例评测框架
自动回归评分系统
多轮 Verifier 修正循环
长期弱点画像
跨报告质量趋势
复杂 Agent 自主协调
```

原因：

```text
这些能力对比赛 Demo 的即时收益不高
会显著拉长开发和验证时间
容易引入数据库、历史状态或复杂调度需求
当前阶段用静态样例、单轮 Verifier、确定性 composer 规则即可覆盖主要质量风险
```

---

## 4. Quality Opt P0 实现范围

P0 命名：

```text
Quality Opt P0：证据驱动与安全回答闭环
```

必须实现：

```text
EvidenceCard 稳定 ID
关键诊断结论支持 evidenceRefs / missingInfo / confidence
Evidence Planner 使用 evidenceCardId 规划材料
Evidence Mapper 输出 evidenceClaims
Professor 输出 pressureTests
Synthesizer 输出 safeAnswer
Verifier Agent 单轮安全校验
Runner 接入 Verifier，并保留失败降级
Composer 聚合新增字段并处理 revisedAnswer
报告展示证据依据、压力测试、安全回答、校验结果
复制文本和 Markdown 包含质量优化关键结果
测试覆盖 normalizer、composer、formatter
```

P0 不做：

```text
回答成熟度 L1-L5
复杂报告分层
Gap/Diff 全量 claim 化
训练建议深度个性化
静态质量样例目录
```

P0 的产品效果：

```text
用户能看到每个关键诊断为什么成立
用户能看到导师可能如何追问
用户能拿到 30 秒和 60 秒的安全回答
系统会对最终回答做一次真实性和可承接性校验
复制/导出的复盘结果包含证据、风险和安全校验
```

---

## 5. Quality Opt P1 实现范围

P1 命名：

```text
Quality Opt P1：诊断分层、置信度扩展与训练建议增强
```

必须实现：

```text
回答成熟度 L1-L5
Gap Agent 输出 gapClaims
Diff Agent 输出 versionClaims
更多 Agent 输出 confidence / missingInfo
Composer 输出 qualitySummary
轻量冲突解决规则
报告按摘要层、证据层、风险层、训练层展示
Training Planner 根据 topRisk、answerVerification、maturityLevel 生成下一题建议
新增 3 到 5 个静态质量样例和轻量断言
```

P1 不做：

```text
完整自动评测平台
长期用户画像
跨报告趋势分析
多轮自动修正
复杂 Agent 自主协商
```

P1 的产品效果：

```text
报告更容易读，先看结论，再看依据
用户能知道回答处于哪个成熟度层级
系统能解释多个 Agent 结论冲突时采用了什么规则
下一题推荐更贴近当前最大风险
质量样例能防止 prompt 修改后出现明显退化
```

---

## 6. 类型设计

修改：

```text
src/types/replay.ts
src/lib/agents/types.ts
```

### 6.1 P0：EvidenceCard 增加稳定 ID

当前：

```ts
export type EvidenceCard = {
  title: string;
  type: ...
}
```

建议改为：

```ts
export type EvidenceCard = {
  id: string;
  title: string;
  type: "project" | "research" | "course" | "competition" | "statement" | "other";
  content: string;
  supportedQuestions: string[];
  abilities: string[];
  possibleFollowUps: string[];
  usageRisk: string;
  suggestedExpression: string;
  missingInfo?: string[];
};
```

ID 生成策略：

```text
Material Agent 如果返回 id，则规范化使用
如果模型未返回 id，则 normalizer 生成 card_1、card_2、card_3
不要使用随机数，避免前端缓存和 evidenceRefs 不稳定
```

### 6.2 P0：新增证据引用类型

```ts
export type EvidenceReference = {
  evidenceCardId: string;
  evidenceCardTitle: string;
  quote?: string;
  reason: string;
};
```

说明：

```text
quote 只允许短引用用户材料中的片段，不要求完整原文
reason 说明为什么引用这张证据卡
normalizer 必须校验 evidenceCardId 是否存在
```

### 6.3 P0：新增信息缺口类型

```ts
export type MissingInfoItem = {
  field: string;
  reason: string;
  howToSupplement: string;
};
```

示例：

```text
field: 项目评价指标
reason: 用户提到效果提升，但没有说明评价方式
howToSupplement: 补充 baseline、评价指标或人工评估维度
```

### 6.4 P0：新增诊断结论类型

```ts
export type DiagnosisClaim = {
  title: string;
  detail: string;
  evidenceRefs: EvidenceReference[];
  missingInfo: MissingInfoItem[];
  confidence: "high" | "medium" | "low";
};
```

兼容策略：

```text
短期不删除 ReportBullet
新增字段使用 DiagnosisClaim[]
前端同时兼容旧字段和新字段
```

### 6.5 P0：Professor 压力测试类型

```ts
export type ProfessorPressureTest = {
  riskyExpression: string;
  likelyQuestion: string;
  dangerReason: string;
  currentSupportLevel: "strong" | "medium" | "weak";
  safeResponse: string;
  missingInfo: MissingInfoItem[];
  evidenceRefs: EvidenceReference[];
};
```

### 6.6 P0：Synthesizer 安全回答类型

```ts
export type SafeAnswerOutput = {
  answer30s: string;
  answer60s: string;
  naturalVersion?: string;
  researchVersion?: string;
  usedEvidence: EvidenceReference[];
  riskControls: string[];
};
```

兼容方式：

```text
保留 bestMergedAnswer
bestMergedAnswer = safeAnswer.answer60s || old bestMergedAnswer
```

### 6.7 P0：Verifier 类型

```ts
export type AnswerVerificationIssue = {
  issueType:
    | "unsupported_claim"
    | "overclaim"
    | "unclear_contribution"
    | "unanswerable_term"
    | "off_topic"
    | "not_oral_friendly"
    | "new_followup_risk";
  originalText: string;
  reason: string;
  suggestedFix: string;
  severity: "high" | "medium" | "low";
  evidenceRefs: EvidenceReference[];
};

export type AnswerVerification = {
  passed: boolean;
  summary: string;
  issues: AnswerVerificationIssue[];
  revisedAnswer?: string;
};
```

### 6.8 P0：最终报告扩展

`PreReplayReport` 和 `PostReplayReport` 新增：

```ts
evidenceClaims: DiagnosisClaim[];
pressureTests: ProfessorPressureTest[];
safeAnswer: SafeAnswerOutput;
answerVerification: AnswerVerification;
```

### 6.9 P1：成熟度与质量摘要类型

P1 再新增：

```ts
export type AnswerMaturityLevel = "L1" | "L2" | "L3" | "L4" | "L5";

export type AnswerMaturity = {
  level: AnswerMaturityLevel;
  label: string;
  reason: string;
  nextUpgrade: string;
};

export type QualitySummary = {
  oneSentenceDiagnosis: string;
  topRisk: string;
  topMissingInfo: MissingInfoItem[];
  evidenceRecallText: string;
  answerSafety: "passed" | "needs_fix" | "not_checked";
  maturity?: AnswerMaturity;
  conflictNotes: string[];
};
```

---

## 7. P0 Agent 改造计划

### 7.1 Material Analyst

文件：

```text
src/lib/agents/material-agent.ts
```

P0 改造目标：

```text
为每张证据卡生成稳定 id
增加 missingInfo
强化“只提取，不评价回答”的职责边界
```

Prompt 新增规则：

```text
只从用户材料中提取事实，不补充用户未写出的经历。
如果材料里没有指标、个人贡献、导师方向等信息，请写入 missingInfo，不要自行猜测。
每张证据卡必须有 id，格式为 card_1、card_2。
```

Normalizer 规则：

```text
id 缺失时按顺序补 card_1
missingInfo 非数组时补 []
type 不合法时补 other
```

### 7.2 Evidence Planner

文件：

```text
src/lib/agents/evidence-planner-agent.ts
```

P0 改造目标：

```text
expectedEvidence 必须引用 evidenceCardId
不能只用 title 匹配
输出每个 expected evidence 的 priority 和 reason
```

类型调整：

```ts
ExpectedEvidenceItem {
  title: string;
  evidenceCardId: string;
  evidenceCardTitle: string;
  reason: string;
  priority: "high" | "medium" | "low";
  suggestedUse: string;
  missingInfo?: MissingInfoItem[];
}
```

Prompt 新增规则：

```text
只能从给定 evidenceCards 中选择，不得创造新材料。
每项 expectedEvidence 必须填写 evidenceCardId。
如果某材料适合但信息不足，写入 missingInfo。
```

### 7.3 Evidence Mapper

文件：

```text
src/lib/agents/evidence-agent.ts
```

P0 改造目标：

```text
从“材料召回率”升级为“证据驱动诊断”
输出 usedEvidence、missingEvidence、evidenceClaims
```

输出扩展：

```ts
EvidenceAgentOutput {
  materialRecall: MaterialRecall;
  missingEvidence: ReportBullet[];
  evidenceClaims: DiagnosisClaim[];
  summary: string;
}
```

Prompt 新增规则：

```text
如果判断回答缺少某材料，必须引用 expectedEvidence 或 evidenceCardId。
如果无法确定用户是否使用了某材料，confidence 写 medium 或 low。
不要因为回答语气积极就判定证据充分。
```

### 7.4 Skeptical Professor

文件：

```text
src/lib/agents/professor-agent.ts
```

P0 改造目标：

```text
从风险标签升级为导师追问压力测试
```

新增输出：

```ts
pressureTests: ProfessorPressureTest[];
```

Prompt 要求每条压力测试包含：

```text
riskyExpression
likelyQuestion
dangerReason
currentSupportLevel
safeResponse
missingInfo
evidenceRefs
```

Normalizer：

```text
pressureTests 最多保留 4 条
currentSupportLevel 不合法时默认 medium
missingInfo / evidenceRefs 缺失时补 []
```

### 7.5 Synthesizer

文件：

```text
src/lib/agents/synthesizer-agent.ts
```

P0 改造目标：

```text
从单个 bestMergedAnswer 升级为 SafeAnswerOutput
```

新增输入：

```ts
pressureTests: ProfessorPressureTest[];
evidenceClaims: DiagnosisClaim[];
expectedEvidence?: ExpectedEvidenceItem[];
```

新增输出：

```ts
safeAnswer: SafeAnswerOutput;
bestMergedAnswer: string;
summary: string;
```

Prompt 核心约束：

```text
生成优先级：
真实性 > 可承接性 > 具体性 > 结构清晰 > 口述自然 > 高级感

必须输出：
30 秒版
60 秒版
使用证据
风险控制说明
```

禁止项必须写入 system prompt：

```text
不能编造经历、指标、论文、导师方向
不能把参与说成主导
不能把 Prompt 设计包装成模型训练
不能写显著提升，除非材料有指标
不能使用用户无法承接的高级术语
```

### 7.6 新增 Verifier Agent

新增文件：

```text
src/lib/agents/verifier-agent.ts
```

P0 职责：

```text
只检查最终回答是否真实、安全、可承接
不负责重新生成长篇回答
不做多轮修正循环
```

输入：

```ts
{
  question: string;
  answer: string;
  evidenceCards: EvidenceCard[];
  pressureTests: ProfessorPressureTest[];
  authenticityWarnings: AuthenticityWarning[];
  questionIntent: string;
}
```

输出：

```ts
{
  verification: AnswerVerification;
  summary: string;
}
```

Prompt 检查项：

```text
是否使用未提供材料
是否夸大个人贡献
是否引入无法承接术语
是否正面回答问题
是否保留具体证据
是否适合口述
是否带来新追问风险
```

---

## 8. P1 Agent 改造计划

### 8.1 Gap Agent

文件：

```text
src/lib/agents/gap-agent.ts
```

P1 改造目标：

```text
临场损失结论绑定 evidenceRefs 或 missingInfo
```

新增输出：

```ts
gapClaims: DiagnosisClaim[];
```

Prompt 要求：

```text
如果判断“证据损失”，必须指出是哪张证据卡没被临场回答调用。
如果判断“边界损失”，必须指出缺少什么个人贡献信息。
```

### 8.2 Diff Agent

文件：

```text
src/lib/agents/diff-agent.ts
```

P1 改造目标：

```text
多版本比较不只排名，还要说明哪个版本增加了证据、哪个版本引入了风险
```

新增输出：

```ts
versionClaims: DiagnosisClaim[];
```

Prompt 要求：

```text
每个版本至少判断：
1. 是否增加有效证据
2. 是否引入新风险
3. 是否更适合口述
4. 是否更能承接追问
```

### 8.3 Training Planner

文件：

```text
src/lib/agents/training-agent.ts
```

P1 改造目标：

```text
根据 topRisk、answerVerification、maturityLevel 生成更精准下一题和训练建议
```

新增输入：

```ts
{
  qualitySummary?: QualitySummary;
  answerVerification?: AnswerVerification;
  maturity?: AnswerMaturity;
}
```

输出增强：

```text
下一题推荐需要说明触发原因
救场模板要优先覆盖最高风险
可迁移公式要结合成熟度等级给出下一步升级方向
```

### 8.4 Composer 质量摘要

文件：

```text
src/lib/agents/composer.ts
```

P1 改造目标：

```text
输出 qualitySummary
根据确定性规则处理多个 Agent 的轻量冲突
```

轻量冲突规则：

```text
Verifier high severity > Professor pressureTests > Evidence missingInfo > Synthesizer riskControls
如果 Verifier 认为回答不安全，qualitySummary.answerSafety = needs_fix
如果 Evidence Mapper 认为证据不足，但 Synthesizer 使用了该证据，展示为“证据使用仍需补充”
如果成熟度和安全校验冲突，安全校验优先
```

---

## 9. Runner 改造计划

文件：

```text
src/lib/agents/runner.ts
```

当前流程：

```text
material
questionPlan
evidence
professor + gap/diff 并行
synthesizer
training
composer
```

### 9.1 P0 Runner 流程

P0 后流程：

```text
material
questionPlan
evidence
professor + gap/diff 并行
synthesizer
verifier
training
composer
```

说明：

```text
Verifier 必须在 Synthesizer 后、Training 前
Training Planner 可以先只接收 bestMergedAnswer，不强制使用 verification
Verifier 失败时只记录 agentTrace failed，报告继续使用 Synthesizer 原回答
```

伪代码：

```ts
const evidence = await runEvidenceAgent(...);

const [professorResult, gapResult] = await Promise.allSettled([
  runProfessorAgent(...),
  runGapAgent(...),
]);

const synthesizer = await runSynthesizerAgent({
  pressureTests: professor.pressureTests,
  evidenceClaims: evidence.evidenceClaims,
  ...
});

const verifier = await runVerifierAgent({
  answer: synthesizer.safeAnswer.answer60s || synthesizer.bestMergedAnswer,
  evidenceCards: material.evidenceCards,
  pressureTests: professor.pressureTests,
  authenticityWarnings: professor.authenticityWarnings,
  questionIntent: questionPlan.questionIntent,
});

const finalAnswer = verifier.verification.revisedAnswer || synthesizer.bestMergedAnswer;
```

### 9.2 P1 Runner 流程

P1 在 P0 基础上增强：

```text
material
questionPlan
evidence
professor + gap/diff 并行
synthesizer
verifier
composer 先生成 qualitySummary
training 使用 qualitySummary 生成下一题和训练建议
composer 最终聚合报告
```

说明：

```text
如果不想让 composer 跑两次，可以把 qualitySummary 生成逻辑抽成纯函数
P1 不引入新的异步 Agent 调度框架
P1 不做多 Agent 自主协商
```

---

## 10. Composer 改造计划

文件：

```text
src/lib/agents/composer.ts
```

### 10.1 P0 Composer

新增职责：

```text
聚合 evidenceClaims
聚合 pressureTests
聚合 safeAnswer
聚合 answerVerification
必要时用 revisedAnswer 覆盖 bestMergedAnswer
```

建议规则：

```text
如果 verifier.passed=true：使用 synthesizer.safeAnswer.answer60s 作为 bestMergedAnswer
如果 verifier.passed=false 且 revisedAnswer 存在：使用 revisedAnswer
如果 verifier 失败：使用 synthesizer.bestMergedAnswer
```

### 10.2 P1 Composer

新增职责：

```text
生成 qualitySummary
合并 gapClaims / versionClaims / evidenceClaims
处理轻量冲突规则
输出 answerMaturity
```

P1 注意：

```text
冲突解决必须是确定性规则，不要新增复杂 Agent 自主协调
qualitySummary 要服务前端分层展示，不要输出完整内部推理过程
```

---

## 11. 前端展示计划

修改范围：

```text
src/features/pre-replay/pre-replay-result.tsx
src/features/post-replay/post-replay-result.tsx
src/components/*
```

### 11.1 P0 前端

新增组件建议：

```text
src/components/evidence-claim-list.tsx
src/components/professor-pressure-test-list.tsx
src/components/answer-verification-panel.tsx
src/components/safe-answer-panel.tsx
```

展示内容：

```text
Evidence Claim：诊断结论、引用证据卡、信息缺口、置信度
Pressure Test：风险表述、导师可能追问、危险原因、安全回应
Safe Answer：30 秒版、60 秒版、使用证据、风险控制说明
Verifier：校验通过/需要修改、问题列表、建议修正、是否采用修正版
```

空状态：

```text
没有 evidenceClaims：显示“本次没有可引用的材料依据，建议补充项目经历或个人贡献边界。”
没有 pressureTests：显示“本次未发现明显追问压力点。”
Verifier 失败：显示“安全校验暂不可用，已保留原始融合回答。”
```

文案原则：

```text
不要写“错误”
建议写“安全校验提示”
证据缺口要表达成可补充事项，不要表达成否定评价
```

### 11.2 P1 前端

新增或增强：

```text
qualitySummary 顶部摘要卡
回答成熟度 L1-L5 标签
报告分层导航：摘要、证据、风险、回答、训练
gapClaims / versionClaims 折叠展示
下一题推荐展示触发原因
```

P1 展示顺序：

```text
1. 一句话诊断
2. 最佳安全回答
3. 最大风险和导师追问
4. 证据依据与信息缺口
5. 成熟度与下一步训练
6. Agent Trace
```

---

## 12. Copy 和 Markdown 改造

修改：

```text
src/lib/copy-format.ts
src/lib/markdown-export.ts
```

### 12.1 P0 Copy/Markdown

新增章节：

```text
证据依据
导师压力测试
安全回答版本
回答安全校验
信息缺口
```

复制文本建议简化，不要输出完整 Agent JSON。

示例：

```text
【证据依据】
- 结论：回答缺少项目证据
  依据：证据卡 #1 大模型论文中译英 TeX 编辑器
  置信度：高

【导师压力测试】
- 风险表述：我负责模型优化
  可能追问：你优化的是模型参数、Prompt，还是推理流程？
  安全回应：这里的优化主要指 Prompt 模板和输出格式控制。

【回答安全校验】
结果：需要轻微修改
提示：避免使用“深入研究”这类材料不足的表述。
```

### 12.2 P1 Copy/Markdown

新增章节：

```text
质量摘要
回答成熟度
版本差异结论
下一题训练建议
```

P1 注意：

```text
Markdown 适合完整复盘
复制文本适合短摘要
不要把所有 claims 平铺到复制文本里
```

---

## 13. 测试计划

### 13.1 P0 纯函数测试

修改：

```text
tests/test-functions.ts
```

新增测试：

```text
EvidenceCard 缺 id 时 normalizer 补 card_1
Evidence Planner normalizer 保留 evidenceCardId
Evidence Mapper normalizer 保留 evidenceClaims
Professor normalizer 保留 pressureTests
Synthesizer normalizer 保留 safeAnswer
Verifier normalizer 对缺字段有兜底
Composer 使用 revisedAnswer 覆盖 bestMergedAnswer
Copy/Markdown 包含“导师压力测试”和“回答安全校验”
```

### 13.2 P0 API 集成测试

修改：

```text
tests/test-api.mjs
```

新增断言：

```js
Array.isArray(report.evidenceClaims)
Array.isArray(report.pressureTests)
typeof report.safeAnswer === "object"
typeof report.answerVerification === "object"
report.agentTrace.some(t => t.agentName.includes("校验"))
```

注意：

```text
API 集成测试需要真实 LLM key，会触发多次调用。
没有运行就不能写已验证。
```

### 13.3 P1 静态质量样例

新增目录：

```text
tests/fixtures/quality/
  motivation.json
  project_intro.json
  contribution_boundary.json
  pressure_question.json
  future_plan.json
```

每个样例包含：

```json
{
  "name": "motivation",
  "backgroundMaterials": "...",
  "question": "...",
  "liveAnswer": "...",
  "calmAnswer": "...",
  "expected": {
    "mustMentionEvidenceTitles": ["..."],
    "mustDetectRisks": ["..."],
    "forbiddenPhrasesInAnswer": ["显著提升", "深入研究"]
  }
}
```

轻量断言：

```text
最终回答不包含 forbiddenPhrases
风险中包含贡献边界或证据不足
材料召回率 expectedCount > 0
成熟度字段存在且值在 L1-L5 范围内
```

明确不做：

```text
不做复杂自动评分
不做长期质量趋势
不引入评测平台
```

---

## 14. 实现顺序

### 14.1 Quality Opt P0 推荐顺序

```text
1. 扩展类型：EvidenceCard id、EvidenceReference、MissingInfoItem、DiagnosisClaim
2. 修改 Material Agent normalizer，保证 evidenceCards 有稳定 id
3. 修改 Evidence Planner，输出 evidenceCardId
4. 修改 Evidence Mapper，输出 evidenceClaims
5. 修改 Professor，输出 pressureTests
6. 修改 Synthesizer，输出 safeAnswer
7. 新增 Verifier Agent
8. 修改 Runner，把 Verifier 接到 Synthesizer 后
9. 修改 Composer，聚合新增字段并处理 revisedAnswer
10. 修改前端报告页，展示证据依据、压力测试、安全回答、校验结果
11. 修改 copy-format 和 markdown-export
12. 更新 tests/test-functions.ts
13. 更新 tests/test-api.mjs
14. 运行 npx.cmd tsc --noEmit
15. 运行 npm.cmd run build
16. 新增 handoff
```

### 14.2 Quality Opt P1 推荐顺序

```text
1. 新增 AnswerMaturity / QualitySummary 类型
2. 修改 Gap Agent，输出 gapClaims
3. 修改 Diff Agent，输出 versionClaims
4. 修改 Composer，生成 qualitySummary 和 answerMaturity
5. 增加轻量冲突解决规则
6. 修改 Training Planner，使用 qualitySummary 生成下一题建议
7. 修改前端报告分层展示
8. 修改 Copy/Markdown，增加质量摘要和成熟度
9. 新增 tests/fixtures/quality 静态样例
10. 更新 tests/test-functions.ts 的 P1 断言
11. 视情况运行 API 集成测试
12. 运行 npx.cmd tsc --noEmit
13. 运行 npm.cmd run build
14. 新增 handoff
```

---

## 15. 验收标准

### 15.1 P0 验收标准

P0 完成后，应满足：

```text
证据卡有稳定 id
Evidence Planner 的 expectedEvidence 引用 evidenceCardId
Evidence Mapper 能输出 evidenceClaims
Professor 能输出 pressureTests，包含“导师追问”和“安全回应”
Synthesizer 能输出 30 秒 / 60 秒安全回答
Verifier 能检查最终回答并输出 passed/issues/revisedAnswer
最终报告展示证据依据、导师压力测试、回答安全校验
复制文本和 Markdown 包含 P0 质量优化结果
Verifier 失败不会导致整份报告失败
没有新增数据库
不暴露 API Key
npx.cmd tsc --noEmit 通过
npm.cmd run build 通过
```

### 15.2 P1 验收标准

P1 完成后，应满足：

```text
报告包含 qualitySummary
回答成熟度 L1-L5 可见，且文案不表达为绝对评分
Gap Agent 输出 gapClaims
Diff Agent 输出 versionClaims
Composer 能处理轻量冲突规则
Training Planner 能基于最大风险生成下一题建议
报告支持分层展示，不把所有细节一次性平铺
Copy/Markdown 包含质量摘要和训练建议
静态质量样例至少 3 个，轻量断言可运行
npx.cmd tsc --noEmit 通过
npm.cmd run build 通过
```

---

## 16. 风险与控制

### 16.1 P0 风险

LLM 调用次数增加：

```text
只校验最终 answer60s 或 bestMergedAnswer
不对每个 Agent 输出都做 verifier
不做多轮修正循环
```

JSON 结构更复杂：

```text
所有新增字段 normalizer 都要兜底
数组字段缺失时补 []
对象字段缺失时补默认对象
API route 不直接暴露原始模型错误
```

Evidence refs 不匹配：

```text
Normalizer 校验 evidenceCardId 是否存在
不存在则尝试按 title 匹配
仍匹配不到则丢弃该 ref，并写入 missingInfo
```

Verifier 过度保守：

```text
Verifier 只指出风险，不强制删除所有亮点
Composer 只有在 high severity 或 revisedAnswer 明确更安全时才采用修正版
保留 Synthesizer 原回答作为参考
```

### 16.2 P1 风险

报告信息过载：

```text
报告默认展示摘要、最佳回答、关键风险
证据依据和校验详情放在后部或折叠区
Copy/Markdown 保留重点，不输出完整 Agent JSON
```

成熟度被误解为打分：

```text
文案使用“当前可训练层级”
避免使用“低分”“差”等词
每个等级都给出下一步升级方向
```

冲突规则过度复杂：

```text
只做确定性优先级规则
不新增复杂 Agent 协商
不做多轮自我修正
```

---

## 17. 与 FrontendOptimizationPlan 的关系

`FrontendOptimizationPlan.md` 解决作品形态问题：

```text
首页说明、步骤引导、Loading、摘要卡、示例数据、空状态
```

本文档解决质量问题：

```text
P0：证据引用、导师压力测试、安全回答、Verifier
P1：成熟度、报告分层、冲突规则、训练建议、静态质量样例
```

推荐顺序：

```text
如果 Demo 观感不足：先做 FrontendOptimizationPlan
如果报告内容质量不足：先做 Quality Opt P0
如果 P0 已稳定且还想增强作品完整度：继续做 Quality Opt P1
```

在当前项目状态下，功能和交互已经比较完整，因此可以优先做本文档中的 Quality Opt P0。

---

## 18. 最小可交付切片

### 18.1 P0 最小切片

如果时间有限，P0 只做以下内容：

```text
EvidenceCard 增加 id
Evidence Planner / Mapper 支持 evidenceCardId
Professor 增加 pressureTests
Synthesizer 增加 safeAnswer
新增 Verifier Agent
报告页展示 pressureTests 和 answerVerification
build 通过
handoff
```

P0 不能后置：

```text
类型兜底
API Key 安全
前端空状态
构建验证
handoff
```

### 18.2 P1 最小切片

如果时间有限，P1 只做以下内容：

```text
新增 qualitySummary
新增 answerMaturity
报告顶部展示质量摘要和成熟度
Training Planner 根据 topRisk 生成下一题建议
新增 3 个静态质量样例
build 通过
handoff
```

P1 可以后置：

```text
gapClaims / versionClaims 的完整前端展示
更多静态样例
更细的 Copy/Markdown 排版
```

---

## 19. 最终判断

`7-QualityOptimizationPlan.md` 的方向整体可行，而且和当前代码状态匹配度较高。原因是：

```text
P1 已经完成 Evidence Planner / Mapper 拆分
runner 已经有预分析复用和并行诊断框架
Agent Trace 已经支持阶段和版本
前端已经有报告模块化组件
```

真正需要新增的核心代码主要集中在：

```text
类型扩展
Agent prompt/normalizer 增强
新增 Verifier Agent
Composer 聚合逻辑
报告展示组件
测试断言
```

这轮质量升级应该拆成两步：

```text
先用 P0 把产品升级为：基于材料证据、导师压力测试和安全校验的高可信复盘系统
再用 P1 把产品升级为：可分层阅读、可解释成熟度、可持续训练的复盘助理
```
